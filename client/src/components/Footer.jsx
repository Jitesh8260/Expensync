import React from "react";

const Footer = () => {
  return (
    <footer className="mt-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 py-8 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          © {new Date().getFullYear()} <span className="font-semibold text-purple-600 dark:text-purple-400">Expensync</span>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;