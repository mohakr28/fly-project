// backend/scripts/index_articles.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");
const LegalDocument = require("../models/LegalDocument");

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

const PINECONE_INDEX_NAME = "legal-articles";
const REGULATION_CELEX_ID = "32004R0261";
const VECTOR_DIMENSION = 1536;

async function initPinecone() {
    if (!process.env.PINECONE_API_KEY) {
        throw new Error("Pinecone API Key is not set in .env file.");
    }
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    const existingIndexes = await pinecone.listIndexes();
    const indexNames = existingIndexes.indexes?.map(index => index.name) || [];
    if (!indexNames.includes(PINECONE_INDEX_NAME)) {
        console.log(`Creating new index: "${PINECONE_INDEX_NAME}" with ${VECTOR_DIMENSION} dimensions...`);
        await pinecone.createIndex({
            name: PINECONE_INDEX_NAME,
            dimension: VECTOR_DIMENSION,
            metric: "cosine",
            spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
        });
        console.log("Index created. Waiting for it to initialize...");
        await new Promise(resolve => setTimeout(resolve, 60000));
    } else {
        console.log(`Index "${PINECONE_INDEX_NAME}" already exists. Ensure its dimension is ${VECTOR_DIMENSION}.`);
    }
    return pinecone.Index(PINECONE_INDEX_NAME);
}

function initOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in .env file.");
    }
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        console.log("Initializing Pinecone...");
        const pineconeIndex = await initPinecone();
        console.log("Pinecone initialized.");
        
        const openai = initOpenAI();
        console.log("OpenAI client initialized.");

        // ... (بقية الكود لا يتغير)
        
    } catch (error) {
        console.error("An unexpected error occurred:", error);
    } finally {
        // تأكد من قطع الاتصال دائمًا
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

// ... (هنا يجب وضع بقية دالة main التي لم تتغير)
// ... سأضعها كاملة للوضوح

async function main() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected.");

        console.log("Initializing Pinecone...");
        const pineconeIndex = await initPinecone();
        console.log("Pinecone initialized.");
        
        const openai = initOpenAI();
        console.log("OpenAI client initialized.");

        console.log(`Fetching regulation ${REGULATION_CELEX_ID} from DB...`);
        const regulation = await LegalDocument.findOne({ celexId: REGULATION_CELEX_ID });

        if (!regulation || !regulation.articles || regulation.articles.length === 0) {
            console.error(`Regulation not found or has no articles. Run the server first to seed data.`);
            return;
        }
        
        const articlesToIndex = regulation.articles.filter(article => !article.pineconeId);
        if (articlesToIndex.length === 0) {
            console.log("All articles are already indexed.");
            return;
        }

        console.log(`Found ${articlesToIndex.length} new articles to index...`);

        for (const article of articlesToIndex) {
            try {
                console.log(`- Indexing Article ${article.articleNumber}: "${article.title}"`);
                const textToEmbed = `Article ${article.articleNumber}: ${article.title}. Content: ${article.text}`;
                
                const embeddingResponse = await openai.embeddings.create({
                    model: "text-embedding-3-small",
                    input: textToEmbed,
                });

                if (!embeddingResponse?.data?.[0]?.embedding) {
                    console.error(`  - Invalid response from OpenAI for Article ${article.articleNumber}.`);
                    continue;
                }

                const vector = embeddingResponse.data[0].embedding;
                const pineconeId = `${regulation.celexId}-${article.articleNumber.replace(/\s+/g, '')}`;

                await pineconeIndex.upsert([{
                    id: pineconeId,
                    values: vector,
                    metadata: {
                        celex: regulation.celexId,
                        articleNumber: article.articleNumber,
                        title: article.title
                    }
                }]);
                
                const articleInDB = regulation.articles.find(a => a.articleNumber === article.articleNumber);
                if (articleInDB) articleInDB.pineconeId = pineconeId;

                console.log(`  - Successfully indexed with Pinecone ID: ${pineconeId}`);
                await new Promise(resolve => setTimeout(resolve, 500)); 

            } catch (error) {
                console.error(`  - Failed to index Article ${article.articleNumber}:`, error.message);
                if (error.response) {
                    console.error("  - API Error Details:", JSON.stringify(error.response.data, null, 2));
                }
            }
        }

        console.log("Saving updates to MongoDB...");
        await regulation.save();
        console.log("MongoDB updated.");
        
    } catch (error) {
        console.error("An unexpected error occurred:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB. Job finished.");
    }
}

main();