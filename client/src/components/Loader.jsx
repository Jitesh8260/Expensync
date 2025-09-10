import { useLoader } from "../context/LoaderContext";

export default function Loader() {
  const { loading } = useLoader();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background Overlay with Blur */}
      <div className="absolute inset-0 
        bg-white/30 dark:bg-black/40 
        backdrop-blur-md 
        transition-colors"></div>

      {/* Loader Wrapper */}
      <div className="relative flex flex-col items-center space-y-6 p-8 rounded-2xl shadow-2xl 
        bg-white/50 dark:bg-gray-900/50 
        backdrop-blur-xl 
        border border-white/30 dark:border-gray-700/40 
        transition-colors">
        
        {/* Premium Dual Gradient Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute w-full h-full rounded-full border-4 border-t-transparent 
            border-blue-500 animate-spin"></div>
          <div className="absolute w-full h-full rounded-full border-4 border-b-transparent 
            border-fuchsia-500 animate-spin-slow"></div>

          {/* Inner Glow Circle */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-blue-500/20 to-fuchsia-500/20"></div>
        </div>

        {/* Loading Text */}
        <span className="text-gray-800 dark:text-gray-200 font-medium text-sm tracking-wider animate-pulse">
          Loading, please wait...
        </span>
      </div>
    </div>
  );
}
