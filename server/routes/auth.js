const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const User = require("../models/User");

const router = express.Router();


// Rate Limiter (Brute-force protection)

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // max 5 attempts per IP
    message: { msg: "Too many login attempts. Try again after 15 minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // ✅ Only count failed login attempts
});


// Signup

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) return res.status(400).json({ msg: "Please provide all required fields." });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: "User already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).json({ msg: "User registered successfully!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});


// Login

router.post("/login", loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ msg: "Please provide both email and password." });
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        const refreshToken = jwt.sign({ userId: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

        // Store refresh token in user
        user.refreshTokens.push(refreshToken);
        await user.save();

        res.json({ accessToken, refreshToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});


// Refresh Token

router.post("/refresh-token", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ msg: "No refresh token provided" });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user || !user.refreshTokens.includes(refreshToken)) {
            return res.status(403).json({ msg: "Refresh token not recognized" });
        }

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
        res.json({ accessToken });
    } catch (err) {
        res.status(403).json({ msg: "Invalid or expired refresh token" });
    }
});


// Logout

router.post("/logout", async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ msg: "Refresh token required" });

    try {
        const user = await User.findOne({ refreshTokens: refreshToken });
        if (user) {
            user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
            await user.save();
        }
        res.json({ msg: "Logged out successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: "Server Error" });
    }
});

module.exports = router;
