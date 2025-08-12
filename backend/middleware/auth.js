// backend/middleware/auth.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  // 1. Get token from header
  const token = req.header("x-auth-token");
  console.log("LOG: [Auth Middleware] Checking for token...");

  // 2. Check if not token
  if (!token) {
    console.log("LOG: [Auth Middleware] No token found. Denying authorization.");
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  // 3. Verify token
  try {
    console.log("LOG: [Auth Middleware] Token found. Verifying...");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user from payload to the request object
    req.user = decoded.user;
    console.log(`LOG: [Auth Middleware] Token is valid. User ID: ${req.user.id}`);
    next();
  } catch (err) {
    console.error("LOG: [Auth Middleware] Token verification failed.", err.message);
    res.status(401).json({ msg: "Token is not valid" });
  }
};