import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
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

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element= {
          <PublicRoute>
            <About/>
          </PublicRoute>
          } 
        />
        <Route path="/terms" element= {
            <TermsOfService/>
          } 
        />
        <Route path="/privacy" element= {
            <PrivacyPolicy/>
          } 
        />
        <Route path="/playground" element= {
            <OfflinePlayground/>
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
        <Route path="/ide" 
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
      </Routes>
    </div>
  );
}

export default App;