const Tesseract = require("tesseract.js");

class OCRService {
  /**
   * Extract text from an image file path using Tesseract.js
   * @param {string} filePath - Absolute or relative path to the image
   * @returns {Promise<string>} - The extracted raw text
   */
  async extractText(filePath) {
    if (!filePath) throw new Error("File path is required for OCR extraction");

    try {
      const result = await Tesseract.recognize(filePath, "eng");
      
      let rawText = result.data.text || "";

      // Lightweight OCR text sanitization
      // 1. Remove non-printable garbage safely (allow basic ascii, newlines, and common currency symbols)
      rawText = rawText.replace(/[^\x20-\x7E\n₹£€]/g, "");
      // 2. Remove timestamps (e.g. 10:58:22, 14:30) so they don't get parsed as amounts
      rawText = rawText.replace(/\b\d{1,2}:\d{2}(:\d{2})?\b/g, " ");
      // 3. Remove dates like 15/05/2026 or 2026-05-15
      rawText = rawText.replace(/\b\d{2,4}[-/]\d{2}[-/]\d{2,4}\b/g, " ");
      // 4. Preserve structure but prevent massive trailing gaps
      rawText = rawText.replace(/\n{3,}/g, "\n\n");
      // 5. Remove obvious garbage OCR characters like lonely symbols
      rawText = rawText.replace(/(^|\s)[|_\^`~=]+(\s|$)/g, " ");
      
      return rawText.trim();
    } catch (error) {
      console.error("Tesseract extraction error:", error);
      throw new Error("Could not read receipt. Please try a clearer image.");
    }
  }
}

module.exports = new OCRService();
