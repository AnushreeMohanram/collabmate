// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar'; 
import Projects from './pages/Projects';
import Messages from './pages/Messages';
import Collaborators from './pages/Collaborators';
import Conversations from './pages/Conversations'; 
import Profile from './components/Profile'; 
import AdminDashboard from './pages/AdminDashboard'; 
import AdminUsers from './pages/admin/AdminUsers';
import AdminProjects from './pages/admin/AdminProjects';
import DashboardLayout from './components/DashboardLayout';
import AdminMessages from './pages/admin/AdminMessages';

const PrivateRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user')); 
  const token = localStorage.getItem('token');
  const location = useLocation(); 

  if (!token || !user) {
    
    return <Navigate to={`/?redirect=${location.pathname}`} replace />;
  }

  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard/projects'} replace />;
  }

  return children;
};

function App() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.role) {
      setUserRole(user.role);
    } else {
      setUserRole(null); 
    }

   
    const handleStorageChange = () => {
      const updatedUser = JSON.parse(localStorage.getItem('user'));
      setUserRole(updatedUser ? updatedUser.role : null);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); 

  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Login />} /> 
        <Route path="/register" element={<Register />} />

        
        <Route
          path="/admin/*" 
          element={
            <PrivateRoute allowedRoles={['admin']}>
              <div style={{ display: 'flex' }}>
                <Sidebar isAdmin={true} />
                <div style={{ flexGrow: 1, padding: '20px' }}> 
                  <Routes>
                    <Route index element={<AdminDashboard />} /> 
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="projects" element={<AdminProjects />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="collaborations" element={<AdminDashboard activeTab="collaborations" />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </div>
              </div>
            </PrivateRoute>
          }
        />

        <Route
          path="/dashboard/*" 
          element={
            <PrivateRoute allowedRoles={['user']}>
              <div style={{ display: 'flex' }}>
                <Sidebar isAdmin={false} /> 
                <div style={{ flexGrow: 1, padding: '20px' }}> 
                  <Routes>
                    <Route index element={<Navigate to="projects" replace />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="messages" element={<Messages />} />
                    <Route path="collaborators" element={<Collaborators />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="conversations" element={<Conversations />} />
                    <Route path="conversations/:conversationId" element={<Conversations />} />
                    <Route path="*" element={<Navigate to="/dashboard/projects" replace />} />
                  </Routes>
                </div>
              </div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;