import { useState, useEffect } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalCollaborations: 0,
    activeUsers: 0,
    recentActivities: [],
    systemMetrics: {
      cpu: 0,
      memory: 0,
      storage: 0,
      uptime: 0
    }
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('week');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, usersRes, projectsRes, collabsRes] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/projects'),
        API.get('/admin/collaborations')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProjects(projectsRes.data);
      setCollaborations(collabsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      await API.put(`/admin/users/${userId}/${action}`);
      fetchDashboardData();
      alert(`User ${action} successfully`);
    } catch (err) {
      alert(`Failed to ${action} user`);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      await API.put(`/admin/projects/${projectId}/${action}`);
      fetchDashboardData();
      alert(`Project ${action} successfully`);
    } catch (err) {
      alert(`Failed to ${action} project`);
    }
  };

  const openModal = (type, data = null) => {
    setModalType(type);
    if (type === 'user') setSelectedUser(data);
    if (type === 'project') setSelectedProject(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setSelectedProject(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.heading}>👑 Admin Dashboard</h1>
          <div style={styles.dateFilter}>
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              style={styles.select}
            >
              <option value="day">Last 24 Hours</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </div>
        <div style={styles.headerRight}>
          <button 
            onClick={fetchDashboardData}
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '🔄 Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.activeTab : styles.tab}
        >
          📊 Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? styles.activeTab : styles.tab}
        >
          👥 Users ({users.length})
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          style={activeTab === 'projects' ? styles.activeTab : styles.tab}
        >
          📁 Projects ({projects.length})
        </button>
        <button 
          onClick={() => setActiveTab('collaborations')}
          style={activeTab === 'collaborations' ? styles.activeTab : styles.tab}
        >
          🤝 Collaborations ({collaborations.length})
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={activeTab === 'settings' ? styles.activeTab : styles.tab}
        >
          ⚙️ Settings
        </button>
      </div>

      {loading ? (
        <div style={styles.loader}>
          <div style={styles.spinner}></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div style={styles.overview}>
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <h3>👥 Total Users</h3>
                  <p style={styles.statNumber}>{stats.totalUsers}</p>
                  <div style={styles.statDetails}>
                    <span>Active: {stats.activeUsers}</span>
                    <span>New: {stats.newUsers}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <h3>📁 Total Projects</h3>
                  <p style={styles.statNumber}>{stats.totalProjects}</p>
                  <div style={styles.statDetails}>
                    <span>Active: {stats.activeProjects}</span>
                    <span>New: {stats.newProjects}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <h3>🤝 Collaborations</h3>
                  <p style={styles.statNumber}>{stats.totalCollaborations}</p>
                  <div style={styles.statDetails}>
                    <span>Active: {stats.activeCollaborations}</span>
                    <span>Pending: {stats.pendingCollaborations}</span>
                  </div>
                </div>
                <div style={styles.statCard}>
                  <h3>💻 System Health</h3>
                  <div style={styles.systemMetrics}>
                    <div style={styles.metric}>
                      <span>CPU</span>
                      <div style={styles.progressBar}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${stats.systemMetrics.cpu}%`,
                            backgroundColor: stats.systemMetrics.cpu > 80 ? '#ef4444' : '#4f46e5'
                          }}
                        ></div>
                      </div>
                      <span>{stats.systemMetrics.cpu}%</span>
                    </div>
                    <div style={styles.metric}>
                      <span>Memory</span>
                      <div style={styles.progressBar}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${stats.systemMetrics.memory}%`,
                            backgroundColor: stats.systemMetrics.memory > 80 ? '#ef4444' : '#4f46e5'
                          }}
                        ></div>
                      </div>
                      <span>{stats.systemMetrics.memory}%</span>
                    </div>
                    <div style={styles.metric}>
                      <span>Storage</span>
                      <div style={styles.progressBar}>
                        <div 
                          style={{
                            ...styles.progressFill,
                            width: `${stats.systemMetrics.storage}%`,
                            backgroundColor: stats.systemMetrics.storage > 80 ? '#ef4444' : '#4f46e5'
                          }}
                        ></div>
                      </div>
                      <span>{stats.systemMetrics.storage}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.recentActivity}>
                <div style={styles.sectionHeader}>
                  <h2>Recent Activity</h2>
                  <button 
                    onClick={() => setDateRange('day')}
                    style={styles.viewAllButton}
                  >
                    View All
                  </button>
                </div>
                <div style={styles.activityList}>
                  {stats.recentActivities.map((activity, i) => (
                    <div key={i} style={styles.activityItem}>
                      <span style={styles.activityIcon}>
                        {activity.type === 'user' ? '👤' : 
                         activity.type === 'project' ? '📁' : '🤝'}
                      </span>
                      <div style={styles.activityDetails}>
                        <p style={styles.activityText}>{activity.description}</p>
                        <small style={styles.activityTime}>
                          {new Date(activity.timestamp).toLocaleString()}
                        </small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <button 
                  onClick={() => openModal('user')}
                  style={styles.addButton}
                >
                  + Add User
                </button>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter(user => 
                      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(user => (
                      <tr key={user._id}>
                        <td>
                          <div style={styles.userCell}>
                            <span style={styles.userAvatar}>
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span style={styles.roleBadge}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span style={styles.statusBadge}>
                            {user.isActive ? '🟢 Active' : '🔴 Inactive'}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => openModal('user', user)}
                              style={styles.editButton}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, user.isActive ? 'deactivate' : 'activate')}
                              style={styles.actionButton}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleUserAction(user._id, 'delete')}
                              style={styles.deleteButton}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'projects' && (
            <div style={styles.tableContainer}>
              <div style={styles.tableHeader}>
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                <button 
                  onClick={() => openModal('project')}
                  style={styles.addButton}
                >
                  + Add Project
                </button>
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Owner</th>
                    <th>Collaborators</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects
                    .filter(project => 
                      project.title.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(project => (
                      <tr key={project._id}>
                        <td>
                          <div style={styles.projectCell}>
                            <span style={styles.projectIcon}>📁</span>
                            {project.title}
                          </div>
                        </td>
                        <td>{project.owner.name}</td>
                        <td>{project.collaborators.length}</td>
                        <td>{new Date(project.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span style={styles.statusBadge}>
                            {project.status}
                          </span>
                        </td>
                        <td>
                          <div style={styles.actionButtons}>
                            <button
                              onClick={() => openModal('project', project)}
                              style={styles.editButton}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleProjectAction(project._id, 'archive')}
                              style={styles.actionButton}
                            >
                              Archive
                            </button>
                            <button
                              onClick={() => handleProjectAction(project._id, 'delete')}
                              style={styles.deleteButton}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={styles.settingsContainer}>
              <div style={styles.settingsSection}>
                <h2>System Settings</h2>
                <div style={styles.settingsGrid}>
                  <div style={styles.settingCard}>
                    <h3>Email Notifications</h3>
                    <div style={styles.settingControl}>
                      <label>
                        <input type="checkbox" checked={true} />
                        Enable email notifications
                      </label>
                    </div>
                  </div>
                  <div style={styles.settingCard}>
                    <h3>System Maintenance</h3>
                    <div style={styles.settingControl}>
                      <button style={styles.maintenanceButton}>
                        Schedule Maintenance
                      </button>
                    </div>
                  </div>
                  <div style={styles.settingCard}>
                    <h3>Backup Settings</h3>
                    <div style={styles.settingControl}>
                      <button style={styles.backupButton}>
                        Create Backup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>{modalType === 'user' ? 'User Details' : 'Project Details'}</h2>
              <button onClick={closeModal} style={styles.closeButton}>×</button>
            </div>
            <div style={styles.modalContent}>
              {/* Modal content based on type */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginLeft: '220px',
    padding: '30px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
    width: 'calc(100% - 220px)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  headerRight: {
    display: 'flex',
    gap: '10px',
  },
  heading: {
    fontSize: '28px',
    color: '#1e293b',
    margin: 0,
  },
  dateFilter: {
    position: 'relative',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '10px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
    },
  },
  activeTab: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  loader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f1f5f9',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  overview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '10px 0',
  },
  statDetails: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: '14px',
  },
  systemMetrics: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  metric: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  recentActivity: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  viewAllButton: {
    padding: '6px 12px',
    backgroundColor: 'transparent',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f1f5f9',
      color: '#1e293b',
    },
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  activityIcon: {
    fontSize: '20px',
  },
  activityDetails: {
    flex: 1,
  },
  activityText: {
    margin: 0,
    color: '#1e293b',
  },
  activityTime: {
    color: '#64748b',
    fontSize: '12px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  tableHeader: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    width: '300px',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  userAvatar: {
    width: '32px',
    height: '32px',
    backgroundColor: '#4f46e5',
    color: 'white',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  roleBadge: {
    padding: '4px 8px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '4px',
    fontSize: '12px',
  },
  statusBadge: {
    padding: '4px 8px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    borderRadius: '4px',
    fontSize: '12px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e2e8f0',
      color: '#1e293b',
    },
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
  settingsContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    padding: '20px',
  },
  settingsSection: {
    marginBottom: '30px',
  },
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  settingCard: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
  },
  settingControl: {
    marginTop: '15px',
  },
  maintenanceButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  backupButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#059669',
    },
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '500px',
    maxWidth: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#64748b',
    '&:hover': {
      color: '#1e293b',
    },
  },
  modalContent: {
    padding: '20px',
  },
};

export default AdminDashboard; 