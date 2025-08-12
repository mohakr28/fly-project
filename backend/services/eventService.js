// backend/services/eventService.js
const axios = require("axios");
const Event = require("../models/Event");

const MONITORED_ENTITIES = [
  "SAS", "Norwegian", "Lufthansa", "Air France", "Ryanair",
  "Copenhagen Airport", "Kastrup",
];
const AVIATION_TERMS = [
  "flight", "airline", "aircraft", "airport", "aviation", "passenger", "air travel",
];
const PROBLEM_KEYWORDS = [
  "strike", "protest", "disruption", "cancellation", "delay", "outage",
  "closure", "staff shortage", "technical issue", "emergency",
];

const fetchNewsForEntity = async (entity) => {
  if (!process.env.NEWSAPI_KEY || process.env.NEWSAPI_KEY === "YOUR_NEWSAPI_KEY") {
    console.warn("LOG: [NewsAPI] NewsAPI key is not configured. Skipping news fetch.");
    return [];
  }
  const entityQuery = `"${entity}"`;
  const aviationTermsQuery = AVIATION_TERMS.join(" OR ");
  const problemKeywordsQuery = PROBLEM_KEYWORDS.join(" OR ");
  const query = `${entityQuery} AND (${aviationTermsQuery}) AND (${problemKeywordsQuery})`;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    console.log(`LOG: [NewsAPI] Fetching news for '${entity}'...`);
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: { q: query, apiKey: process.env.NEWSAPI_KEY, language: "en",
                sortBy: "relevancy", from: sevenDaysAgo, pageSize: 20 },
    });
    return response.data.articles || [];
  } catch (error) {
    console.error(`ERROR: [NewsAPI] Error fetching news for entity "${entity}":`,
                  error.response?.data?.message || error.message);
    return [];
  }
};

const fetchAndStoreEvents = async (app) => {
  console.log("LOG: [Job] Running job to fetch and store external events...");
  let newEventsFound = false;

  for (const entity of MONITORED_ENTITIES) {
    const articles = await fetchNewsForEntity(entity);
    if (articles.length === 0) continue;

    for (const article of articles) {
      try {
        const existingEvent = await Event.findOne({ sourceUrl: article.url });
        if (existingEvent) continue;

        const newEvent = new Event({
          affectedEntity: entity,
          summary: article.title,
          source: "NewsAPI",
          sourceUrl: article.url,
          status: "pending_approval",
          startDate: new Date(article.publishedAt),
          endDate: new Date(article.publishedAt),
        });
        await newEvent.save();
        newEventsFound = true;
        console.log(`LOG: [Event Service] Stored new pending event: "${article.title}"`);
      } catch (error) {
        if (error.code !== 11000) {
          console.error(`Error saving event for article "${article.title}":`, error.message);
        }
      }
    }
  }

  if (newEventsFound && app && app.locals) {
    const currentCount = await Event.countDocuments({ status: "pending_approval" });
    app.locals.pendingEventsCount = currentCount;
    console.log(`LOG: [Event Service] Global pending events count updated to: ${app.locals.pendingEventsCount}`);
  }
  
  console.log("LOG: [Job] Event fetching job completed.");
};

module.exports = { fetchAndStoreEvents };