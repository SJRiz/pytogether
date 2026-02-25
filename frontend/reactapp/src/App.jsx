import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ServerCrash } from 'lucide-react';
import PyIDE from "./pages/PyIDE";
import GroupsAndProjectsPage from './pages/GroupsProjects';
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import About from './pages/About';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import OfflinePlayground from './pages/OfflinePlayground';
import SharedProjectHandler from './components/SharedProjectHandler';
import useUmamiHeartbeat from './hooks/useUmamiHeartbeat';

function App() {
  useUmamiHeartbeat();
  const [isBackendDown, setIsBackendDown] = useState(false);

  useEffect(() => {
    const handleDown = () => setIsBackendDown(true);
    const handleUp = () => setIsBackendDown(false);

    window.addEventListener('backendDown', handleDown);
    window.addEventListener('backendUp', handleUp);

    return () => {
      window.removeEventListener('backendDown', handleDown);
      window.removeEventListener('backendUp', handleUp);
    };
  }, []);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((registration) => {
          console.log('[App] SW Registered:', registration.scope);

          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => {
          console.error('[App] SW Registration Failed:', err);
        });
    }
  }, []);

  useEffect(() => {
    document.body.style.overscrollBehaviorY = 'none';
    document.documentElement.style.overscrollBehaviorY = 'none';

    return () => {
      document.body.style.overscrollBehaviorY = '';
      document.documentElement.style.overscrollBehaviorY = '';
    };
  }, []);

  if (isBackendDown) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
        <ServerCrash className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-2 text-center">System Offline</h1>
        <p className="text-gray-400 text-center max-w-md mb-8">
          Cannot reach the server. It might be down for maintenance, updating, or you made an improper request. Please try again in a few moments.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 font-medium px-6 py-2 rounded-lg transition-colors border border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={
          <PublicRoute>
            <About />
          </PublicRoute>
        }
        />
        <Route path="/terms" element={
          <TermsOfService />
        }
        />
        <Route path="/privacy" element={
          <PrivacyPolicy />
        }
        />
        <Route path="/playground" element={
          <OfflinePlayground />
        }
        />

        <Route path="/snippet/:token" element={<OfflinePlayground />} />
        <Route path="/join-shared/:token"
          element={
            <ProtectedRoute>
              <SharedProjectHandler />
            </ProtectedRoute>
          }
        />

        <Route path="/home"
          element={
            <ProtectedRoute>
              <GroupsAndProjectsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/groups/:groupId/projects/:projectId"
          element={
            <ProtectedRoute>
              <PyIDE />
            </ProtectedRoute>
          }
        />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
        />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </div>
  );
}

export default App;