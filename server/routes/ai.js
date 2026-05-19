const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");
const aiController = require("../controllers/aiController");

// Parse natural language to transaction object
router.post("/nlp-parse", authMiddleware, aiController.parseNLP);

// Parse receipt image to transaction object via OCR -> NLP
router.post("/ocr-parse", authMiddleware, upload.single("receipt"), aiController.parseOCR);

module.exports = router;
