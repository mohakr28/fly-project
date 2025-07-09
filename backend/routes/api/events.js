// backend/routes/api/events.js
const express = require("express");
const router = express.Router();
const Event = require("../../models/Event");

// @route   GET /api/events/pending
// @desc    Get all events with 'pending_approval' status
// @access  Public (for now, can be protected later)
router.get("/pending", async (req, res) => {
  try {
    const pendingEvents = await Event.find({ status: "pending_approval" }).sort(
      {
        createdAt: -1,
      }
    );
    res.json(pendingEvents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/events/:id/update-status
// @desc    Approve or reject an event
// @access  Public (for now, can be protected later)
router.put("/:id/update-status", async (req, res) => {
  const { status, isExtraordinary } = req.body;

  // Basic validation
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ msg: "Invalid status value." });
  }

  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: "Event not found." });
    }

    event.status = status;
    // Set isExtraordinary only if the event is being approved
    if (status === "approved") {
      event.isExtraordinary = isExtraordinary;
    }

    await event.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
