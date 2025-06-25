// components/DashboardLayout.jsx (or layouts/DashboardLayout.jsx)

import React from 'react';

const DashboardLayout = ({ children }) => {
  return (
    <div style={layoutStyles.container}>
      {/* Sidebar Placeholder: This is where your actual sidebar component would go */}
      <aside style={layoutStyles.sidebar}>
        <div style={layoutStyles.sidebarHeader}>
          {/* Your logo or dashboard title here */}
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Admin Panel</h3>
        </div>
        <nav style={layoutStyles.navigation}>
          <ul style={layoutStyles.navList}>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>📊 Overview</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>👥 User Management</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>📁 Project Oversight</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>💬 Message Monitoring</a></li>
            <li style={layoutStyles.navItem}><a href="#" style={layoutStyles.navLink}>🤝 Collaborations</a></li>
            {/* Add more navigation links as per your actual sidebar */}
            <li style={layoutStyles.logoutItem}><a href="#" style={layoutStyles.navLink}>➡️ Logout</a></li>
          </ul>
        </nav>
      </aside>

      {/* Main Content Area: This is where AdminDashboard.jsx will be rendered */}
      <main style={layoutStyles.mainContent}>
        {children} {/* This prop will render AdminDashboard */}
      </main>
    </div>
  );
};

const layoutStyles = {
  container: {
    display: 'flex', // Use flexbox for horizontal alignment
    minHeight: '100vh', // Ensure it takes full viewport height
    backgroundColor: '#f1f5f9', // Consistent background
    fontFamily: "'Inter', sans-serif",
  },
  sidebar: {
    width: '250px', // Fixed width for the sidebar
    backgroundColor: '#1e293b', // Dark background for sidebar
    color: '#f8fafc',
    padding: '20px',
    boxShadow: '4px 0 12px rgba(0,0,0,0.1)', // Shadow to the right
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between', // Push logout to bottom
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
    flexGrow: 1, // Allow navigation to take available space
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
      backgroundColor: '#334155', // Darker gray on hover
      color: '#ffffff',
    },
    // You might add an 'active' style here based on current route
  },
  logoutItem: {
    marginTop: 'auto', // Pushes this item to the bottom of the flex container
    paddingTop: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  mainContent: {
    flexGrow: 1, // Allow main content to take remaining space
    overflowY: 'auto', // Enable scrolling for main content if it overflows
    padding: '0', // No padding here, as AdminDashboard has its own
  },
};

export default DashboardLayout;