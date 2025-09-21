import { Routes, Route } from 'react-router-dom';
import PyIDE from "./pages/PyIDE";
import GroupsAndProjectsPage from './pages/GroupsProjects';
import Login from "./pages/Login";
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import About from './pages/About';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/" 
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
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element= {<About/>} />
      </Routes>
    </div>
  );
}

export default App;
