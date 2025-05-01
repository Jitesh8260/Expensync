import React from "react";
import Navbar from "./Navbar"; // optional
import Footer from "./Footer"; 

const Layout = ({ children }) => {
    return (
<div className="min-h-screen 
bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-950 
dark:text-gray-100 transition-colors duration-300 ease-in-out overflow-auto">
           <div className="w-full h-80 bg-gradient-to-r from-[#001f3f] via-[#003366] to-[#001f3f] shadow-inner dark:from-blue-1000 dark:via-blue-800 dark:to-blue-1000">
            {/* Sticky Navbar */}
            <Navbar />
            {/* Main Content Container */}
            <main className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pt-24 pb-10">
                {children}
            </main>
            {/* Footer (optional) */}
            <Footer />
            </div >
        </div>
    );
};

export default Layout;
