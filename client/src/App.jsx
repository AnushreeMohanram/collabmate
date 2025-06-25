// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar'; // Your sidebar component
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Collaborators from './pages/Collaborators';
import Conversations from './pages/Conversations'; // Your new Conversations page
import Profile from './components/Profile'; // User profile
import AdminDashboard from './pages/AdminDashboard'; // Admin landing page
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import DashboardLayout from './components/DashboardLayout';
import AdminMessages from './pages/admin/AdminMessages';
const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user')); // Get full user object
  const token = localStorage.getItem('token');
  const location = useLocation(); // Get current location to redirect back after login

  if (!token || !user) {
    
    return <Navigate to={`/?redirect=${location.pathname}`} replace />;
  }

  // If allowedRoles are specified, check if the user's role is included
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized, redirect to their respective dashboard or a generic unauthorized page
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard/projects'} replace />;
  }

  return children;
};

function App() {
  // Use state to make user role reactive to changes (e.g., login/logout)
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      setUserRole(null); // Clear role if no user found
    }

    // Optional: Listen for storage changes if role might be updated elsewhere
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      setUserRole(updatedUser ? updatedUser.role : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // Empty dependency array means this runs once on mount

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} /> {/* Login is now the default root */}
        <Route path="/register" element={<Register />} />

        {/* Admin routes - Protected */}
        <Route
          path="/admin/*" // Use /* for nested routes
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <div style={{ display: 'flex' }}>
                <Sidebar isAdmin={true} />
                {/* Admin-specific nested routes */}
                <div style={{ flexGrow: 1, padding: '20px' }}> {/* Add a wrapper for content */}
                  <Routes>
                    <Route index element={<AdminDashboard />} /> {/* Default route for /admin */}
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="messages" element={<AdminMessages />} />
                    {/* Assuming AdminDashboard activeTab is used for rendering sub-content */}
                    <Route path="collaborations" element={<AdminDashboard activeTab="collaborations" />} />
                    {/* Fallback for admin if path doesn't match */}
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </div>
              </div>
            </PrivateRoute>
          }
        />

        {/* User dashboard routes - Protected */}
        <Route
          path="/dashboard/*" // Use /* for nested routes
          element={
            <PrivateRoute allowedRoles={['user']}>
              <div style={{ display: 'flex' }}>
                <Sidebar isAdmin={false} /> {/* Regular user sidebar */}
                {/* User-specific nested routes */}
                <div style={{ flexGrow: 1, padding: '20px' }}> {/* Add a wrapper for content */}
                  <Routes>
                    {/* Default route for /dashboard */}
                    <Route index element={<Navigate to="projects" replace />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="collaborators" element={<Collaborators />} />
                    <Route path="profile" element={<Profile />} />
                    {/* NEW: Conversation Routes for users */}
                    <Route path="conversations" element={<Conversations />} />
                    <Route path="conversations/:conversationId" element={<Conversations />} />
                    {/* Fallback for user dashboard if path doesn't match */}
                    <Route path="*" element={<Navigate to="/dashboard/projects" replace />} />
                  </Routes>
                </div>
              </div>
            </PrivateRoute>
          }
        />

        {/* Catch-all for any other unhandled routes, redirects to login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;