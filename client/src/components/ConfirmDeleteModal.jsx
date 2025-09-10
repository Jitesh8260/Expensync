import { XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmDeleteModal = ({ open, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            className="relative rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.35)] 
                       border border-white/20 dark:border-slate-700
                       bg-gradient-to-br from-white/80 via-white/60 to-slate-100/70 
                       dark:from-slate-800/90 dark:via-slate-900/90 dark:to-black/80
                       p-8 w-[90%] max-w-md text-center backdrop-blur-2xl"
          >
            {/* Icon */}
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-red-500/10 ring-2 ring-red-500/30 shadow-inner">
                <XCircle className="text-red-500 drop-shadow-md" size={48} />
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Delete Transaction?
            </h2>

            {/* Description */}
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              Are you sure you want to remove this transaction?
              <span className="block mt-1 text-red-500 font-semibold">
                This action cannot be undone.
              </span>
            </p>

            {/* Actions */}
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-medium border border-slate-200 dark:border-slate-700
                           text-slate-700 dark:text-slate-300
                           bg-gradient-to-r from-white/70 to-white/50 dark:from-slate-800/80 dark:to-slate-900/80
                           hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-red-500 to-red-600
                           hover:from-red-600 hover:to-red-700 
                           shadow-lg shadow-red-500/30 hover:shadow-red-600/40
                           hover:scale-[1.03] transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
