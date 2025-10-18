import { LogIn, Users, Code, Save, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import liveVideo from '../assets/live.webm';

export default function About() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <>
    <Helmet>
        <title>PyTogether - Real-time Collaborative Python IDE Online</title>
        <link rel="icon" href="/pytog.ico" />
        <link rel="canonical" href="https://pytogether.org" />
        <meta name="description" content="Google Docs for Python. Real-time collaborative Python IDE in the browser, completely free" />
        <meta property="og:title" content="PyTogether - About Us" />
        <meta property="og:description" content="Pair programming made simple with real-time collaboration." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pytogether.org" />
        <meta property="og:image" content="https://pytogether.org/pytog.png" />
    </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-gray-800/70 backdrop-blur-md border border-gray-700/30 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 hover:bg-gray-800/80">
          {/* Header Section */}
          <div className="p-8 text-center border-b border-gray-700/50">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-blue-500/10 rounded-full">
                <img
                  src="/pytog.png"
                  alt="PyTogether Logo"
                  className="h-15 w-15"
                />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-4">
              About PyTogether
            </h1>
            <p className="text-gray-400 text-lg mb-2">Google Docs for Python</p>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto">
              The simplest way to learn, teach, and collaborate on Python projects in real-time, directly in your browser.
            </p>
          </div>

          {/* Content Section */}
          <div className="p-8 space-y-8">
            {/* Why PyTogether Section */}
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/20">
              <h2 className="text-2xl font-semibold text-white mb-4 flex items-center">
                <Users className="h-6 w-6 mr-3 text-blue-400" />
                Why PyTogether?
              </h2>
              <p className="text-gray-300 mb-4">
                PyTogether focuses on <span className="text-blue-400 font-semibold">simplicity and education</span>. 
                We created something easy for beginners to jump right into collaborative Python programming.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Run Python scripts together in the browser</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>No paywalls or downloads required</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>No AI/copilot features - perfect for learning fundamentals</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>No complex features that overwhelm beginners</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Extremely intuitive interface</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Just create an account, make a group, and start coding!</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-300 mb-4 pt-5">This is also an open-source project! Feel free to view or contribute at <span className="text-blue-400 font-semibold"> <a href="https://github.com/SJRiz/pytogether">https://github.com/SJRiz/pytogether </a></span> </p>
            </div>

            {/* Video Demo Section */}
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/20">
              <div className="rounded-lg overflow-hidden border border-gray-600/30">
                <video 
                  className="w-full h-auto"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src={liveVideo} type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Code className="h-5 w-5 mr-3 text-purple-400" />
                  Core Features
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Group and project management</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Real-time collaboration with live cursors and code linting</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Real-time chat and voice calls per project</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Reliable autosave (saves on exit and every minute)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/20">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Save className="h-5 w-5 mr-3 text-green-400" />
                  Simple & Reliable
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Browser-based Python execution</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>No server setup or configuration</span>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                    <span>Perfect for classrooms and study groups</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Packages Section */}
            <div className="bg-gray-700/30 rounded-lg p-6 border border-gray-600/20">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Package className="h-5 w-5 mr-3 text-yellow-400" />
                Supported Python Packages
              </h3>
              <p className="text-gray-300 mb-4">
                PyTogether uses Skulpt to run Python in the browser. The following packages are currently supported:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Standard Library Modules</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div><span className="text-blue-400 font-medium">math</span> → sin, cos, sqrt, factorial, etc.</div>
                    <div><span className="text-blue-400 font-medium">random</span> → randint, choice, shuffle, etc.</div>
                    <div><span className="text-blue-400 font-medium">time</span> → time.time(), sleep (limited)</div>
                    <div><span className="text-blue-400 font-medium">re</span> → basic regex</div>
                    <div><span className="text-blue-400 font-medium">string</span> → ascii_letters, constants</div>
                    <div><span className="text-blue-400 font-medium">itertools</span> → chain, combinations, permutations</div>
                    <div><span className="text-blue-400 font-medium">functools</span> → reduce, partial</div>
                    <div><span className="text-blue-400 font-medium">operator</span> → add, mul functions</div>
                    <div><span className="text-blue-400 font-medium">copy</span> → copy, deepcopy</div>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <h4 className="text-white font-medium mb-3">Partial Support Modules</h4>
                  <div className="space-y-2 text-sm text-gray-300 mb-4">
                    <div><span className="text-yellow-400 font-medium">heapq</span> → basic heap functions</div>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-3 mt-4">
                    <h5 className="text-white font-medium mb-2 text-sm">Perfect For Learning:</h5>
                    <div className="space-y-1 text-xs text-gray-300">
                      <div>• Data structures & algorithms</div>
                      <div>• Mathematical computations</div>
                      <div>• Text processing & regex</div>
                      <div>• Functional programming</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-4">
                <em>Note: Partial support modules have limited functionality. Perfect for learning Python fundamentals and core programming concepts.</em>
              </p>
            </div>

            {/* Get Started Button */}
            <div className="text-center">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 text-lg"
              >
                <LogIn className="h-6 w-6 mr-3" />
                Get Started Now
              </button>
              <p className="text-gray-400 text-sm mt-3">
                Start coding together in seconds - no downloads required!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center border-t border-gray-700/50">
            <p className="text-xs text-gray-500">
              Questions? Feedback? Email us at <a href="mailto:contact@pytogether.org" className="text-blue-400 font-bold underline">contact@pytogether.org</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}