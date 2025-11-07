import { useEffect, useState } from "react";
import { AlertCircle, Box, CheckCircle } from "lucide-react";

export default function PyodideModal() {
  const [open, setOpen] = useState(false); // Changed from true to false

  useEffect(() => {
    const hasSeen = localStorage.getItem("pyodideModalShown");
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("pyodideModalShown", "true");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl p-8 max-w-lg w-full border border-gray-700 relative overflow-hidden">
        {/* Accent glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        
        <div className="relative">
          <h2 className="text-3xl font-bold mb-3 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Exciting Update!
          </h2>
          
          <p className="text-gray-300 text-center mb-6 text-lg">
            We've migrated to <strong>Pyodide</strong>, full CPython running entirely in your browser
          </p>

          {/* Benefits grid */}
          <div className="space-y-3 mb-8">
            <div className="flex items-start gap-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
              <Box className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white mb-1">Full Scientific Stack</div>
                <div className="text-sm text-gray-400">We now support <strong>Matplotlib</strong>, NumPy, Pandas, SciPy, and much more libraries!</div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
              <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white mb-1">Better Error Handling</div>
                <div className="text-sm text-gray-400">Clear, detailed tracebacks that pinpoint exactly where issues occur</div>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-gray-800 bg-opacity-50 p-4 rounded-lg border border-gray-700">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-semibold text-white mb-1">True Python Compatibility</div>
                <div className="text-sm text-gray-400">Real CPython 3.13—not a subset, not a transpiler</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            cool i dont care
          </button>
        </div>
      </div>
    </div>
  );
}