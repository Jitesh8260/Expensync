import { useState, useCallback } from "react";
import { createTransaction, invalidatePredictionCache } from "../api/api"; 
import SmartInputBar from "./SmartInputBar";
import ReceiptDropzone from "./ReceiptDropzone";
import { Sparkles, MessageSquare, Camera, CheckCircle2, AlertCircle, FileText } from "lucide-react";

const tagsList = ["Essential", "Urgent", "Recurring", "Online", "Cash", "Credit"];

const AddTransaction = ({ userId, onSuccess }) => {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Others");
  const [note, setNote] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiMessage, setAiMessage] = useState("");
  const [activeTab, setActiveTab] = useState("smart");
  const [predictionMeta, setPredictionMeta] = useState(null);
  const [userEditedCategory, setUserEditedCategory] = useState(false);

  // ✅ Toggle tags
  const handleTagChange = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  };

  // ✅ Handle AI Parse Success
  const handleParseSuccess = useCallback((parsedData) => {
    if (parsedData.title) setName(parsedData.title);
    if (parsedData.amount !== undefined) setAmount(parsedData.amount.toString());
    if (parsedData.date) setDate(parsedData.date);
    if (parsedData.category) {
      setCategory(parsedData.category);
      setUserEditedCategory(false); // Reset edit state on new AI fill
    }
    
    // Capture prediction metadata
    if (parsedData.predictionSource) {
      setPredictionMeta({
        source: parsedData.predictionSource,
        confidence: parsedData.confidenceScore,
        usedFallback: parsedData.usedMLFallback,
        deterministicCategory: parsedData.deterministicCategory
      });
    }

    setAiMessage("Transaction details extracted successfully. Review extracted details before saving.");
    setError("");
  }, []);

  // ✅ Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !amount) {
      setError("Please fill all required fields");
      return;
    }

    const transactionData = {
      title: name,
      amount: parseInt(amount),
      category,
      note,
      tags: selectedTags,
      date,
      userId,
    };

    setLoading(true);
    setError("");

    try {
      await createTransaction(transactionData); // centralized API call
      setName("");
      setAmount("");
      setCategory("Others");
      setNote("");
      setSelectedTags([]);
      setDate(new Date().toISOString().split("T")[0]);
      setPredictionMeta(null);
      setUserEditedCategory(false);
      onSuccess(); // Close form or refresh list
    } catch (err) {
      setError("Error creating transaction. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-10 max-w-3xl mx-auto p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none bg-gradient-to-b from-white to-slate-50/90 dark:from-[#0c0f1c] dark:to-[#1a1d2e] border border-slate-200/80 dark:border-slate-700/80 backdrop-blur-xl transition-all duration-500 relative">
      <button
        onClick={onSuccess}
        className="absolute top-4 right-4 text-slate-500 hover:text-red-500 text-xl font-bold"
      >
        ✕
      </button>

      <h2 className="text-3xl font-bold text-center text-slate-800 dark:text-white mb-6 tracking-tight">
        💳 Add Transaction
      </h2>

      {/* AI Input Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl mb-6">
        <button
          type="button"
          onClick={() => {
            setActiveTab("smart");
            setPredictionMeta(null);
            setUserEditedCategory(false);
            setAiMessage("");
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "smart"
              ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-4 h-4" /> Smart Entry
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("scan");
            setPredictionMeta(null);
            setUserEditedCategory(false);
            setAiMessage("");
            invalidatePredictionCache(); // Clear cache when switching to scan
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
            activeTab === "scan"
              ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
              : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <Camera className="w-4 h-4" /> Scan Receipt
        </button>
      </div>

      {activeTab === "smart" ? (
        <SmartInputBar onParseSuccess={handleParseSuccess} />
      ) : (
        <ReceiptDropzone onParseSuccess={handleParseSuccess} />
      )}

      {aiMessage && (
        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl flex items-start gap-3 shadow-sm">
          <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-indigo-800 dark:text-indigo-300 font-medium">
            {aiMessage}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row: Title & Amount */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Title
            </label>
            <input
              type="text"
              placeholder="e.g. Grocery Shopping"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                invalidatePredictionCache(e.target.value);
              }}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Amount
            </label>
            <input
              type="number"
              placeholder="e.g. -500 for expense"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Row: Category & Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Category
            </label>
            <select
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setUserEditedCategory(true);
                invalidatePredictionCache(name);
              }}
            >
              <option value="Food">Food</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Travel">Travel</option>
              <option value="Utilities">Utilities</option>
              <option value="Income">Income</option>
              <option value="Others">Others</option>
            </select>
            
            {/* Smart Prediction Badge */}
            {!userEditedCategory && predictionMeta && (
              <div className="mt-2 flex items-center gap-2 group relative">
                <div className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50 shadow-sm cursor-help">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Suggested category: {category}</span>
                </div>

                {/* Elegant Mini Tooltip */}
                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block z-50 w-64 p-2.5 bg-slate-900 dark:bg-slate-950 text-slate-200 text-xs rounded-xl shadow-xl border border-slate-700/50 backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-1">
                  <p className="font-medium text-slate-300 mb-1">Category Suggestion</p>
                  <p className="text-slate-400 leading-relaxed">Category suggested based on transaction patterns and merchant activity.</p>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
              Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300">
            Note (optional)
          </label>
          <textarea
            rows="3"
            placeholder="e.g. Bought vegetables and fruits"
            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-800 dark:text-white"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-slate-600 dark:text-slate-300 mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-3">
            {tagsList.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => handleTagChange(tag)}
                className={`px-3 py-1 rounded-full border text-sm transition-all ${
                  selectedTags.includes(tag)
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-transparent border-slate-400 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-lg shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all duration-300"
            disabled={loading}
          >
            {loading ? "Saving..." : "➕ Add Transaction"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddTransaction;
