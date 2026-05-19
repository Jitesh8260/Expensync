import { useState, useRef } from "react";
import { Upload, Loader2, Camera, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { parseReceiptWithOCR } from "../api/api";
import { showErrorToast } from "../utils/toast";

const ReceiptDropzone = ({ onParseSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [parsedSummary, setParsedSummary] = useState(null);
  const [rawTextPreview, setRawTextPreview] = useState("");
  const [showRawText, setShowRawText] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const processFile = async (file) => {
    const validTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      showErrorToast("Invalid file type. Please upload a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErrorToast("File is too large. Please upload an image under 5MB.");
      return;
    }

    setLoading(true);
    setRawTextPreview("");
    setShowRawText(false);

    try {
      const formData = new FormData();
      formData.append("receipt", file);

      const parsedData = await parseReceiptWithOCR(formData);
      
      if (parsedData.rawText) {
        setRawTextPreview(parsedData.rawText);
      }
      
      // Capture summary
      if (parsedData.title || parsedData.amount) {
        setParsedSummary({
          title: parsedData.title,
          amount: parsedData.amount,
          category: parsedData.category
        });
      }

      if (onParseSuccess) {
        onParseSuccess(parsedData);
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-6 rounded-2xl mb-8 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-300">
      <div
        className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer ${
          dragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
        } ${loading ? "opacity-70 pointer-events-none" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={handleChange}
          disabled={loading}
        />

        {loading ? (
          <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="font-semibold text-sm text-center">Processing Receipt...</p>
            <p className="text-xs opacity-80 max-w-[250px] text-center">Extracting transaction details from receipt...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
            <Camera className="w-10 h-10 mb-2 text-slate-400 dark:text-slate-500" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Click to upload or drag and drop
            </p>
            <p className="text-xs">JPG, PNG, WEBP up to 5MB</p>
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 text-center max-w-[250px] font-medium bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
              Ephemeral: Image is deleted instantly after parsing.
            </p>
          </div>
        )}
      </div>

      {parsedSummary && (
        <div className="mt-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col gap-2">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Extracted Details</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Detected Merchant</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{parsedSummary.title || "Unknown"}</span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider block mb-0.5">Detected Payment</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{parsedSummary.amount ? `₹${Math.abs(parsedSummary.amount)}` : "Unknown"}</span>
            </div>
          </div>
        </div>
      )}

      {rawTextPreview && (
        <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <button 
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="w-full flex items-center justify-between p-3 bg-slate-50/50 dark:bg-slate-800/30 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <div className="flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5" />
              View Raw OCR Text
            </div>
            {showRawText ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          
          {showRawText && (
            <div className="p-3 bg-slate-100/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
              <pre className="text-xs text-slate-500 dark:text-slate-500 whitespace-pre-wrap overflow-y-auto max-h-32 font-mono">
                {rawTextPreview}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReceiptDropzone;
