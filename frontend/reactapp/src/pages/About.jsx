import { useEffect, useState } from 'react';
import {
  LogIn, Users, Code, Save, Package, ArrowRight, Zap, Terminal, PenTool, Github,
  Linkedin, Coffee, CheckCircle2, AlertTriangle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import GitHubButton from 'react-github-btn'
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
  const scrollToBento = () => {
    document.getElementById('bento-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        {/* Primary Meta Tags */}
        <title>PyTogether - Free Online Python IDE & Collaborative Editor </title>
        <meta name="title" content="PyTogether | Free Collaborative Python IDE Online for Teachers & Students" />
        <meta name="description" content="The free 'Google Docs for Python'. A real-time collaborative Python compiler and IDE in the browser. Perfect for pair programming, teaching, and online tutoring." />
        <meta name="keywords" content="collaborative python ide, python for teachers, pair programming online, google docs for python, online python compiler, multiplayer coding, free python ide, online python ide" />
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
      </Helmet>

      <div className={`min-h-screen font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden relative ${
        'bg-[#0B0F17] text-slate-200'
      }`}>
        {/* Subtle grid overlay */}
        <div className={`fixed inset-0 pointer-events-none z-0 ${
          'bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)]'
        } bg-[size:24px_24px]`}></div>

        {/* Navbar */}
        <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? `backdrop-blur-md border-b ${'bg-[#0B0F17]/95 border-slate-800'}` 
            : `backdrop-blur-sm ${'bg-[#0B0F17]/80'}`
        }`}>
          <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className={`relative p-1 rounded-lg border ${'bg-gray-800 border-gray-700/50'}`}>
                  <img
                    src="/pytog.png"
                    alt="PyTogether"
                    className="h-6 w-6 sm:h-7 sm:w-7"
                  />
                </div>
              </div>
              <h1 className={`text-lg sm:text-2xl font-bold ${'text-white'}`}>
                PyTogether
              </h1>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-3 sm:gap-6">
              

              {/* Coffee button */}
              <a
                href="https://www.buymeacoffee.com/SJRiz"
                target="_blank"
                rel="noreferrer"
                className="shrink-0"
              >
                <img
                  src="/bmc.png"
                  alt="Buy Me A Coffee"
                  className="h-7 sm:h-8 w-auto"
                />
              </a>

              {/* GitHub button - hide star count on mobile */}
              <div className="hidden sm:block scale-120 translate-y-[3px]">
                <GitHubButton
                  href="https://github.com/SJRiz/PyTogether"
                  data-color-scheme="no-preference: light; light: light; dark: dark;"
                  data-size="large"
                  data-show-count="true"
                  aria-label="Star SJRiz/PyTogether on GitHub"
                >
                  Star
                </GitHubButton>
              </div>

              <a
                href="https://github.com/SJRiz/PyTogether"
                target="_blank"
                rel="noreferrer"
                className={`sm:hidden flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                  'bg-slate-800 hover:bg-slate-700 border-slate-700'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Star
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative z-10 pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">

          {/* Heading */}
          <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl leading-[1.1] ${'text-white'}`}>
            The "Google Docs"<br />
            <span className="text-indigo-400">
              for Python
            </span>
          </h1>

          <p className={`text-lg md:text-xl max-w-2xl mb-10 leading-relaxed ${'text-slate-400'}`}>
            A free & open-source, zero-setup, real-time collaborative online Python IDE & editor. Built for pair programming, interviews, learning, and teaching.
            Code, communicate, draw, and run Python directly in your browser.
          </p>

          {/* CTA Group */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={handleGetStarted}
              className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02]"
            >
              <div className="flex items-center justify-center gap-2">
                Start Coding Now
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={scrollToFeatures}
              className={`px-8 py-4 border rounded-xl font-semibold transition-all ${
                'bg-slate-800/50 hover:bg-slate-800 text-slate-200 border-slate-700'
              }`}
            >
              See How It Works
            </button>

            <button
              onClick={scrollToBento}
              className={`px-8 py-4 bg-transparent border rounded-xl font-semibold transition-all ${
                'hover:bg-slate-800/30 text-slate-300 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              Learn More
            </button>

          </div>

        </section>

        {/* Main Demo/Showcase */}
        <section id="features-section" className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Coding */}
            <div className="relative group">
              <div className={`relative rounded-xl border shadow-2xl overflow-hidden ${'bg-[#1E1E1E] border-slate-700'}`}>
                {/* Browser Header */}
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${'bg-[#2D2D2D] border-black/20'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-md flex-1 text-center font-mono ${'bg-[#1E1E1E] text-slate-400'}`}>
                    pytogether.org/ide
                  </div>
                </div>
                <video className="w-full h-auto" autoPlay loop muted playsInline><source src={liveVideo} type="video/webm" /></video>
              </div>
              <div className="mt-4 text-center lg:text-left">
                <h3 className={`text-xl font-bold flex items-center gap-2 justify-center lg:justify-start ${'text-white'}`}>
                  <Code className="w-5 h-5 text-blue-400" />
                  Real-time Multiplayer
                </h3>
                <p className={`text-sm mt-1 ${'text-slate-400'}`}>See others type, select, and edit code instantly.</p>
              </div>
            </div>

            {/* Drawing */}
            <div className="relative group lg:mt-20">
              <div className={`relative rounded-xl border shadow-2xl overflow-hidden ${'bg-[#1E1E1E] border-slate-700'}`}>
                {/* Browser Header */}
                <div className={`px-4 py-3 flex items-center gap-3 border-b ${'bg-[#2D2D2D] border-black/20'}`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                  </div>
                  <div className={`text-xs px-3 py-1 rounded-md flex-1 text-center font-mono ${'bg-[#1E1E1E] text-slate-400'}`}>
                    pytogether.org/ide
                  </div>
                </div>
                <video className="w-full h-auto" autoPlay loop muted playsInline><source src={liveDrawing} type="video/webm" /></video>
              </div>
              <div className="mt-4 text-center lg:text-left">
                <h3 className={`text-xl font-bold flex items-center gap-2 justify-center lg:justify-start ${'text-white'}`}>
                  <PenTool className="w-5 h-5 text-pink-400" />
                  Draw Over Code
                </h3>
                <p className={`text-sm mt-1 ${'text-slate-400'}`}>Annotate logic flows visually. Perfect for tutors.</p>
              </div>
            </div>

          </div>

          {/* Embed Feature */}
          <div className="mt-20 relative group max-w-5xl mx-auto">
            <div className={`relative rounded-xl border shadow-2xl overflow-hidden ${'bg-[#1E1E1E] border-slate-700'}`}>
              {/* Browser Header */}
              <div className={`px-4 py-3 flex items-center gap-3 border-b ${'bg-[#2D2D2D] border-black/20'}`}>
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F56]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#27C93F]"></div>
                </div>
                <div className={`text-xs px-3 py-1 rounded-md flex-1 text-center font-mono ${'bg-[#1E1E1E] text-slate-400'}`}>
                  pytogether.org/embed/...
                </div>
              </div>
              <iframe src="https://pytogether.org/embed/eyJwaWQiOjMsInR5cGUiOiJzbmlwcGV0In0:1w19ES:B27nlyDrROmKl9yhr3NjNv93w47bX_sKIgrqDVUd28A" width="100%" height="500px" frameBorder="0"></iframe>
            </div>
            <div className="mt-6 text-center">
              <h3 className={`text-2xl font-bold flex items-center justify-center gap-2 ${'text-white'}`}>
                <Code className="w-6 h-6 text-teal-400" />
                Embed Interactive Snippets
              </h3>
              <p className={`text-sm mt-2 max-w-2xl mx-auto ${'text-slate-400'}`}>
                Take PyTogether with you. Generate a read-only iframe to embed your code, console, and plots right into your own blog or learning platform.
              </p>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section id="bento-section" className={`relative z-10 py-24 border-t ${'bg-[#0F141F] border-slate-800'}`}>
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${'text-white'}`}>Everything you need to learn or teach Python</h2>
              <p className={'text-slate-400'}>Built for the modern classroom, stripped of unnecessary complexity.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">

              {/* Simplicity & Tech Stack */}
              <div className={`col-span-1 md:col-span-2 p-8 rounded-3xl transition-colors group flex flex-col justify-between border ${
                'bg-slate-900/50 border-slate-800 hover:border-blue-500/30'
              }`}>
                <div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Zap className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-3 ${'text-white'}`}>Lightning Fast & Browser Based</h3>
                  <p className={`leading-relaxed mb-6 ${'text-slate-400'}`}>
                    No servers to spin up. No software to install. PyTogether runs CPython 3.13 via Pyodide (WebAssembly) directly in your browser. It works on Chromebooks, tablets, and low-end laptops instantly.
                  </p>
                </div>

                {/* Tech stack */}
                <div className={`pt-6 border-t ${'border-slate-800/50'}`}>
                  <p className={`text-xs font-mono mb-3 uppercase ${'text-slate-500'}`}>Built With</p>
                  <div className="flex gap-6 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                    <img src="/logos/react.png" alt="React" className="h-6 w-auto object-contain" title="React" />
                    <img src="/logos/django.png" alt="Django" className="h-6 w-auto object-contain" title="Django" />
                    <img src="/logos/supabase.png" alt="Supabase" className="h-6 w-auto object-contain" title="Supabase" />
                    <img
                      src="/logos/wasm.png"
                      alt="WebAssembly"
                      className="h-6 w-auto object-contain"
                      title="Pyodide (via WebAssembly)"
                    />
                  </div>
                </div>
              </div>

              {/* Packages */}
              <div className={`col-span-1 p-8 rounded-3xl relative overflow-hidden border ${
                'bg-slate-800 border-slate-700'
              }`}>
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Package className="w-24 h-24" />
                </div>
                <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 ${'text-white'}`}>
                  <Terminal className="w-5 h-5 text-green-400" />
                  Pre-installed
                </h3>
                <ul className="space-y-3">
                  {['numpy', 'pandas', 'matplotlib', 'scipy'].map((pkg) => (
                    <li key={pkg} className={`flex items-center gap-2 font-mono text-sm ${'text-slate-300'}`}>
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      {pkg}
                    </li>
                  ))}
                </ul>
                <div className={`mt-6 pt-6 border-t ${'border-slate-700/50'}`}>
                  <p className={`text-xs ${'text-slate-500'}`}>Auto-installs imports on the fly.</p>
                </div>
              </div>

              {/* Safety/Save */}
              <div className={`col-span-1 p-8 rounded-3xl transition-colors border ${
                'bg-slate-900/50 border-slate-800 hover:border-green-500/30'
              }`}>
                <div className="w-12 h-12 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                  <Save className="w-6 h-6 text-green-400" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${'text-white'}`}>Reliable Autosave</h3>
                <p className={`text-sm ${'text-slate-400'}`}>
                  Never lose work. Projects save automatically every minute and upon exit.
                </p>
              </div>

              {/* Groups */}
              <div className={`col-span-1 md:col-span-2 p-8 rounded-3xl transition-colors flex flex-col md:flex-row items-center gap-8 border ${
                'bg-slate-900/50 border-slate-800 hover:border-blue-500/30'
              }`}>
                <div className="flex-1">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${'text-white'}`}>Group Management</h3>
                  <p className={'text-slate-400'}>Create groups, invite via pass code, and manage projects effortlessly. Built-in voice calls and chat for every project. <strong>You can also share snippet and edit links to your friends!</strong></p>
                </div>
              </div>

              {/* Disclaimer */}
              <div className={`col-span-1 md:col-span-2 p-6 rounded-3xl flex items-start gap-4 border ${
                'bg-amber-900/10 border-amber-500/20'
              }`}>
                <div className="shrink-0 mt-1">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 ${'text-amber-400'}`}>Platform Limitations</h3>
                  <p className={`text-sm leading-relaxed ${'text-slate-400'}`}>
                    Because PyTogether runs entirely in the browser (WASM),
                    <strong> GUI libraries like Pygame and Tkinter are not supported</strong>.
                    Though standard I/O and data science libraries (Matplotlib, Numpy) work perfectly.
                  </p>
                </div>
              </div>

              {/* ME */}
              <div className={`col-span-1 p-6 rounded-3xl flex flex-col justify-between relative overflow-hidden group transition-all border ${
                'bg-blue-900/10 border-blue-500/30 hover:border-blue-500'
              }`}>
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-blue-400/30">
                      <img
                        src="/me.jpg"
                        alt="Jawad Rizvi"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold leading-tight ${'text-white'}`}>Built Solo</h3>
                      <a
                        href="https://www.linkedin.com/in/syed-jawad-rizvi"
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        By Jawad Rizvi
                      </a>
                    </div>
                  </div>

                  <p className={`text-sm mb-6 leading-relaxed ${'text-slate-400'}`}>
                    Designed, deployed, and developed entirely by Jawad Rizvi. All support is appreciated!
                  </p>
                  <a
                    href="https://buymeacoffee.com/sjriz"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FFDD00] hover:bg-[#e6c700] text-black text-sm font-bold rounded-xl transition-all hover:scale-[1.02] shadow-lg shadow-yellow-500/10 mb-2"
                  >
                    <Coffee className="w-4 h-4 stroke-[3]" />
                    <span>Buy me a coffee</span>
                  </a>

                </div>

                {/* Icon Buttons */}
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/SJRiz"
                      target="_blank"
                      rel="noreferrer"
                      title="GitHub"
                      aria-label="Jawad Rizvi's GitHub Profile"
                      className={`transition-colors ${'text-slate-400 hover:text-white'}`}
                    >
                      <Github className="w-4 h-4" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/syed-jawad-rizvi"
                      target="_blank"
                      rel="noreferrer"
                      title="LinkedIn"
                      aria-label="Jawad Rizvi's LinkedIn Profile"
                      className={`transition-colors ${'text-slate-400 hover:text-white'}`}
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-24 px-6 text-center z-10 overflow-hidden">
          <div className={`relative max-w-3xl mx-auto backdrop-blur-xl border p-12 rounded-3xl shadow-2xl ${
            'bg-slate-900/80 border-slate-700'
          }`}>
            <h2 className={`text-3xl md:text-5xl font-bold mb-6 ${'text-white'}`}>Ready to start coding?</h2>
            <p className={`mb-8 text-lg ${'text-slate-300'}`}>
              Join thousands of users today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button
                onClick={handleGetStarted}
                className={`px-8 py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  'bg-white text-black hover:bg-slate-200'
                }`}
              >
                <LogIn className="w-5 h-5" />
                Create Free Account
              </button>
              <a
                href="https://github.com/SJRiz/pytogether"
                target="_blank"
                rel="noreferrer"
                className={`px-8 py-4 border rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                  'bg-slate-800 text-white border-slate-600 hover:bg-slate-700'
                }`}
              >
                <Github className="w-5 h-5" />
                View on GitHub
              </a>
            </div>

            <div className={`mt-8 flex flex-wrap justify-center gap-4 text-sm ${'text-slate-500'}`}>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> No Credit Card</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Open Source</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> Instant Access</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={`border-t py-12 text-center relative z-10 ${'border-slate-800 bg-[#05080F]'}`}>
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 hover:opacity-100 transition-opacity">
            <img src="/pytog.png" alt="PyTogether Logo" className="h-6 w-6 grayscale" onError={(e) => e.target.style.display = 'none'} />
            <span className={`font-bold ${'text-slate-300'}`}>PyTogether</span>
          </div>
          <p className={`text-sm mb-4 ${'text-slate-500'}`}>
            &copy; {new Date().getFullYear()} PyTogether. Built with ❤️ for the Python community.
          </p>

          <a href="mailto:contact@pytogether.org" className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
            contact@pytogether.org
          </a>
        </footer>

      </div>
    </>
  );
}