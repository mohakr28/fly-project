// config/db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected...");
  } catch (err) {
    // If connection fails, log the error and exit the process
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
