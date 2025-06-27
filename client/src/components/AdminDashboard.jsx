import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import Swal from 'sweetalert2';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalProjects: 0,
    totalMessages: 0,
    totalSuggestions: 0,
    recentActivity: [],
    newUsersThisWeek: 0,
    activeProjects: 0,
    userStats: {
      activePercentage: 0,
      newUsersPercentage: 0
    },
    projectStats: {
      activePercentage: 0
    }
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [dateRange, setDateRange] = useState('7');
  const [sortBy, setSortBy] = useState('newest');
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [userActivity, setUserActivity] = useState(null);
  const [collaborations, setCollaborations] = useState([]);
  const [loadingCollaborations, setLoadingCollaborations] = useState(false);
  const [collaborationsError, setCollaborationsError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      console.log('Request config:', config);

      const [statsRes, usersRes, projectsRes] = await Promise.all([
        API.get(`/admin/stats?range=${dateRange}`, config),
        API.get(`/admin/users?page=${currentPage}&limit=10&search=${searchTerm}&status=${filterStatus}&sort=${sortBy}`, config),
        API.get(`/admin/projects?page=${currentPage}&limit=10&search=${searchTerm}&status=${filterStatus}&sort=${sortBy}`, config)
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setTotalPages(usersRes.data.totalPages);
      setProjects(projectsRes.data.projects);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborations = async () => {
    try {
      setLoadingCollaborations(true);
      setCollaborationsError(null);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const res = await API.get('/admin/collaborations', config);
      setCollaborations(res.data);
    } catch (err) {
      console.error('Failed to fetch collaborations:', err);
      setCollaborationsError('Failed to load collaborations');
    } finally {
      setLoadingCollaborations(false);
    }
  };

  const fetchUserActivity = async (userId) => {
    try {
      const res = await API.get(`/admin/users/${userId}/activity`);
      setUserActivity(res.data);
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
      setError('Failed to load user activity');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange, currentPage, searchTerm, filterStatus, sortBy]);

  useEffect(() => {
    fetchCollaborations();
  }, []);

  const handleUserAction = async (userId, action) => {
    try {
      const res = await API.post(`/admin/users/${userId}/${action}`);
      setUsers(users.map(user => 
        user._id === userId ? { ...user, active: action === 'activate' } : user
      ));
      Swal.fire({ icon: 'success', title: 'Success', text: res.data.message });
    } catch (err) {
      console.error(`Failed to ${action} user:`, err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || `Failed to ${action} user` });
    }
  };

  const handleProjectAction = async (projectId) => {
    try {
      const res = await API.post(`/admin/projects/${projectId}/archive`);
      setProjects(projects.map(project => 
        project._id === projectId ? { ...project, status: 'archived' } : project
      ));
      Swal.fire({ icon: 'success', title: 'Success', text: res.data.message });
    } catch (err) {
      console.error('Failed to archive project:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.error || 'Failed to archive project' });
    }
  };

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    await fetchUserActivity(user._id);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <p style={styles.errorText}>{error}</p>
        <button 
          onClick={() => {
            setError(null);
            fetchDashboardData();
          }}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>Admin Dashboard</h2>
        <div style={styles.headerControls}>
          <select 
            value={dateRange} 
            onChange={(e) => handleDateRangeChange(e.target.value)}
            style={styles.select}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
          <button 
            onClick={handleRefresh}
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.activeTab : styles.tab}
        >
          Overview
        </button>
        <button 
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? styles.activeTab : styles.tab}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('projects')}
          style={activeTab === 'projects' ? styles.activeTab : styles.tab}
        >
          Projects
        </button>
        <button
          onClick={() => setActiveTab('collaborations')}
          style={activeTab === 'collaborations' ? styles.activeTab : styles.tab}
        >
          Collaborations
        </button>
      </div>

      {activeTab === 'overview' && (
        <div style={styles.overviewContainer}>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>Total Users</h3>
              <p style={styles.statValue}>{stats.totalUsers}</p>
              <div style={styles.statProgress}>
                <div 
                  style={{
                    ...styles.statProgressBar,
                    width: `${stats.userStats.activePercentage}%`,
                    backgroundColor: '#4f46e5'
                  }}
                />
              </div>
              <p style={styles.statSubtext}>
                {stats.activeUsers} active ({stats.userStats.activePercentage}%)
              </p>
            </div>

            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>New Users</h3>
              <p style={styles.statValue}>{stats.newUsersThisWeek}</p>
              <div style={styles.statProgress}>
                <div 
                  style={{
                    ...styles.statProgressBar,
                    width: `${stats.userStats.newUsersPercentage}%`,
                    backgroundColor: '#10b981'
                  }}
                />
              </div>
              <p style={styles.statSubtext}>
                This week ({stats.userStats.newUsersPercentage}% of total)
              </p>
            </div>

            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>Total Projects</h3>
              <p style={styles.statValue}>{stats.totalProjects}</p>
              <div style={styles.statProgress}>
                <div 
                  style={{
                    ...styles.statProgressBar,
                    width: `${stats.projectStats.activePercentage}%`,
                    backgroundColor: '#f59e0b'
                  }}
                />
              </div>
              <p style={styles.statSubtext}>
                {stats.activeProjects} active ({stats.projectStats.activePercentage}%)
              </p>
            </div>

            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>Messages</h3>
              <p style={styles.statValue}>{stats.totalMessages}</p>
              <p style={styles.statSubtext}>Total messages sent</p>
            </div>

            <div style={styles.statCard}>
              <h3 style={styles.statTitle}>AI Suggestions</h3>
              <p style={styles.statValue}>{stats.totalSuggestions}</p>
              <p style={styles.statSubtext}>Total AI-generated suggestions</p>
            </div>
          </div>

          <div style={styles.recentActivity}>
            <h3 style={styles.sectionTitle}>Recent Activity</h3>
            <div style={styles.activityList}>
              {stats.recentActivity.map((activity, index) => (
                <div key={index} style={styles.activityItem}>
                  <div style={styles.activityIcon}>💬</div>
                  <div style={styles.activityContent}>
                    <p style={styles.activityText}>{activity.description}</p>
                    <p style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div style={styles.usersContainer}>
          <div style={styles.controls}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>

            <div style={styles.filterControls}>
              <select 
                value={filterStatus} 
                onChange={(e) => handleFilterChange(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                style={styles.select}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Name</th>
                  <th style={styles.tableHeader}>Email</th>
                  <th style={styles.tableHeader}>Role</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div style={styles.userCell}>
                        <div style={styles.avatar}>
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td style={styles.tableCell}>{user.email}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: user.role === 'admin' ? '#4f46e5' : '#64748b'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{
                        ...styles.badge,
                        backgroundColor: user.active ? '#10b981' : '#ef4444'
                      }}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => handleUserSelect(user)}
                          style={styles.actionButton}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleUserAction(user._id, user.active ? 'deactivate' : 'activate')}
                          style={{
                            ...styles.actionButton,
                            backgroundColor: user.active ? '#ef4444' : '#10b981'
                          }}
                        >
                          {user.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={styles.pagination}>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={styles.pageButton}
            >
              Previous
            </button>
            <span style={styles.pageInfo}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={styles.pageButton}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={styles.projectsContainer}>
          <div style={styles.controls}>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={handleSearch}
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>

            <div style={styles.filterControls}>
              <select 
                value={filterStatus} 
                onChange={(e) => handleFilterChange(e.target.value)}
                style={styles.select}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>

              <select 
                value={sortBy} 
                onChange={(e) => handleSortChange(e.target.value)}
                style={styles.select}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Project</th>
                  <th style={styles.tableHeader}>Collaborator</th>
                  <th style={styles.tableHeader}>Role</th>
                  <th style={styles.tableHeader}>Status</th>
                  <th style={styles.tableHeader}>Message</th>
                  <th style={styles.tableHeader}>Requested At</th>
                </tr>
              </thead>
              <tbody>
                {collaborations.map(collab => (
                  <tr key={collab.id} style={styles.tableRow}>
                    <td style={styles.tableCell}>{collab.projectName}</td>
                    <td style={styles.tableCell}>
                      {collab.receiverName} ({collab.receiverEmail})
                    </td>
                    <td style={styles.tableCell}>{collab.role}</td>
                    <td style={styles.tableCell}>{collab.status}</td>
                    <td style={styles.tableCell}>{collab.message || '-'}</td>
                    <td style={styles.tableCell}>{new Date(collab.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {loadingCollaborations && <p>Loading collaborations...</p>}
            {collaborationsError && <p style={{color: 'red'}}>{collaborationsError}</p>}
          </div>
        </div>
      )}

      {selectedUser && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>User Details</h3>
              <button 
                onClick={() => setSelectedUser(null)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.userDetails}>
                <div style={styles.avatarLarge}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h4 style={styles.userName}>{selectedUser.name}</h4>
                <p style={styles.userEmail}>{selectedUser.email}</p>
                <div style={styles.userStats}>
                  <div style={styles.userStat}>
                    <span style={styles.statLabel}>Role</span>
                    <span style={styles.statValue}>{selectedUser.role}</span>
                  </div>
                  <div style={styles.userStat}>
                    <span style={styles.statLabel}>Status</span>
                    <span style={styles.statValue}>
                      {selectedUser.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              {userActivity && (
                <div style={styles.activitySection}>
                  <h4 style={styles.sectionTitle}>Recent Activity</h4>
                  <div style={styles.activityList}>
                    {userActivity.messages.map((msg, index) => (
                      <div key={index} style={styles.activityItem}>
                        <div style={styles.activityIcon}>💬</div>
                        <div style={styles.activityContent}>
                          <p style={styles.activityText}>
                            Sent a message in {msg.project?.title || 'a project'}
                          </p>
                          <p style={styles.activityTime}>
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 style={styles.sectionTitle}>Projects</h4>
                  <div style={styles.projectList}>
                    {userActivity.projects.map((project, index) => (
                      <div key={index} style={styles.projectItem}>
                        <div style={styles.projectIcon}>📁</div>
                        <div style={styles.projectContent}>
                          <p style={styles.projectTitle}>{project.title}</p>
                          <p style={styles.projectStatus}>{project.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedProject && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Project Details</h3>
              <button 
                onClick={() => setSelectedProject(null)}
                style={styles.closeButton}
              >
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.projectDetails}>
                <h4 style={styles.projectTitle}>{selectedProject.title}</h4>
                <p style={styles.projectDescription}>{selectedProject.description}</p>
                <div style={styles.projectStats}>
                  <div style={styles.projectStat}>
                    <span style={styles.statLabel}>Status</span>
                    <span style={styles.statValue}>{selectedProject.status}</span>
                  </div>
                  <div style={styles.projectStat}>
                    <span style={styles.statLabel}>Created</span>
                    <span style={styles.statValue}>
                      {new Date(selectedProject.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={styles.collaboratorsSection}>
                <h4 style={styles.sectionTitle}>Collaborators</h4>
                <div style={styles.collaboratorsList}>
                  {selectedProject.collaborators.map(collab => (
                    <div key={collab._id} style={styles.collaboratorItem}>
                      <div style={styles.avatar}>
                        {collab.name.charAt(0).toUpperCase()}
                      </div>
                      <div style={styles.collaboratorInfo}>
                        <p style={styles.collaboratorName}>{collab.name}</p>
                        <p style={styles.collaboratorEmail}>{collab.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
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
    position: 'relative',
    minWidth: 0,
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
  headerControls: {
    display: 'flex',
    gap: '15px',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    '&:focus': {
      borderColor: '#4f46e5',
    },
  },
  refreshButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
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
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e2e8f0',
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
  overviewContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
    width: '100%',
    boxSizing: 'border-box',
    padding: '0 0 30px 0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
    width: '100%',
    boxSizing: 'border-box',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    minWidth: '220px',
    minHeight: '140px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    boxSizing: 'border-box',
  },
  statTitle: {
    fontSize: '16px',
    color: '#64748b',
    margin: '0 0 10px 0',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  statProgress: {
    height: '4px',
    backgroundColor: '#e2e8f0',
    borderRadius: '2px',
    marginBottom: '8px',
  },
  statProgressBar: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  statSubtext: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  recentActivity: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginTop: '16px',
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1e293b',
    margin: '0 0 15px 0',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  activityItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  activityIcon: {
    fontSize: '20px',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    margin: '0 0 5px 0',
    color: '#1e293b',
  },
  activityTime: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  usersContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
  },
  searchInput: {
    width: '100%',
    padding: '10px 35px 10px 15px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    '&:focus': {
      outline: 'none',
      borderColor: '#4f46e5',
    },
  },
  searchIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
  },
  filterControls: {
    display: 'flex',
    gap: '10px',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    padding: '15px',
    textAlign: 'left',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
    '&:last-child': {
      borderBottom: 'none',
    },
  },
  tableCell: {
    padding: '15px',
    fontSize: '14px',
    color: '#1e293b',
  },
  userCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '15px',
    marginTop: '20px',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#e2e8f0',
    },
    '&:disabled': {
      backgroundColor: '#f1f5f9',
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  pageInfo: {
    fontSize: '14px',
    color: '#64748b',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '600px',
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
  modalTitle: {
    fontSize: '20px',
    color: '#1e293b',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: 0,
    '&:hover': {
      color: '#1e293b',
    },
  },
  modalBody: {
    padding: '20px',
  },
  userDetails: {
    textAlign: 'center',
    marginBottom: '30px',
  },
  avatarLarge: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 auto 15px',
  },
  userName: {
    fontSize: '24px',
    color: '#1e293b',
    margin: '0 0 5px 0',
  },
  userEmail: {
    fontSize: '14px',
    color: '#64748b',
    margin: '0 0 15px 0',
  },
  userStats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
  },
  userStat: {
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '5px',
  },
  activitySection: {
    marginTop: '30px',
  },
  projectList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  projectItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  projectIcon: {
    fontSize: '20px',
  },
  projectContent: {
    flex: 1,
  },
  projectTitle: {
    margin: '0 0 5px 0',
    color: '#1e293b',
  },
  projectStatus: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  projectDetails: {
    marginBottom: '30px',
  },
  projectDescription: {
    fontSize: '14px',
    color: '#64748b',
    margin: '10px 0',
  },
  projectStats: {
    display: 'flex',
    gap: '30px',
  },
  projectStat: {
    textAlign: 'center',
  },
  collaboratorsSection: {
    marginTop: '30px',
  },
  collaboratorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  collaboratorItem: {
    display: 'flex',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  collaboratorInfo: {
    flex: 1,
  },
  collaboratorName: {
    margin: '0 0 5px 0',
    color: '#1e293b',
  },
  collaboratorEmail: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    marginLeft: '240px',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f1f5f9',
    borderTop: '3px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '15px',
    color: '#64748b',
    fontSize: '14px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    marginLeft: '240px',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '16px',
    marginBottom: '15px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
};

export default AdminDashboard;
