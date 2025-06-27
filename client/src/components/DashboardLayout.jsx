import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div style={layoutStyles.container}>
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.sidebarHeader}>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Admin Panel</h3>
        </div>
        <nav style={layoutStyles.navigation}>
          <ul style={layoutStyles.navList}>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>📊 Overview</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>👥 User Management</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>📁 Project Oversight</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>💬 Message Monitoring</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>🤝 Collaborations</a></li>
            <li style={layoutStyles.logoutItem}><a href="#" style={layoutStyles.navLink}>➡️ Logout</a></li>
          </ul>
        </nav>
      </aside>

      
      <main style={layoutStyles.mainContent}>
        {children} 
      </main>
    </div>
  );
};

const layoutStyles = {
  container: {
    display: 'flex',
    minHeight: '100vh', 
    backgroundColor: '#f1f5f9', 
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: '250px', 
    backgroundColor: '#1e293b',
    color: '#f8fafc',
    padding: '20px',
    boxShadow: '4px 0 12px rgba(0,0,0,0.1)', 
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', 
  },
  sidebarHeader: {
    paddingBottom: '20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '20px',
    fontWeight: '700',
    color: '#f8fafc',
  },
  navigation: {
    flexGrow: 1, 
  },
  navList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  navItem: {
    marginBottom: '10px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '8px',
    color: '#f8fafc',
    textDecoration: 'none',
    fontSize: '16px',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    '&:hover': {
      backgroundColor: '#334155', 
      color: '#ffffff',
    },
    
  },
  logoutItem: {
    marginTop: 'auto', 
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  mainContent: {
    flexGrow: 1, 
    overflowY: 'auto', 
    padding: '0', 
  },
};

export default DashboardLayout;