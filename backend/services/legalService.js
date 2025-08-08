// backend/services/legalService.js
const axios = require("axios");
const LegalDocument = require("../models/LegalDocument");

// The SPARQL endpoint for the EU Publications Office
const SPARQL_ENDPOINT = "http://publications.europa.eu/webapi/rdf/sparql";

/**
 * Executes a SPARQL query against the EUR-Lex endpoint.
 * @param {string} query - The SPARQL query string.
 * @returns {Promise<object|null>} The first binding from the results, or null if no results or an error occurs.
 */
const queryEurLex = async (query) => {
  // Construct the full URL with the encoded query
  const fullUrl = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
  try {
    // Perform a GET request to the SPARQL endpoint
    const response = await axios.get(fullUrl, {
      headers: {
        Accept: "application/sparql-results+json", // We expect a JSON response
        // A common user agent to avoid being blocked
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
      },
      timeout: 20000, // Set a 20-second timeout for the request
    });
    // Extract the bindings from the response data
    const bindings = response.data?.results?.bindings;
    // Return the first result if available, otherwise null
    return bindings && bindings.length > 0 ? bindings[0] : null;
  } catch (error) {
    // Log an error if the SPARQL query fails
    console.error(
      `SPARQL query failed for query: ${query.substring(0, 100)}... Error: ${
        error.message
      }`
    );
    return null;
  }
};

/**
 * Checks a single legal document against the live EUR-Lex data.
 * @param {object} localDoc - The document object from our MongoDB.
 */
const verifyDocument = async (localDoc) => {
  console.log(`Verifying document: ${localDoc.celexId}`);

  // Try several query patterns to find the document, as the data structure can vary.
  const queries = [
    // Primary pattern: Looks for consolidations first, then the original work.
    `
      PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
      SELECT ?date ?uri
      WHERE {
        {
          # Search for the consolidated version
          ?consolidation cdm:consolidates <http://publications.europa.eu/resource/celex/${localDoc.celexId}> .
          ?consolidation cdm:date_document ?date .
          BIND(?consolidation AS ?uri)
        } UNION {
          # Search for the original document
          <http://publications.europa.eu/resource/celex/${localDoc.celexId}> cdm:date_document ?date .
          BIND(<http://publications.europa.eu/resource/celex/${localDoc.celexId}> AS ?uri)
        }
      }
      ORDER BY DESC(?date)
      LIMIT 1
      `,

    // Alternative pattern: Searches using the CELEX identifier as a literal.
    `
      PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      SELECT ?date ?uri
      WHERE {
        ?work cdm:resource_legal_id_celex "${localDoc.celexId}" .
        {
          ?consolidation cdm:consolidates ?work .
          ?consolidation cdm:date_document ?date .
          BIND(?consolidation AS ?uri)
        } UNION {
          ?work cdm:date_document ?date .
          BIND(?work AS ?uri)
        }
      }
      ORDER BY DESC(?date)
      LIMIT 1
      `,

    // Third pattern: Searches within "expressions" of the work.
    `
      PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
      SELECT ?date ?uri
      WHERE {
        ?expression cdm:resource_legal_id_celex "${localDoc.celexId}" .
        ?expression cdm:date_document ?date .
        BIND(?expression AS ?uri)
      }
      ORDER BY DESC(?date)
      LIMIT 1
      `,
  ];

  let result = null;
  let queryUsed = null;

  // Try the queries sequentially until we find a result.
  for (let i = 0; i < queries.length; i++) {
    try {
      console.log(`Trying query pattern ${i + 1} for ${localDoc.celexId}`);
      result = await queryEurLex(queries[i]);

      if (result && result.date) {
        queryUsed = i + 1;
        console.log(`Success with query pattern ${queryUsed}`);
        break; // Exit the loop on success
      }
    } catch (error) {
      console.log(`Query pattern ${i + 1} failed:`, error.message);
    }
  }

  // If no result is found after trying all patterns.
  if (!result || !result.date) {
    console.log(
      `Could not verify ${localDoc.celexId}. Tried ${queries.length} query patterns. Source might be temporarily unavailable or document structure changed.`
    );
    // Log the last verification attempt, even if it failed.
    localDoc.lastVerifiedAt = new Date();
    localDoc.verificationStatus = "failed";
    await localDoc.save();
    return;
  }

  const liveDate = new Date(result.date.value);
  const localDate = new Date(localDoc.publicationDate);

  console.log(`Document found using query pattern ${queryUsed}`);
  console.log(`Local date: ${localDate.toISOString()}`);
  console.log(`Live date: ${liveDate.toISOString()}`);

  // Compare dates with a margin of error to handle potential timezone differences or slight discrepancies.
  const timeDifference = liveDate.getTime() - localDate.getTime();
  const oneDayInMs = 24 * 60 * 60 * 1000;

  // If the live version is significantly newer than the local one.
  if (timeDifference > oneDayInMs) {
    console.warn(`
          ❗ REVIEW NEEDED for ${localDoc.celexId}.
          - Local Date: ${localDate.toISOString().split("T")[0]}
          - Live Date:  ${liveDate.toISOString().split("T")[0]}
          - Time Difference: ${Math.ceil(timeDifference / oneDayInMs)} days
          - Found using query pattern: ${queryUsed}
          - Marking for manual review.
      `);
    localDoc.needsReview = true;
    localDoc.verificationStatus = "needs_review";
  } else {
    // Everything is up-to-date, remove the review flag if it exists.
    localDoc.needsReview = false;
    localDoc.verificationStatus = "up_to_date";
    console.log(`✅ Document ${localDoc.celexId} is up to date`);
  }

  // Save additional information for future reference and debugging.
  localDoc.lastVerifiedAt = new Date();
  localDoc.lastLiveDate = liveDate;
  localDoc.queryPatternUsed = queryUsed;

  // Save the source URI if it is available.
  if (result.uri) {
    localDoc.sourceUri = result.uri.value;
  }

  await localDoc.save();

  // Return a summary of the verification result.
  return {
    status: localDoc.verificationStatus,
    localDate: localDate,
    liveDate: liveDate,
    needsReview: localDoc.needsReview,
    queryPattern: queryUsed,
  };
};

