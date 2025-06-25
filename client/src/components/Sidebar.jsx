// src/components/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios'; // Make sure this path is correct

const Sidebar = ({ isAdmin }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [userName, setUserName] = useState('Guest');
  const [userAvatar, setUserAvatar] = useState('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png');
  const [loadingUser, setLoadingUser] = useState(true);
  const [errorUser, setErrorUser] = useState(null);

  const fetchUserData = async () => {
    // Only fetch for regular users or if you explicitly want admin profile data here
    if (!isAdmin) {
        try {
            setLoadingUser(true);
            setErrorUser(null);
            const response = await API.get('/users/profile');
            if (response.data) {
                // Ensure you're pulling the correct fields for name/avatar from your user profile schema
                // Assuming profile.firstName/lastName or just a 'name' field, and 'avatar' field.
                setUserName(response.data.profile?.firstName || response.data.username || 'User');
                setUserAvatar(response.data.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png');
            }
        } catch (err) {
            console.error('Error fetching user data for sidebar:', err);
            setErrorUser('Failed to load user info.');
            setUserName('Guest');
            if (err.response && err.response.status === 401) {
                localStorage.clear();
                navigate('/login'); // Redirect to login on token expiration/invalid
            }
        } finally {
            setLoadingUser(false);
        }
    } else {
      // For admin sidebar, set default values or specific admin data
      setLoadingUser(false);
      setUserName('Admin User');
      setUserAvatar('https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [location.pathname, isAdmin]); // Re-fetch on route change or isAdmin prop change

  const handleLogout = () => {
    localStorage.clear();
    navigate('/'); // Navigate to the root login page
  };

  const renderNavLinks = () => {
    if (isAdmin) {
      return (
        <>
          <NavLink to="/admin" style={styles.link}>📊 Overview</NavLink> {/* Changed to index route */}
          <NavLink to="/admin/users" style={styles.link}>👥 User Management</NavLink>
          <NavLink to="/admin/projects" style={styles.link}>📁 Project Oversight</NavLink>
          <NavLink to="/admin/messages" style={styles.link}>📬 Message Monitoring</NavLink>
        </>
      );
    }
    return (
      <>
        <NavLink to="/dashboard/projects" style={styles.link}>📁 Projects</NavLink>
        <NavLink to="/dashboard/messages" style={styles.link}>💬 Messages</NavLink>
        <NavLink to="/dashboard/collaborators" style={styles.link}>👥 Collaborators</NavLink>
        {/* Corrected path for Conversations */}
        <NavLink to="/dashboard/conversations" style={styles.link}>🗣️ Conversations</NavLink>
        <NavLink to="/dashboard/profile" style={styles.link}>👤 Profile</NavLink>
      </>
    );
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.topSection}>
        <h2 style={styles.title}>
          {isAdmin ? '👑 Admin Dashboard' : '📂 CollabMate'}
        </h2>

        {!isAdmin && (
          <div style={styles.profileSection}>
            {loadingUser ? (
              <div style={styles.loadingAvatar}></div>
            ) : (
              <NavLink to="/dashboard/profile" style={styles.avatarLink}>
                <img src={userAvatar} alt="User Avatar" style={styles.avatar} />
              </NavLink>
            )}
            <h3 style={styles.userName}>
              {loadingUser ? 'Loading...' : userName}
            </h3>
            {errorUser && <p style={styles.errorText}>{errorUser}</p>}
          </div>
        )}

        <div style={styles.navLinks}>
          {renderNavLinks()}
        </div>
      </div>
      <div style={styles.bottomSection}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <span style={styles.logoutIcon}>🚪</span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  sidebar: {
    width: '240px',
    height: '100vh',
    backgroundColor: '#1e293b',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    boxShadow: '2px 0 5px rgba(0,0,0,0.2)',
    zIndex: 100,
  },
  topSection: {
    padding: '20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    marginBottom: '30px',
    color: '#f8fafc',
    textAlign: 'center',
  },
  profileSection: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '0 15px',
    width: '100%',
  },
  avatarLink: {
    display: 'block',
    marginBottom: '10px',
  },
  avatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #4f46e5',
    transition: 'transform 0.2s ease-in-out',
  },
  loadingAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#334155',
    marginBottom: '10px',
    animation: 'pulse 1.5s infinite ease-in-out',
  },
  '@keyframes pulse': {
    '0%': { opacity: 0.7 },
    '50%': { opacity: 1 },
    '100%': { opacity: 0.7 }
  },
  userName: {
    fontSize: '18px',
    fontWeight: 'bold',
    margin: 0,
    color: '#f8fafc',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '12px',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
    padding: '0 20px',
    boxSizing: 'border-box',
  },
  link: {
    color: '#94a3b8',
    textDecoration: 'none',
    padding: '10px 15px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '&:hover': {
      backgroundColor: '#334155',
      color: '#f8fafc',
    },
    '&.active': {
      backgroundColor: '#4f46e5',
      color: 'white',
    },
  },
  bottomSection: {
    padding: '20px',
    borderTop: '1px solid #334155',
    width: '100%',
    boxSizing: 'border-box',
  },
  logoutButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#334155',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#475569',
    },
  },
  logoutIcon: {
    fontSize: '16px',
  },
};

export default Sidebar;