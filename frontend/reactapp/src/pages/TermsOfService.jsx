import { FileText, AlertTriangle, Gavel } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-300 p-8 flex justify-center">
      <div className="max-w-3xl w-full">
        
        {/* Header */}
        <div className="border-b border-gray-800 pb-8 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-500" />
                Terms of Service
            </h1>
            <p className="text-gray-500">Last Updated: December 2025</p>
        </div>
        
        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>PyTogether</strong> ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>
              PyTogether is a web-based collaborative Integrated Development Environment (IDE) that allows users to write, execute, and share Python code in real-time. The Service is provided primarily for educational, demonstration, and portfolio purposes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p className="mb-2">
              To access certain features of the Service, you may be required to create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Maintaining the confidentiality of your account and password.</li>
              <li>All activities that occur under your account.</li>
              <li>Notifying us immediately of any breach of security or unauthorized use of your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                4. User Responsibilities & Acceptable Use
            </h2>
            <p className="mb-2">You agree <strong>not</strong> to use the Service to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Upload or execute malicious code, viruses, worms, or malware.</li>
              <li>Engage in cryptocurrency mining or any activity that places a disproportionate burden on our infrastructure.</li>
              <li>Attempt to gain unauthorized access to other users' projects or the Service's backend systems.</li>
              <li>Harass, abuse, or harm another person or group.</li>
            </ul>
            <p className="mt-3 text-gray-400 italic">
              We reserve the right to terminate or suspend your account immediately, without prior notice, if you breach these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Intellectual Property</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>
                <strong>Your Code:</strong> You retain all rights and ownership of the code and content you create or upload to PyTogether.
              </li>
              <li>
                <strong>Our Platform:</strong> The PyTogether platform, including its interface, logo, and original source code, remains the property of the PyTogether developers.
              </li>
            </ul>
          </section>

          <section className="bg-gray-900/50 p-6 rounded-xl border border-gray-800">
            <h2 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">
                6. Disclaimer of Warranties ("AS IS")
            </h2>
            <p className="mb-3">
              The Service is provided on an <strong>"AS IS"</strong> and <strong>"AS AVAILABLE"</strong> basis.
            </p>
            <p className="text-gray-400">
              PyTogether makes no representations or warranties of any kind, express or implied, regarding the operation of the Service. We do not guarantee that the Service will function uninterrupted, be secure, or be available at any particular time. <strong>We are not responsible for any loss of code or data. Please back up your work locally.</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>
              In no event shall the creators or maintainers of PyTogether be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Gavel className="h-5 w-5 text-gray-400" />
                8. Governing Law
            </h2>
            <p>
              These Terms shall be governed and construed in accordance with the laws of the Province of <strong>Ontario, Canada</strong>, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at:
              <br />
              <a href="mailto:contact@pytogether.org" className="text-blue-400 hover:underline mt-2 inline-block">
                contact@pytogether.org
              </a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;