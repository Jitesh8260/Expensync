import { useState, useEffect, useRef } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { parseTransactionWithNLP } from "../api/api";

const placeholders = [
  "e.g., Spent 500 on food yesterday",
  "e.g., Paid 1200 rent last Friday",
  "e.g., Received salary 50000",
  "e.g., Bought groceries for $45 at Walmart"
];

const SmartInputBar = ({ onParseSuccess }) => {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((prev) => (prev + 1) % placeholders.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);


  const handleParse = async () => {
    if (!text.trim()) return;
    
    const currentVersion = ++requestVersionRef.current;
    setLoading(true);
    try {
      const data = await parseTransactionWithNLP(text);
      if (currentVersion === requestVersionRef.current && onParseSuccess && data) {
        onParseSuccess(data);
        setText(""); // Clear after manual success
      }
    } catch (err) {
      console.error("Parse failed", err);
    } finally {
      if (currentVersion === requestVersionRef.current) {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleParse();
    }
  };

  return (
    <div className="w-full bg-indigo-50/90 dark:bg-indigo-900/10 border border-indigo-200/80 dark:border-indigo-800/30 p-6 rounded-2xl mb-8 shadow-sm shadow-slate-200/50 dark:shadow-none transition-all duration-300">
      <h3 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
        <MessageSquare className="w-4 h-4" /> Smart Entry
      </h3>
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-grow relative w-full">
          <input
            type="text"
            className="w-full pl-4 pr-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 dark:text-white transition shadow-sm placeholder-slate-400 dark:placeholder-slate-500"
            placeholder={placeholders[placeholderIdx]}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          onClick={handleParse}
          disabled={loading || !text.trim()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <span>Parse & Auto-Fill</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default SmartInputBar;
