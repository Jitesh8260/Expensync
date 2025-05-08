const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ msg: "No token provided. Authorization denied." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded.userId; // Attach userId to req for downstream use
        next();
    } catch (err) {
        return res.status(401).json({ msg: "Invalid or expired token." });
    }
};

module.exports = authMiddleware; // ✅ This line was missing
