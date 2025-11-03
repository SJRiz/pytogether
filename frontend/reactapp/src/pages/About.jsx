import { LogIn, Users, Code, Save, Package, ArrowDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import liveVideo from '../assets/live.webm';
import drawing from '../assets/drawing.png';

export default function About() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
    <Helmet>
        <title>PyTogether - Real-time Collaborative Python IDE Online</title>
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://pytogether.org" />
        <meta name="description" content="Google Docs for Python. Real-time collaborative Python IDE in the browser, completely free. The only beginner-friendly collaborative Python IDE that lets you draw directly on your code for teaching and notes." />
        <meta property="og:title" content="PyTogether - About Us" />
        <meta property="og:description" content="Pair programming made simple with real-time collaboration." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pytogether.org" />
        <meta property="og:image" content="https://pytogether.org/pytog.png" />
    </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-gradient-to-b from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header Section */}
          <div className="p-10 text-center border-b border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                <div className="relative p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border-2 border-gray-700/50">
                  <img
                    src="/pytog.png"
                    alt="PyTogether Logo"
                    className="h-16 w-16"
                  />
                </div>
              </div>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              About PyTogether
            </h1>
            <p className="text-gray-300 text-xl font-semibold mb-3">Google Docs for Python</p>
            <p className="text-gray-400 text-s font-semibold mb-3">The only beginner-friendly collaborative Python IDE that lets you draw directly on your code for teaching and notes.</p>
            
            
            {/* FREE Badge */}
            <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-400/50 rounded-full px-6 py-2 mb-4">
              <span className="text-gray-300 font-semibold">100% FREE</span>
              <span className="text-gray-300 font-semibold">•</span>
              <span className="text-gray-300 font-semibold">No Paywalls</span>
              <span className="text-gray-300 font-semibold">•</span>
              <span className="text-gray-300 font-semibold">No Downloads</span>
            </div>
            
            <p className="text-gray-400 text-base max-w-2xl mx-auto leading-relaxed mb-6">
              The simplest way to learn, teach, and collaborate on Python projects in real-time, directly in your browser.
            </p>
            {/* CTA Buttons in Header */}
            <div className="flex gap-3 justify-center mt-6">
              <button
                onClick={handleGetStarted}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 flex items-center hover:scale-105 transform"
              >
                <LogIn className="h-5 w-5 mr-2" />
                Get Started for Free
              </button>
              <button
                onClick={scrollToFeatures}
                className="px-8 py-3 bg-gray-700/40 text-gray-300 rounded-xl font-semibold hover:bg-gray-700/60 transition-all border border-gray-600/30 hover:border-gray-500/50 flex items-center"
              >
                Learn More
                <ArrowDown className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>

          {/* Content Section */}
          <div id="features-section" className="p-8 space-y-6">
            {/* Why PyTogether Section */}
            <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-7 border border-gray-600/30 shadow-lg">
              <h2 className="text-2xl font-bold text-white mb-5 flex items-center">
                <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                Why PyTogether?
              </h2>
              <p className="text-gray-300 mb-6 leading-relaxed">
                PyTogether focuses on <span className="text-blue-400 font-bold">simplicity and education</span>. 
                We created something easy for beginners to jump right into collaborative Python programming.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-gray-300">
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>Run Python scripts together in the browser</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>No paywalls or downloads required</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>No AI/copilot features - perfect for learning fundamentals</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>No complex features that overwhelm beginners</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>Extremely intuitive interface</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
                    <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-blue-500/50"></div>
                    <span>Just create an account, make a group, and start coding!</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <p className="text-gray-300 text-sm">
                  This is also an open-source project! Feel free to view or contribute at 
                  <a href="https://github.com/SJRiz/pytogether" className="text-blue-400 font-semibold hover:text-blue-300 transition-colors ml-1">
                    github.com/SJRiz/pytogether
                  </a>
                </p>
              </div>
            </div>


            {/* Video Demo Section */}
            <div className="bg-gradient-to-br from-gray-700/40 to-gray-800/40 rounded-xl p-7 border border-gray-600/30 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">See It In Action</h2>
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border-2 border-gray-600/50 shadow-2xl">
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
                <div className="rounded-xl overflow-hidden border-2 border-gray-600/50 shadow-2xl">
                  <img 
                    src={drawing}
                    alt="Real-time drawing feature demonstration"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Features Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-purple-900/20 to-gray-800/40 rounded-xl p-6 border border-purple-500/30 shadow-lg hover:border-purple-500/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                  <div className="p-2 bg-purple-500/20 rounded-lg mr-3">
                    <Code className="h-5 w-5 text-purple-400" />
                  </div>
                  Core Features
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                    <span>Group and project management</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                    <span>Real-time collaboration with live cursors and code linting</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                    <span>Real-time drawing for note-taking and teaching</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                    <span>Real-time chat and voice calls per project</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-purple-500/50"></div>
                    <span>Reliable autosave (saves on exit and every minute)</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-900/20 to-gray-800/40 rounded-xl p-6 border border-green-500/30 shadow-lg hover:border-green-500/50 transition-colors">
                <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                  <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                    <Save className="h-5 w-5 text-green-400" />
                  </div>
                  Simple & Reliable
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-green-500/50"></div>
                    <span>Browser-based Python execution</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-green-500/50"></div>
                    <span>No server setup or configuration</span>
                  </div>
                  <div className="flex items-start p-3 bg-gray-800/50 rounded-lg">
                    <div className="w-2 h-2 bg-gradient-to-br from-green-400 to-green-500 rounded-full mt-2 mr-3 flex-shrink-0 shadow-lg shadow-green-500/50"></div>
                    <span>Perfect for classrooms and study groups</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Packages Section */}
            <div className="bg-gradient-to-br from-yellow-900/20 to-gray-800/40 rounded-xl p-7 border border-yellow-500/30 shadow-lg">
              <h3 className="text-xl font-bold text-white mb-5 flex items-center">
                <div className="p-2 bg-yellow-500/20 rounded-lg mr-3">
                  <Package className="h-5 w-5 text-yellow-400" />
                </div>
                Supported Python Packages
              </h3>
              <p className="text-gray-300 mb-5 leading-relaxed">
                PyTogether uses Skulpt to run Python in the browser. The following packages are currently supported:
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50">
                  <h4 className="text-white font-bold mb-4 text-lg">Standard Library Modules</h4>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">math</span> → sin, cos, sqrt, factorial, etc.</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">random</span> → randint, choice, shuffle, etc.</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">time</span> → time.time(), sleep (limited)</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">re</span> → basic regex</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">string</span> → ascii_letters, constants</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">itertools</span> → chain, combinations, permutations</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">functools</span> → reduce, partial</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">operator</span> → add, mul functions</div>
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-blue-400 font-semibold">copy</span> → copy, deepcopy</div>
                  </div>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-5 border border-gray-700/50">
                  <h4 className="text-white font-bold mb-4 text-lg">Partial Support Modules</h4>
                  <div className="space-y-2 text-sm text-gray-300 mb-5">
                    <div className="p-2 bg-gray-900/50 rounded-lg"><span className="text-yellow-400 font-semibold">heapq</span> → basic heap functions</div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-700/60 to-gray-900/60 rounded-xl p-4 border border-gray-600/30">
                    <h5 className="text-white font-bold mb-3 text-sm flex items-center">
                      <div className="w-2 h-2 bg-gradient-to-br from-green-400 to-green-500 rounded-full mr-2"></div>
                      Perfect For Learning:
                    </h5>
                    <div className="space-y-2 text-xs text-gray-300">
                      <div className="flex items-center"><div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>Data structures & algorithms</div>
                      <div className="flex items-center"><div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>Mathematical computations</div>
                      <div className="flex items-center"><div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>Text processing & regex</div>
                      <div className="flex items-center"><div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>Functional programming</div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-400 text-sm mt-5 p-4 bg-gray-800/50 rounded-lg border border-gray-700/30">
                <em>Note: Partial support modules have limited functionality. Perfect for learning Python fundamentals and core programming concepts.</em>
              </p>
            </div>

            {/* Get Started Button at Bottom */}
            <div className="text-center pt-4">
              <button
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl font-bold hover:from-blue-500 hover:to-purple-500 transition-all duration-300 flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 text-lg hover:scale-105 transform"
              >
                <LogIn className="h-6 w-6 mr-3" />
                Get Started Now
              </button>
              <p className="text-gray-400 text-sm mt-4 font-medium">
                Start coding together in seconds - no downloads required!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 text-center border-t border-gray-700/50 bg-gradient-to-r from-gray-900/50 to-gray-800/50">
            <p className="text-sm text-gray-400">
              Questions? Feedback? Email us at <a href="mailto:contact@pytogether.org" className="text-blue-400 font-bold underline hover:text-blue-300 transition-colors">contact@pytogether.org</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}