import { ArrowLeft, Shield, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-300 p-8 flex justify-center">
      <div className="max-w-3xl w-full">
        {/* Navigation */}
        <Link to="/login" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
        
        {/* Header */}
        <div className="border-b border-gray-800 pb-8 mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-500" />
                Privacy Policy
            </h1>
            <p className="text-gray-500">Last Updated: December 2025</p>
        </div>
        
        {/* Content */}
        <div className="space-y-8 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to <strong>PyTogether</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
              This Privacy Policy explains what information we collect, how we use it, and your rights in relation to it when you use our collaborative IDE platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>
                <strong>Account Information:</strong> When you register, we collect your email address and an encrypted version of your password. If you use Google Login, we collect your email address provided by Google.
              </li>
              <li>
                <strong>User Content (Code):</strong> We collect and store the code files, and project names you create within the IDE to provide the persistence and collaboration features.
              </li>
              <li>
                <strong>Usage Data:</strong> We may collect basic server logs including IP addresses and browser types to monitor the health and security of the application.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use your information solely for the purpose of running the PyTogether service, specifically to:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>Create and manage your account.</li>
              <li>Allow you to save, retrieve, and edit your code projects.</li>
              <li>Enable real-time collaboration with other users (e.g., syncing selections and text changes).</li>
              <li>Prevent fraudulent activity and ensure the security of the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>
              We use <strong>Google OAuth</strong> to allow you to log in easily. By using this feature, you authorize us to access your name and email address associated with your Google account. We do not access your contacts, calendar, or other Google data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Lock className="h-5 w-5 text-blue-400" />
                5. Data Security & Code Safety
            </h2>
            <p className="mb-4">
              We implement reasonable security measures to protect your data (such as hashing passwords). However, please note:
            </p>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg">
                <p className="text-blue-200 font-medium mb-1">Important Note on Sensitive Data</p>
                <p className="text-gray-400">
                    <strong>Do not store sensitive credentials</strong> (such as API secrets, or passwords) inside your code files on this platform. We cannot guarantee that user-generated code will remain private in the event of a database breach.
                </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies and Local Storage</h2>
            <p>
              We use HTTP cookies and browser Local Storage to maintain your logged-in session. You can control cookies through your browser settings, but disabling them may prevent you from logging in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Data Retention & Deletion</h2>
            <p>
              We retain your code and account information indefinitely to provide the service. If you wish to delete your account and all associated data, please contact us at the email below, and we will remove your information from our database.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;