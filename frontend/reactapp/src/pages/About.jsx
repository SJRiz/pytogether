import { useEffect, useState } from 'react';
import { LogIn, Users, Code, Save, Package, ArrowRight, Zap, Terminal, PenTool, Github, CheckCircle2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import liveVideo from '../assets/live.webm';
import liveDrawing from '../assets/drawinglive.webm';

export default function About() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => navigate("/login");
  
  const scrollToFeatures = () => {
    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>PyTogether - Free Collaborative Python IDE</title>
        <meta name="title" content="PyTogether | Free Collaborative Python IDE for Teachers & Students" />
        <meta name="description" content="The free 'Google Docs for Python'. A real-time collaborative Python compiler and IDE in the browser. Perfect for pair programming, teaching, and online tutoring." />
        <meta name="keywords" content="collaborative python ide, python for teachers, pair programming online, google docs for python, online python compiler, multiplayer coding, free python ide" />
        <link rel="canonical" href="https://pytogether.org" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pytogether.org" />
        <meta property="og:title" content="PyTogether - The Free Google Docs for Python" />
        <meta property="og:description" content="Code, draw, and run Python together in real-time. No setup required. The best tool for teaching Python online." />
        <meta property="og:image" content="https://pytogether.org/pytog.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://pytogether.org" />
        <meta property="twitter:title" content="PyTogether | Real-time Python Collaboration" />
        <meta property="twitter:description" content="The free alternative to Replit. Code and draw together in the browser." />
        <meta property="twitter:image" content="https://pytogether.org/pytog.png" />

        <style>{`
          .bg-grid-pattern {
            background-image: linear-gradient(to right, #334155 1px, transparent 1px),
                              linear-gradient(to bottom, #334155 1px, transparent 1px);
            background-size: 40px 40px;
          }
          .text-glow {
            text-shadow: 0 0 40px rgba(59, 130, 246, 0.5);
          }
        `}</style>
      </Helmet>

      <div className="min-h-screen bg-[#0B0F17] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden">
        
        {/* Background FX */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        {/* Navbar */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#0B0F17]/80 backdrop-blur-md border-b border-slate-800' : 'bg-transparent'}`}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-15"></div>
                        <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-1 rounded-xl border border-gray-700/50">
                        <img
                            src="/pytog.png"
                            alt="Code Icon"
                            className="h-8 w-8"
                        />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold pl-2 bg-clip-text">
                        PyTogether
                        </h1>
                    </div>
                </div>
            <div className="flex items-center gap-4">
              <a href="https://github.com/SJRiz/pytogether" target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium">
                <Github className="w-4 h-4" />
                <span>Star on GitHub</span>
              </a>
              <button onClick={handleGetStarted} className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-full text-sm font-bold transition-colors">
                Sign In
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wide mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            100% Free
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl leading-[1.1]">
            The "Google Docs"<br />
            <span className="bg-gradient-to-r from-indigo-400 via-blue-400 to-purple-400 text-transparent bg-clip-text text-glow">
              for Python
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed">
            A zero-setup, real-time collaborative IDE built for teachers, educators, interviewers, and students. 
            Code, communicate, draw, and run Python directly in your browser.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={handleGetStarted}
              className="group relative px-8 py-4 bg-gradient-to-b from-indigo-500 to-indigo-600 hover:to-indigo-500 text-white rounded-xl font-bold shadow-[0_10px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-2">
                Start Coding Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
            
            <button 
              onClick={scrollToFeatures}
              className="px-8 py-4 bg-slate-800/50 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-semibold transition-all"
            >
              See How It Works
            </button>
          </div>

          {/* Supported Logos Strip */}
          <div className="mt-16 pt-8 border-t border-slate-800/50 w-full max-w-3xl">
            <p className="text-sm text-slate-500 mb-4 uppercase tracking-widest font-semibold">Powered By</p>
            <div className="flex justify-center gap-8 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
               <div className="flex items-center gap-2"><span className="font-mono font-bold text-slate-300">Pyodide</span></div>
               <div className="flex items-center gap-2"><span className="font-mono font-bold text-blue-400">React</span></div>
               <div className="flex items-center gap-2"><span className="font-mono font-bold text-yellow-400">Django</span></div>
               <div className="flex items-center gap-2"><span className="font-mono font-bold text-green-400">Supabase</span></div>
            </div>
          </div>
        </section>

        {/* Main Demo/Showcase */}
        <section id="features-section" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Coding */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative rounded-xl bg-[#1E1E1E] border border-slate-700 shadow-2xl overflow-hidden">
                {/* Browser Header */}
                <div className="bg-[#2D2D2D] px-4 py-3 flex items-center gap-3 border-b border-black/20">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="bg-[#1E1E1E] text-xs text-slate-400 px-3 py-1 rounded-md flex-1 text-center font-mono">
                    pytogether.org/ide
                  </div>
                </div>
              <video className="w-full h-auto" autoPlay loop muted playsInline><source src={liveVideo} type="video/webm" /></video>
              </div>
              <div className="mt-4 text-center lg:text-left">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center lg:justify-start">
                  <Code className="w-5 h-5 text-blue-400" />
                  Real-time Multiplayer
                </h3>
                <p className="text-slate-400 text-sm mt-1">See others type, select, and edit code instantly.</p>
              </div>
            </div>

            {/* Drawing */}
            <div className="relative group lg:mt-20">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative rounded-xl bg-[#1E1E1E] border border-slate-700 shadow-2xl overflow-hidden">
                 {/* Browser Header */}
                 <div className="bg-[#2D2D2D] px-4 py-3 flex items-center gap-3 border-b border-black/20">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className="bg-[#1E1E1E] text-xs text-slate-400 px-3 py-1 rounded-md flex-1 text-center font-mono">
                    pytogether.org/ide
                  </div>
                </div>
                <video className="w-full h-auto" autoPlay loop muted playsInline><source src={liveDrawing} type="video/webm" /></video>
              </div>
              <div className="mt-4 text-center lg:text-left">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 justify-center lg:justify-start">
                  <PenTool className="w-5 h-5 text-pink-400" />
                  Draw Over Code
                </h3>
                <p className="text-slate-400 text-sm mt-1">Annotate logic flows visually. Perfect for tutors.</p>
              </div>
            </div>

          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="relative z-10 bg-[#0F141F] py-24 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need to learn or teach Python</h2>
              <p className="text-slate-400">Built for the modern classroom, stripped of unnecessary complexity.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              
              {/* Simplicity */}
              <div className="col-span-1 md:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/30 transition-colors group">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Lightning Fast & Browser Based</h3>
                <p className="text-slate-400 leading-relaxed">
                  No servers to spin up. No software to install. PyTogether runs CPython 3.13 via WebAssembly directly in your browser. It works on Chromebooks, tablets, and low-end laptops instantly.
                </p>
              </div>

              {/* Packages */}
              <div className="col-span-1 bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 p-8 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Package className="w-24 h-24" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-green-400" />
                  Pre-installed
                </h3>
                <ul className="space-y-3">
                  {['numpy', 'pandas', 'matplotlib', 'scipy'].map((pkg) => (
                    <li key={pkg} className="flex items-center gap-2 text-slate-300 font-mono text-sm">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {pkg}
                    </li>
                  ))}
                </ul>
                <div className="mt-6 pt-6 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">Auto-installs imports on the fly.</p>
                </div>
              </div>

              {/* Safety/Save */}
              <div className="col-span-1 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-green-500/30 transition-colors">
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Save className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Reliable Autosave</h3>
                <p className="text-slate-400 text-sm">
                  Never lose work. Projects save automatically every minute and upon exit.
                </p>
              </div>

              {/* Groups */}
              <div className="col-span-1 md:col-span-2 bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-blue-500/30 transition-colors flex flex-col md:flex-row items-center gap-8">
                 <div className="flex-1">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Group Management</h3>
                    <p className="text-slate-400">Create groups, invite via pass code, and manage projects effortlessly. Built-in voice calls and chat for every project.</p>
                 </div>
              </div>

              {/* --- NEW DISCLAIMER CARD --- */}
              <div className="col-span-1 md:col-span-3 bg-amber-900/10 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4">
                 <div className="shrink-0 mt-1">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-amber-400 mb-1">Platform Limitations</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">
                       Because PyTogether runs Python entirely in the browser (using Pyodide/WASM), 
                       <strong> desktop GUI libraries like Pygame, Tkinter, and Turtle are not supported</strong>. 
                       Standard input/output and data science libraries (Matplotlib, Pandas) work perfectly.
                    </p>
                 </div>
              </div>

            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-24 px-6 text-center z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="relative max-w-3xl mx-auto bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-12 rounded-3xl shadow-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to start coding?</h2>
            <p className="text-slate-300 mb-8 text-lg">
              Start using PyTogether today.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button 
                onClick={handleGetStarted}
                className="px-8 py-4 bg-white text-black rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Create Free Account
              </button>
              <a 
                href="https://github.com/SJRiz/pytogether"
                target="_blank" 
                rel="noreferrer"
                className="px-8 py-4 bg-slate-800 text-white border border-slate-600 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Credit Card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Open Source</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Instant Access</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800 bg-[#05080F] py-12 text-center relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
             <img src="/pytog.png" alt="PyTogether Logo" className="h-6 w-6 grayscale" onError={(e) => e.target.style.display = 'none'} />
             <span className="font-bold text-slate-300">PyTogether</span>
          </div>
          <p className="text-slate-500 text-sm mb-4">
            &copy; {new Date().getFullYear()} PyTogether. Built with ❤️ for the Python community.
          </p>
          <a href="mailto:contact@pytogether.org" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors">
            contact@pytogether.org
          </a>
        </footer>

      </div>
    </>
  );
}