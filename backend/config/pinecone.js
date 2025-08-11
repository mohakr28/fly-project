// backend/config/pinecone.js
const { Pinecone } = require("@pinecone-database/pinecone");
const { OpenAI } = require("openai");

let pineconeIndex;
let openai;

async function initVectorServices() {
    try {
        console.log("Initializing Pinecone client...");
        const pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        
        pineconeIndex = pinecone.Index("legal-articles");
        console.log("Pinecone client initialized successfully.");

        console.log("Initializing OpenAI client for embeddings...");
        if (!process.env.OPENAI_API_KEY) {
            throw new Error("OPENAI_API_KEY is not set in your .env file.");
        }
        
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        console.log("OpenAI client initialized successfully.");

    } catch (error) {
        console.error("Fatal: Failed to initialize vector services. Semantic search will not work.", error);
        throw error;
    }
}

function getPineconeIndex() {
    if (!pineconeIndex) throw new Error("Pinecone index has not been initialized. Check server startup logs.");
    return pineconeIndex;
}

function getOpenAI() {
    if (!openai) throw new Error("OpenAI client has not been initialized. Check server startup logs.");
    return openai;
}

module.exports = { initVectorServices, getPineconeIndex, getOpenAI };