import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import PyIDE from "./pages/PyIDE"
import Login from "./pages/Login";
import Register from './pages/Register';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
          <Routes>
          <Route path="/" element={<PyIDE/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/login" element={<Login/>} />
        </Routes>
    </div>
  );
}

export default App;
