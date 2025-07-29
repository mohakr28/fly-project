// backend/routes/api/events.js
const express = require("express");
const router = express.Router();
const Event = require("../../models/Event");
const auth = require("../../middleware/auth"); // <-- استيراد الـ middleware

// @route   GET /api/events/pending
// @desc    Get all events with 'pending_approval' status
// @access  Private (محمي الآن)
router.get("/pending", auth, async (req, res) => {
  // <-- الـ middleware مطبق هنا
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
// @access  Private (محمي الآن)
router.put("/:id/update-status", auth, async (req, res) => {
  // <-- الـ middleware مطبق هنا
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