/**
 * Helper function to verify a batch of documents with rate limiting.
 * @param {Array<object>} documents - An array of document objects to verify.
 * @param {object} [options={}] - Configuration options.
 * @param {number} [options.batchSize=5] - Number of documents to process in parallel.
 * @param {number} [options.delayBetweenBatches=1000] - Milliseconds to wait between batches.
 * @param {function} [options.onProgress=null] - A callback function for progress updates.
 */
const verifyDocuments = async (documents, options = {}) => {
  const {
    batchSize = 5,
    delayBetweenBatches = 1000,
    onProgress = null,
  } = options;

  const results = [];

  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);

    console.log(
      `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
        documents.length / batchSize
      )}`
    );

    // Process the batch of documents in parallel
    const batchPromises = batch.map((doc) =>
      verifyDocument(doc).catch((error) => {
        console.error(`Error verifying ${doc.celexId}:`, error);
        return { error: error.message, celexId: doc.celexId };
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Call the progress callback if provided
    if (onProgress) {
      onProgress({
        completed: i + batch.length,
        total: documents.length,
        batchResults: batchResults,
      });
    }

    // Delay between batches to avoid overwhelming the server.
    if (i + batchSize < documents.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
};

/**
 * The main verification job that runs periodically.
 */
const runVerificationJob = async () => {
  console.log("Starting periodic legal document verification job...");
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // ✅ ==== Main change here ====
  // Find documents that:
  // 1. Do not have a `lastVerifiedAt` field at all (to verify them for the first time).
  // 2. Or have a `lastVerifiedAt` field with a date older than a week.
  const documentsToVerify = await LegalDocument.find({
    $or: [
      { lastVerifiedAt: { $exists: false } },
      { lastVerifiedAt: { $lt: oneWeekAgo } },
    ],
  });
  // =============================

  if (documentsToVerify.length === 0) {
    console.log("No documents need verification at this time.");
    return;
  }

  console.log(`Found ${documentsToVerify.length} documents to verify.`);

  // Note: For a large number of documents, consider using the `verifyDocuments` helper
  // to process in batches, e.g., `await verifyDocuments(documentsToVerify);`
  for (const doc of documentsToVerify) {
    await verifyDocument(doc);
  }

  console.log("Verification job completed.");
};

module.exports = { runVerificationJob, verifyDocument, verifyDocuments };
