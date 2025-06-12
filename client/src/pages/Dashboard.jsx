import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import CollaborationRequests from '../components/CollaborationRequests';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    totalMessages: 0,
    unreadMessages: 0,
    pendingCollaborations: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsRes = await API.get('/dashboard/stats');
      setStats(statsRes.data);

    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Dashboard</h2>
        <button 
          onClick={handleLogout}
          style={styles.logoutButton}
        >
          👋 Logout
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={fetchStats}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      <div style={styles.grid}>
        {/* Stats Cards */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Projects</h3>
            <p style={styles.statValue}>{stats.totalProjects}</p>
            <p style={styles.statSubtext}>{stats.activeProjects} active</p>
          </div>
          
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Tasks</h3>
            <p style={styles.statValue}>{stats.totalTasks}</p>
            <p style={styles.statSubtext}>{stats.completedTasks} completed</p>
          </div>
          
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Messages</h3>
            <p style={styles.statValue}>{stats.totalMessages}</p>
            <p style={styles.statSubtext}>{stats.unreadMessages} unread</p>
          </div>
          
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Collaborations</h3>
            <p style={styles.statValue}>{stats.pendingCollaborations}</p>
            <p style={styles.statSubtext}>pending requests</p>
          </div>
        </div>

        {/* Collaboration Requests */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Collaboration Requests</h3>
          <CollaborationRequests />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginLeft: '240px',
    padding: '30px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
    width: 'calc(100% - 240px)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  heading: {
    fontSize: '28px',
    color: '#1e293b',
    margin: 0,
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    margin: 0,
    fontSize: '14px',
  },
  retryButton: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#b91c1c',
    },
  },
  grid: {
    display: 'grid',
    gap: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    textAlign: 'center',
  },
  statTitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 10px 0',
  },
  statValue: {
    fontSize: '32px',
    color: '#1e293b',
    margin: '0 0 5px 0',
    fontWeight: 'bold',
  },
  statSubtext: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1e293b',
    margin: '0 0 20px 0',
  },
};

export default Dashboard; 