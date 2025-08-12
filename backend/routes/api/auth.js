// backend/routes/api/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const auth = require("../../middleware/auth");

// @route   GET /api/auth
// @desc    Get logged in user
// @access  Private
router.get("/", auth, async (req, res) => {
  console.log(`LOG: [GET /api/auth] Attempting to fetch user data for user ID: ${req.user.id}`);
  try {
    const user = await User.findById(req.user.id).select("-password");
    console.log(`LOG: [GET /api/auth] Successfully fetched user: ${user.name}`);
    res.json(user);
  } catch (err) {
    console.error(`ERROR: [GET /api/auth] Server Error for user ID ${req.user.id}:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  console.log(`LOG: [POST /api/auth/register] Received registration request for email: ${email}`);

  try {
    // Check if user with this email already exists
    let user = await User.findOne({ email });
    if (user) {
      console.warn(`LOG: [POST /api/auth/register] Registration failed. Email already exists: ${email}`);
      return res
        .status(400)
        .json({ msg: "User with this email already exists" });
    }

    // Check if username is already taken
    let existingName = await User.findOne({ name });
    if (existingName) {
      console.warn(`LOG: [POST /api/auth/register] Registration failed. Name already taken: ${name}`);
      return res.status(400).json({ msg: "Username is already taken" });
    }

    user = new User({
      name,
      email,
      password,
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    console.log(`LOG: [POST /api/auth/register] User registered successfully. User ID: ${user.id}`);


    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        console.log(`LOG: [POST /api/auth/register] JWT token generated for user ID: ${user.id}`);
        res.status(201).json({ token });
      }
    );
  } catch (err) {
    console.error(`ERROR: [POST /api/auth/register] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (using email or name)
// @access  Public
router.post("/login", async (req, res) => {
  // 1. استقبال 'login' بدلاً من 'email'
  const { login, password } = req.body;
  console.log(`LOG: [POST /api/auth/login] Received login request for user: '${login}'`);


  try {
    // 2. المنطق الديناميكي للبحث
    // يتحقق مما إذا كان الإدخال يحتوي على '@' ليعرف هل هو بريد إلكتروني أم اسم مستخدم
    const isEmail = login.includes("@");
    const query = isEmail ? { email: login } : { name: login };
    console.log(`LOG: [POST /api/auth/login] Searching DB with query:`, query);


    // 3. البحث في قاعدة البيانات باستخدام الشرط المناسب
    let user = await User.findOne(query);
    if (!user) {
      console.warn(`LOG: [POST /api/auth/login] Login failed. Invalid credentials for user: '${login}'`);
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // 4. مقارنة كلمة المرور (لا تغيير هنا)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`LOG: [POST /api/auth/login] Login failed. Incorrect password for user: '${login}'`);
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // 5. إرجاع التوكن (لا تغيير هنا)
    const payload = {
      user: {
        id: user.id,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        console.log(`LOG: [POST /api/auth/login] Login successful. JWT token generated for user ID: ${user.id}`);
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(`ERROR: [POST /api/auth/login] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;  