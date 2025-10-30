import { Routes, Route } from 'react-router-dom';
import PyIDE from "./pages/PyIDE";
import GroupsAndProjectsPage from './pages/GroupsProjects';
import Login from "./pages/Login";
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import About from './pages/About';

function App() {
  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element= {
          <PublicRoute>
            <About/>
          </PublicRoute>
          }
            />
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <GroupsAndProjectsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/ide" 
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
          } />
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
      </Routes>
    </div>
  );
}

export default App;
