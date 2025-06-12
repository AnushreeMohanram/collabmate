import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ isAdmin }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderNavLinks = () => {
    if (isAdmin) {
      return (
        <>
          <NavLink to="/admin" style={styles.link}>📊 Overview</NavLink>
          <NavLink to="/admin/users" style={styles.link}>👥 Users</NavLink>
          <NavLink to="/admin/projects" style={styles.link}>📁 Projects</NavLink>
          <NavLink to="/admin/collaborations" style={styles.link}>🤝 Collaborations</NavLink>
        </>
      );
    }
    return (
      <>
        <NavLink to="/dashboard/projects" style={styles.link}>📁 Projects</NavLink>
        <NavLink to="/dashboard/messages" style={styles.link}>💬 Messages</NavLink>
        <NavLink to="/dashboard/suggestions" style={styles.link}>🤖 Suggestions</NavLink>
        <NavLink to="/dashboard/collaborators" style={styles.link}>👥 Collaborators</NavLink>
      </>
    );
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.topSection}>
        <h2 style={styles.title}>
          {isAdmin ? '📊 Admin Dashboard' : '📂 CollabMate'}
        </h2>
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
    width: '220px',
    height: '100vh',
    backgroundColor: '#1e293b',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
  },
  topSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  bottomSection: {
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: 'auto',
    padding: '16px',
  },
  title: {
    color: '#f1f5f9',
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    padding: '0 8px',
  },
  navLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  link: {
    color: '#cbd5e1',
    textDecoration: 'none',
    fontSize: '15px',
    padding: '12px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '&:hover': {
      backgroundColor: '#334155',
      color: '#f1f5f9',
    },
    '&.active': {
      backgroundColor: '#334155',
      color: '#f1f5f9',
      fontWeight: '500',
    }
  },
  logoutButton: {
    width: '100%',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    padding: '12px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    }
  },
  logoutIcon: {
    fontSize: '16px',
  }
};

export default Sidebar;
