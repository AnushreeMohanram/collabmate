import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import UserDashboard from './components/UserDashboard';
import Sidebar from './components/Sidebar';
import AdminDashboard from './pages/AdminDashboard';

import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Suggestions from './pages/Suggestions';
import Collaborators from './pages/Collaborators';

function App() {
  const userRole = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Admin routes */}
        <Route
          path="/admin/*"
          element={
            userRole === 'admin' ? (
              <div style={{ display: 'flex' }}>
                <Sidebar isAdmin={true} />
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="users" element={<AdminDashboard />} />
                  <Route path="projects" element={<AdminDashboard />} />
                  <Route path="collaborations" element={<AdminDashboard />} />
                </Routes>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* User dashboard routes */}
        <Route
          path="/dashboard/*"
          element={
            <div style={{ display: 'flex' }}>
              <Sidebar />
              <Routes>
                <Route path="projects" element={<Projects />} />
                <Route path="messages" element={<Messages />} />
                <Route path="suggestions" element={<Suggestions />} />
                <Route path="collaborators" element={<Collaborators />} />
              </Routes>
            </div>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
