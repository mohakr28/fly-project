// backend/services/eventService.js
const Event = require("../models/Event");

/**
 * NOTE: This is a placeholder service. A real implementation would:
 * 1. Connect to the DST (Statistics Denmark) API or other news/data sources.
 * 2. Parse the data to find relevant events (e.g., strikes affecting airlines).
 * 3. Create or update records in the 'events' collection in the database.
 *
 * This function is designed to be called by a daily cron job.
 */
const fetchAndStoreEvents = async () => {
  console.log("Running daily job to fetch and store external events...");

  // Example: In a real scenario, you would fetch and process data here.
  // For now, we can ensure a demo event exists for testing.
  try {
    const demoEvent = {
      eventType: "Strike",
      affectedEntity: "SAS", // Use a common airline for easy testing
      startDate: new Date("2025-06-24T00:00:00.000Z"),
      endDate: new Date("2025-06-30T23:59:59.999Z"),
      summary: "Pilot and cabin crew strike over new contract terms.",
      source: "Demo Data",
    };

    // Use findOneAndUpdate with upsert to avoid creating duplicate demo events
    await Event.findOneAndUpdate(
      {
        affectedEntity: demoEvent.affectedEntity,
        eventType: demoEvent.eventType,
      },
      demoEvent,
      { upsert: true }
    );
    console.log("Daily event fetching job completed.");
  } catch (error) {
    console.error("Error in daily event fetching job:", error.message);
  }
};

module.exports = { fetchAndStoreEvents };
