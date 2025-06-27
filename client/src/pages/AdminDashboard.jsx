import { useState, useEffect } from 'react';
import API from '../api/axios';
import { Bar, Pie, Line } from 'react-chartjs-2'; // Import chart components
import { // Import Chart.js essentials
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title, // Added Title for chart titles
  Tooltip,
  Legend,
} from 'chart.js';
import Swal from 'sweetalert2';

// Register Chart.js components (important!)
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalCollaborations: 0,
    activeUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // New states for chart-specific data (if your backend provides separate endpoints)
  const [userRegistrationTrend, setUserRegistrationTrend] = useState([]);
  const [projectCreationTrend, setProjectCreationTrend] = useState([]);
  const [userRoleDistribution, setUserRoleDistribution] = useState({});


  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch core dashboard data concurrently
      const [statsRes, usersRes, projectsRes, collabsRes,
             userRegRes, projCreateRes, userRoleRes] = await Promise.all([ // Added new fetches
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/projects'),
        API.get('/admin/collaborations'),
        API.get('/admin/charts/user-registration-trend'), // New endpoint for user trend
        API.get('/admin/charts/project-creation-trend'), // New endpoint for project trend
        API.get('/admin/charts/user-role-distribution') // New endpoint for user roles
      ]);

      setStats(statsRes.data);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : []);
      setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : []);
      setCollaborations(Array.isArray(collabsRes.data) ? collabsRes.data : []);

      // Set data for charts
      setUserRegistrationTrend(Array.isArray(userRegRes.data) ? userRegRes.data : []);
      setProjectCreationTrend(Array.isArray(projCreateRes.data) ? projCreateRes.data : []);
      setUserRoleDistribution(userRoleRes.data || {});


    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to load dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      await API.put(`/admin/users/${userId}/${action}`);
      fetchDashboardData();
      Swal.fire({ icon: 'success', title: 'Success', text: `User ${action} successfully` });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Failed to ${action} user` });
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      await API.put(`/admin/projects/${projectId}/${action}`);
      fetchDashboardData();
      Swal.fire({ icon: 'success', title: 'Success', text: `Project ${action} successfully` });
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: `Failed to ${action} project` });
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProjects = projects.filter(project => 
    project.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Chart Data Preparation (derived from fetched states) ---

  // 1. User Status Pie Chart (using existing 'stats' data)
  const userStatusData = {
    labels: ['Active Users', 'Inactive Users'],
    datasets: [
      {
        data: [stats.activeUsers, stats.totalUsers - stats.activeUsers],
        backgroundColor: ['#10b981', '#ef4444'], // Green for active, Red for inactive
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // 2. Project Status Pie Chart (derived from 'projects' array)
  const projectStatusCounts = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});

  const projectStatusLabels = Object.keys(projectStatusCounts);
  const projectStatusValues = Object.values(projectStatusCounts);

  const projectStatusColors = projectStatusLabels.map(status => {
    if (status === 'active') return '#10b981'; // Green
    if (status === 'archived') return '#f97316'; // Orange
    // Add more statuses if you have them
    return '#64748b'; // Grey for others
  });

  const projectStatusChartData = {
    labels: projectStatusLabels,
    datasets: [
      {
        data: projectStatusValues,
        backgroundColor: projectStatusColors,
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2,
      },
    ],
  };

  // 3. User Registration Trend Line Chart (using 'userRegistrationTrend' state)
  const userRegistrationChartData = {
    labels: userRegistrationTrend.map(item => item.date), // Assuming 'date' property
    datasets: [
      {
        label: 'New Users',
        data: userRegistrationTrend.map(item => item.count), // Assuming 'count' property
        fill: false,
        borderColor: '#4f46e5', // Indigo
        tension: 0.1,
      },
    ],
  };

  // 4. Project Creation Trend Line Chart (using 'projectCreationTrend' state)
  const projectCreationChartData = {
    labels: projectCreationTrend.map(item => item.date), // Assuming 'date' property
    datasets: [
      {
        label: 'New Projects',
        data: projectCreationTrend.map(item => item.count), // Assuming 'count' property
        fill: false,
        borderColor: '#22c55e', // Green
        tension: 0.1,
      },
    ],
  };

  // 5. User Role Distribution Bar/Pie Chart (using 'userRoleDistribution' state)
  const userRoleLabels = Object.keys(userRoleDistribution);
  const userRoleCounts = Object.values(userRoleDistribution);

  const userRoleChartData = {
    labels: userRoleLabels,
    datasets: [
      {
        label: 'Number of Users',
        data: userRoleCounts,
        backgroundColor: [
          '#4f46e5', // Indigo for Admin
          '#0ea5e9', // Sky for Standard
          '#facc15', // Yellow for others (if any)
        ],
        borderColor: '#ffffff',
        borderWidth: 1,
      },
    ],
  };


  return (
    <div style={styles.container}>
      <div style={styles.header}>
          <h1 style={styles.heading}>👑 Admin Dashboard</h1>
      </div>

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('overview')}
          style={activeTab === 'overview' ? styles.activeTab : styles.tab}
        >
          📊 Overview
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
                  </div>
                </div>
                <div style={styles.statCard}>
                  <h3>📁 Total Projects</h3>
                  <p style={styles.statNumber}>{stats.totalProjects}</p>
                </div>
                <div style={styles.statCard}>
                  <h3>🤝 Collaborations</h3>
                  <p style={styles.statNumber}>{stats.totalCollaborations}</p>
                </div>
              </div>

              {/* NEW CHARTS SECTION */}
              <div style={styles.chartsGrid}>
                <div style={styles.chartCard}>
                  <h3>User Status Distribution</h3>
                  <Pie data={userStatusData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'User Activity Breakdown' } } }} />
                </div>
                <div style={styles.chartCard}>
                  <h3>Project Status Distribution</h3>
                  <Pie data={projectStatusChartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Project Lifecycle' } } }} />
                </div>
                <div style={styles.chartCard}>
                  <h3>New User Registrations (Last 30 Days)</h3>
                  <Line data={userRegistrationChartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'User Growth Over Time' } }, scales: { y: { beginAtZero: true } } }} />
                </div>
                <div style={styles.chartCard}>
                  <h3>New Project Creations (Last 30 Days)</h3>
                  <Line data={projectCreationChartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Project Development Trend' } }, scales: { y: { beginAtZero: true } } }} />
                </div>
                 <div style={styles.chartCard}>
                  <h3>User Role Breakdown</h3>
                  <Bar data={userRoleChartData} options={{ responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Roles Across Platform' } }, scales: { y: { beginAtZero: true } } }} />
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
              </div>
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
                  {filteredUsers.map(user => (
                    <tr key={user._id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{user.name}</td>
                      <td style={styles.tableCell}>{user.email}</td>
                      <td style={styles.tableCell}>{user.role}</td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: user.active ? '#10b981' : '#ef4444'
                        }}>
                          {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      <td style={styles.tableCell}>
                            <button
                          onClick={() => handleUserAction(user._id, user.active ? 'deactivate' : 'activate')}
                              style={styles.actionButton}
                            >
                          {user.active ? 'Deactivate' : 'Activate'}
                            </button>
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
              </div>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.tableHeader}>Name</th>
                    <th style={styles.tableHeader}>Owner</th>
                    <th style={styles.tableHeader}>Status</th>
                    <th style={styles.tableHeader}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(project => (
                    <tr key={project._id} style={styles.tableRow}>
                      <td style={styles.tableCell}>{project.name}</td>
                      <td style={styles.tableCell}>{project.owner?.name || 'Unknown'}</td>
                      <td style={styles.tableCell}>
                        <span style={{
                          ...styles.badge,
                          backgroundColor: project.status === 'active' ? '#10b981' : '#ef4444'
                        }}>
                            {project.status}
                          </span>
                        </td>
                      <td style={styles.tableCell}>
                            <button
                          onClick={() => handleProjectAction(project._id, project.status === 'active' ? 'archive' : 'activate')}
                              style={styles.actionButton}
                            >
                          {project.status === 'active' ? 'Archive' : 'Activate'}
                            </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </>
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
    marginBottom: '20px',
  },
  heading: {
    fontSize: '24px',
    color: '#1e293b',
    margin: 0,
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: '#f1f5f9',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#64748b',
  },
  activeTab: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'white',
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
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #4f46e5',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  overview: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px', // Added margin for spacing between stats and charts
  },
  statCard: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '10px 0',
  },
  statDetails: {
    fontSize: '14px',
    color: '#64748b',
  },
  // New styles for charts
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  chartCard: {
    backgroundColor: '#f8fafc',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px', // Ensure charts have enough height
  },
  tableContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  tableHeader: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    textAlign: 'left',
    padding: '12px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
  },
  tableRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  tableCell: {
    padding: '12px',
    fontSize: '14px',
    color: '#1e293b',
  },
  badge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: 'white',
  },
  actionButton: {
    padding: '6px 12px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
  },
};

export default AdminDashboard;