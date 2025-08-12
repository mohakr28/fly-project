// backend/services/legalMonitorService.js
const axios = require("axios");
// Although we are not using it now, it's good to keep it for the future
const Parser = require("rss-parser");
const LegalDocument = require("../models/LegalDocument");

const SPARQL_ENDPOINT = "http://publications.europa.eu/webapi/rdf/sparql";

// ==== 1. SPARQL data fetching function (with a corrected query) ====
const getDocumentLastUpdate = async (celexId) => {
  // ✅ ==== Simplest and most flexible query ====
  // This query searches for any "work" that contains the Celex ID as text
  // and fetches the latest associated date.
  const query = `
        PREFIX cdm: <http://publications.europa.eu/ontology/cdm#>
        SELECT ?date
        WHERE {
            ?work cdm:resource_legal_id_celex ?celex .
            ?work cdm:date_document ?date .
            FILTER CONTAINS(STR(?celex), "${celexId}")
        }
        ORDER BY DESC(?date)
        LIMIT 1
    `;

  try {
    const fullUrl = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}`;
    console.log(`LOG: [Legal Monitor] Executing SPARQL query for ${celexId}`);
    const response = await axios.get(fullUrl, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "FlightDeck-Legal-Monitor/1.0",
      },
      timeout: 30000,
    });

    const bindings = response.data?.results?.bindings;
    if (bindings && bindings.length > 0) {
      const result = bindings[0];
      console.log(`LOG: [Legal Monitor] Found update info for ${celexId}. Date: ${result.date?.value}`);
      return {
        mostRecentDate: result.date?.value,
      };
    }
    // If no results are found, return null
    console.warn(`LOG: [Legal Monitor] No SPARQL results found for ${celexId}.`);
    return null;
  } catch (error) {
    console.error(`ERROR: [Legal Monitor] Error fetching update info for ${celexId}:`, error.message);
    return null;
  }
};

// ==== 2. Advanced Update Monitor Class (no change in logic) ====
class LegalDocumentMonitor {
  constructor(options = {}) {
    this.checkInterval = options.checkInterval || 12 * 60 * 60 * 1000; // 12 hours
    this.onUpdate =
      options.onUpdate ||
      (async (update) => {
        console.log(
          `🔔 LOG: [Legal Monitor] Default onUpdate: Update detected for ${update.celexId}. Marking for review.`
        );
        await LegalDocument.updateOne(
          { celexId: update.celexId },
          {
            $set: {
              needsReview: true,
              lastLiveDate: update.newDate,
              // We also update the publication date
              publicationDate: update.newDate,
            },
          }
        );
      });
    this.documents = new Map();
    this.monitoringInterval = null;
  }

  addDocument(celexId, currentDate) {
    if (!celexId || !currentDate) {
      console.warn(
        "LOG: [Legal Monitor] Attempted to add a document with invalid celexId or currentDate."
      );
      return;
    }
    this.documents.set(celexId, {
      celexId,
      lastKnownDate: new Date(currentDate),
    });
    console.log(`LOG: [Legal Monitor] Document ${celexId} added for monitoring.`);
  }

  async checkForUpdates() {
    if (this.documents.size === 0) {
      console.log("LOG: [Legal Monitor] No documents to check for updates.");
      return;
    }

    console.log(
      `LOG: [Legal Monitor] Checking ${this.documents.size} documents for updates...`
    );
    const updates = [];

    for (const [celexId, docInfo] of this.documents) {
      // Ignore invalid identifiers
      if (!celexId.startsWith("320")) {
        console.log(`LOG: [Legal Monitor] Skipping invalid Celex ID format: ${celexId}`);
        continue;
      }

      try {
        console.log(`LOG: [Legal Monitor] Checking document: ${celexId}. Last known date: ${docInfo.lastKnownDate.toISOString()}`);
        const updateInfo = await getDocumentLastUpdate(celexId);

        if (updateInfo && updateInfo.mostRecentDate) {
          const liveDate = new Date(updateInfo.mostRecentDate);

          if (liveDate > docInfo.lastKnownDate) {
            console.warn(`❗ LOG: [Legal Monitor] UPDATE FOUND for ${celexId}. Old: ${docInfo.lastKnownDate.toISOString()}, New: ${liveDate.toISOString()}`);
            const update = {
              celexId,
              oldDate: docInfo.lastKnownDate,
              newDate: liveDate,
            };
            updates.push(update);
            // Update the last known date in memory
            docInfo.lastKnownDate = liveDate;
            // Trigger the onUpdate callback (which saves to DB)
            await this.onUpdate(update);
          } else {
            console.log(`LOG: [Legal Monitor] Document ${celexId} is up-to-date.`);
            // Just update the verification date
            await LegalDocument.updateOne(
              { celexId: celexId },
              { $set: { lastVerifiedAt: new Date(), needsReview: false } }
            );
          }
        } else {
          console.warn(
            `LOG: [Legal Monitor] Could not retrieve update info for ${celexId}.`
          );
        }
      } catch (error) {
        console.error(`ERROR: [Legal Monitor] Error checking ${celexId}:`, error);
      }
      // Add a delay between requests to be polite to the server
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    console.log(`LOG: [Legal Monitor] Check complete. Found ${updates.length} updates.`);
    return updates;
  }

  start() {
    if (this.monitoringInterval) {
      console.log("LOG: [Legal Monitor] Monitor is already running.");
      return;
    }
    console.log("LOG: [Legal Monitor] Performing initial check on startup in 5 seconds...");
    // Wait a few seconds before the first check
    setTimeout(() => this.checkForUpdates(), 5000);

    this.monitoringInterval = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);

    console.log(
      `LOG: [Legal Monitor] Started. Will check every ${
        this.checkInterval / 1000 / 60 / 60
      } hours.`
    );
  }

  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("LOG: [Legal Monitor] Stopped.");
    }
  }
}

module.exports = { LegalDocumentMonitor };