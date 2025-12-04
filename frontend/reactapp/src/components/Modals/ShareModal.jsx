import { useState } from "react";
import { X, Copy, Check, Link, FileCode, Users } from "lucide-react";
import api from "../../../axiosConfig";

export const ShareModal = ({ isOpen, onClose, group, project }) => {
  const [activeTab, setActiveTab] = useState("edit"); // 'edit' or 'snippet'
  const [generatedLink, setGeneratedLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !project || !group) return null;

  const generateLink = async (type) => {
    setLoading(true);
    setGeneratedLink("");
    setCopied(false);
    
    try {
      let endpoint = "";
      if (type === 'edit') {
        endpoint = `/groups/${group.id}/projects/${project.id}/share/`;
      } else {
        endpoint = `/groups/${group.id}/projects/${project.id}/share-snippet/`;
      }

      const res = await api.get(endpoint);
      
      // Backend returns { share_url: "..." } or { snippet_url: "..." }
      setGeneratedLink(res.data.share_url || res.data.snippet_url);
    } catch (err) {
      console.error(err);
      alert("Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0B0F17] border border-gray-700 rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Link className="h-4 w-4 text-blue-400" />
            Share Project
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          <button 
            onClick={() => { setActiveTab("edit"); setGeneratedLink(""); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "edit" ? "text-blue-400 border-b-2 border-blue-400 bg-blue-500/5" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users className="h-4 w-4" /> Collaborate (Edit)
          </button>
          <button 
            onClick={() => { setActiveTab("snippet"); setGeneratedLink(""); }}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "snippet" ? "text-green-400 border-b-2 border-green-400 bg-green-500/5" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <FileCode className="h-4 w-4" /> Share Snippet (Read-Only)
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <h4 className="text-sm font-medium text-white mb-2">
              {activeTab === "edit" ? "Invite Editors" : "Share Read-Only Copy"}
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              {activeTab === "edit" 
                ? "Anyone with this link can join the session and edit code in real-time. They must be logged in to PyTogether."
                : "Anyone with this link can view a copy of your code in the Offline Playground. They cannot edit your original project."
              }
            </p>
          </div>

          {!generatedLink ? (
            <button
              onClick={() => generateLink(activeTab)}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-sm font-bold text-white transition-all ${
                activeTab === "edit" 
                  ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20" 
                  : "bg-green-600 hover:bg-green-500 shadow-lg shadow-green-500/20"
              }`}
            >
              {loading ? "Generating..." : "Generate Link"}
            </button>
          ) : (
            <div className="animate-scaleIn">
              <div className="flex items-center gap-2 p-1.5 bg-gray-800 rounded-lg border border-gray-700">
                <input 
                  readOnly 
                  value={generatedLink} 
                  className="flex-1 bg-transparent text-sm text-gray-300 px-2 focus:outline-none font-mono truncate"
                />
                <button
                  onClick={handleCopy}
                  className={`p-2 rounded-md transition-all ${
                    copied ? "bg-green-500/20 text-green-400" : "bg-gray-700 hover:bg-gray-600 text-white"
                  }`}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};