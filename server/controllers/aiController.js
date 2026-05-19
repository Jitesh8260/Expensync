const nlpService = require("../services/nlpService");
const ocrService = require("../services/ocrService");
const fs = require("fs").promises;

exports.parseNLP = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) {
            return res.status(400).json({ msg: "Text is required for NLP parsing" });
        }

        const parsedData = await nlpService.parseTransactionText(text, { userId: req.user });
        res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error in NLP Parsing:", error);
        res.status(500).json({ msg: "Failed to parse text", error: error.message });
    }
};

exports.parseOCR = async (req, res) => {
  try {
    if (!req.file || !req.file.path) {
      return res.status(400).json({ msg: "Receipt image is required." });
    }

    // 1. Extract raw text via OCR
    const rawText = await ocrService.extractText(req.file.path);
    if (!rawText) {
      return res.status(400).json({ msg: "No text could be extracted from this image." });
    }

    // 2. Pipe into existing NLP parser with isOCR flag
    const parsedData = await nlpService.parseTransactionText(rawText, { isOCR: true, userId: req.user });
    
    // 3. Set specific source and return raw text for debug preview
    parsedData.source = "ocr";
    parsedData.rawText = rawText;

    // Partial Confidence Strategy
    // Don't generate fake titles if parser is completely unsure
    if (parsedData.title === "Smart Transaction") {
      parsedData.title = ""; 
    }

    res.status(200).json(parsedData);
  } catch (error) {
    console.error("Error in OCR Parsing:", error);
    res.status(500).json({ msg: error.message || "Failed to process receipt image." });
  } finally {
    // 4. Ephemeral File Strategy: Cleanup immediately
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(err => console.error("Failed to cleanup file:", err));
    }
  }
};
