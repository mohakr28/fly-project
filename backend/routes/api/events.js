// backend/routes/api/events.js
const express = require("express");
const router = express.Router();
const Event = require("../../models/Event");
const auth = require("../../middleware/auth");

// @route   GET /api/events/pending
// @desc    Get paginated events with 'pending_approval' status
// @access  Private
router.get("/pending", auth, async (req, res) => {
  console.log("LOG: [GET /api/events/pending] Request received:", req.query);
  try {
    const { page = 1, limit = 9 } = req.query; // 9 items fit nicely in a 3-column grid

    const filter = { status: "pending_approval" };
    
    const totalEvents = await Event.countDocuments(filter);
    const pendingEvents = await Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    console.log(`LOG: [GET /api/events/pending] Found ${totalEvents} total, sending page ${page} with ${pendingEvents.length} events.`);

    res.json({
      events: pendingEvents,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalEvents / limit),
      totalEvents,
    });
  } catch (err) {
    console.error("ERROR: [GET /api/events/pending] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/events/:id/update-status
// @desc    Approve or reject an event
// @access  Private
router.put("/:id/update-status", auth, async (req, res) => {
  const { status, isExtraordinary } = req.body;
  const eventId = req.params.id;
  console.log(`LOG: [PUT /api/events/${eventId}/update-status] Request to update status. Body:`, req.body);

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status value." });
  }
  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: "Event not found." });
    }
    event.status = status;
    if (status === "approved") {
      event.isExtraordinary = isExtraordinary;
    }
    await event.save();

    if (req.app.locals) {
        const currentCount = await Event.countDocuments({ status: "pending_approval" });
        req.app.locals.pendingEventsCount = currentCount;
        console.log(`LOG: [Event Action] Global pending count updated to: ${currentCount}`);
    }

    res.json(event);
  } catch (err) {
    console.error(`ERROR: [PUT /api/events/${eventId}/update-status] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/events/context
// @desc    Get approved events relevant to a specific flight case
// @access  Private
router.post("/context", auth, async (req, res) => {
  const { affectedEntity, date } = req.body;
  if (!date) {
    return res.status(400).json({ msg: "Date is required." });
  }
  try {
    const queryDate = new Date(date);
    const query = {
      status: "approved",
      startDate: { $lte: queryDate },
      endDate: { $gte: queryDate },
    };
    if (affectedEntity) {
      query.affectedEntity = { $regex: affectedEntity, $options: "i" };
    }
    const relevantEvents = await Event.find(query);
    res.json(relevantEvents);
  } catch (err) {
    console.error("ERROR: [POST /api/events/context] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// New endpoint to get the count
router.get("/pending-count", auth, async (req, res) => {
    try {
        const count = req.app.locals.pendingEventsCount ?? await Event.countDocuments({ status: "pending_approval" });
        res.json({ count });
    } catch (err) {
        console.error("ERROR: [GET /api/events/pending-count] Server Error:", err.message);
        res.status(500).send("Server Error");
    }
});

module.exports = router;