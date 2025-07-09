// backend/services/eventService.js
const axios = require("axios");
const Event = require("../models/Event");

// قائمة بالكيانات التي نريد مراقبتها. يمكن توسيعها لاحقًا.
const MONITORED_ENTITIES = [
  "SAS",
  "Norwegian",
  "Lufthansa",
  "Air France",
  "Ryanair",
  "Copenhagen Airport",
  "Kastrup", // اسم آخر لمطار كوبنهاجن
];

// --- ✅ تحسين 1: إضافة مصطلحات طيران إلزامية لزيادة الدقة ---
// يجب أن يحتوي المقال على واحدة على الأقل من هذه الكلمات ليكون ذا صلة.
const AVIATION_TERMS = [
  "flight",
  "airline",
  "aircraft",
  "airport",
  "aviation",
  "passenger",
  "air travel",
];

// --- ✅ تحسين 2: تركيز قائمة كلمات المشاكل ---
// الكلمات المفتاحية التي تدل على وجود مشكلة تؤثر على الرحلات
const PROBLEM_KEYWORDS = [
  "strike",
  "protest",
  "disruption",
  "cancellation", // استخدام صيغة المفرد للحصول على نتائج أوسع (cancellation, cancellations)
  "delay",
  "outage",
  "closure",
  "staff shortage",
  "technical issue",
  "emergency",
];

/**
 * Fetches news articles for a specific entity (e.g., an airline).
 * @param {string} entity - The name of the entity to search for.
 * @returns {Array} - A list of relevant articles.
 */
const fetchNewsForEntity = async (entity) => {
  if (
    !process.env.NEWSAPI_KEY ||
    process.env.NEWSAPI_KEY === "YOUR_NEWSAPI_KEY"
  ) {
    console.warn("NewsAPI key is not configured. Skipping news fetch.");
    return [];
  }

  // --- ✅ تحسين 3: بناء استعلام بحث أكثر ذكاءً ودقة ---
  const entityQuery = `"${entity}"`; // البحث عن الكيان كعبارة دقيقة
  const aviationTermsQuery = AVIATION_TERMS.join(" OR ");
  const problemKeywordsQuery = PROBLEM_KEYWORDS.join(" OR ");

  // الاستعلام النهائي: (الكيان) و (مصطلح طيران) و (كلمة مشكلة)
  const query = `${entityQuery} AND (${aviationTermsQuery}) AND (${problemKeywordsQuery})`;

  // البحث في آخر 7 أيام (مناسب للخطة المجانية)
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const response = await axios.get("https://newsapi.org/v2/everything", {
      params: {
        q: query,
        apiKey: process.env.NEWSAPI_KEY,
        language: "en",
        sortBy: "relevancy", // relevancy أفضل من publishedAt للعثور على أفضل تطابق
        from: sevenDaysAgo,
        pageSize: 20, // تحديد عدد النتائج لتقليل الضوضاء أكثر
      },
    });
    return response.data.articles || [];
  } catch (error) {
    console.error(
      `Error fetching news for entity "${entity}":`,
      error.response?.data?.message || error.message
    );
    return [];
  }
};

/**
 * Main function to fetch news and create 'pending_approval' events in the DB.
 * This function is designed to be called by a daily cron job.
 */
const fetchAndStoreEvents = async () => {
  console.log(
    "Running daily job to fetch and store external events from NewsAPI..."
  );

  for (const entity of MONITORED_ENTITIES) {
    console.log(`[NewsAPI] Searching for articles related to: ${entity}`);
    const articles = await fetchNewsForEntity(entity);

    if (articles.length === 0) {
      console.log(`[NewsAPI] No new relevant articles found for ${entity}.`);
      continue;
    }

    console.log(
      `[NewsAPI] Found ${articles.length} potential articles for ${entity}.`
    );

    for (const article of articles) {
      try {
        // التحقق مما إذا كان هذا المقال موجودًا بالفعل
        const existingEvent = await Event.findOne({ sourceUrl: article.url });
        if (existingEvent) {
          continue; // تخطي المقال إذا كان موجودًا
        }

        // إنشاء سجل حدث جديد بحالة "في انتظار الموافقة"
        const newEvent = new Event({
          affectedEntity: entity,
          summary: article.title, // عنوان المقال كملخص مبدئي
          source: "NewsAPI",
          sourceUrl: article.url,
          status: "pending_approval",
          // نضع تاريخ النشر كتاريخ بداية ونهاية مبدئي، ليتم تعديله يدويًا
          startDate: new Date(article.publishedAt),
          endDate: new Date(article.publishedAt),
        });

        await newEvent.save();
        console.log(
          `[Event Service] Stored new pending event: "${article.title}"`
        );
      } catch (error) {
        // نتجاهل أخطاء التكرار (duplicate key) بصمت
        if (error.code !== 11000) {
          console.error(
            `Error saving event for article "${article.title}":`,
            error.message
          );
        }
      }
    }
  }

  console.log("Daily event fetching job from NewsAPI completed.");
};

module.exports = { fetchAndStoreEvents };
