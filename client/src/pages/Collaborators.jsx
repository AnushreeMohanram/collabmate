import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const Collaborators = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [collaborationRequest, setCollaborationRequest] = useState({
    projectId: '',
    role: 'editor',
    message: ''
  });
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'requests'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [usersRes, projectsRes, requestsRes] = await Promise.all([
        API.get('/users'),
        API.get('/projects'),
        API.get('/collaborations/requests')
      ]);

      setUsers(usersRes.data);
      setProjects(projectsRes.data);
      
      // Separate pending and accepted requests
      const requests = requestsRes.data.requests || [];
      setPendingRequests(requests.filter(req => req.status === 'pending'));
      setAcceptedRequests(requests.filter(req => req.status === 'accepted'));

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = (user) => {
    console.log('Opening modal for user:', user);
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCollaborationRequest = async (userId) => {
    try {
      if (!collaborationRequest.projectId) {
        alert('Please select a project');
        return;
      }

      console.log('Sending collaboration request:', {
        projectId: collaborationRequest.projectId,
        receiverId: userId,
        role: collaborationRequest.role,
        message: collaborationRequest.message
      });

      const response = await API.post('/collaborations/request', {
        projectId: collaborationRequest.projectId,
        receiverId: userId,
        role: collaborationRequest.role,
        message: collaborationRequest.message
      });

      console.log('Collaboration request response:', response.data);

      if (response.data.message === 'Collaboration request sent successfully') {
        alert('Collaboration request sent successfully!');
        setShowModal(false);
        setSelectedUser(null);
        setCollaborationRequest({
          projectId: '',
          role: 'editor',
          message: ''
        });
        fetchData(); // Refresh the data
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Failed to send collaboration request:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.error || 'Failed to send collaboration request. Please try again.';
      alert(errorMessage);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      console.log('Accepting request:', requestId);
      const response = await API.put(`/collaborations/accept/${requestId}`);
      console.log('Accept response:', response.data);
      
      if (response.data.message === 'Collaboration request accepted') {
        alert('Collaboration request accepted!');
        fetchData(); // Refresh the data
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Failed to accept request:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.error || 'Failed to accept request. Please try again.';
      alert(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      console.log('Rejecting request:', requestId);
      const response = await API.put(`/collaborations/reject/${requestId}`);
      console.log('Reject response:', response.data);
      
      if (response.data.message === 'Collaboration request rejected') {
        alert('Collaboration request rejected');
        fetchData(); // Refresh the data
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.error || 'Failed to reject request. Please try again.';
      alert(errorMessage);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.skills && u.skills.some(skill => 
      skill.toLowerCase().includes(search.toLowerCase())
    ))
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>🤝 Collaboration Hub</h2>
        <button 
          onClick={fetchData}
          style={styles.refreshButton}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={fetchData}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      <div style={styles.tabs}>
        <button 
          onClick={() => setActiveTab('users')}
          style={activeTab === 'users' ? styles.activeTab : styles.tab}
        >
          Find Collaborators
        </button>
        <button 
          onClick={() => setActiveTab('requests')}
          style={activeTab === 'requests' ? styles.activeTab : styles.tab}
        >
          Collaboration Requests ({pendingRequests.length})
        </button>
      </div>

      {activeTab === 'users' ? (
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Find Collaborators</h3>
          <div style={styles.searchContainer}>
            <input
              placeholder="Search by name, email, or skills..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
            <span style={styles.searchIcon}>🔍</span>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading collaborators...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>👥</span>
              <p style={styles.emptyText}>
                {search ? 'No matching collaborators found.' : 'No collaborators available.'}
              </p>
            </div>
          ) : (
            <div style={styles.grid}>
              {filteredUsers.map((user) => (
                <div 
                  key={user._id} 
                  style={styles.card}
                  onClick={() => handleConnect(user)}
                >
                  <div style={styles.cardHeader}>
                    <h3 style={styles.userName}>{user.name}</h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnect(user);
                      }}
                      style={styles.connectButton}
                    >
                      Invite to Project
                    </button>
                  </div>
                  <p style={styles.userEmail}>{user.email}</p>
                  {user.skills && user.skills.length > 0 && (
                    <div style={styles.skillsContainer}>
                      {user.skills.map((skill, index) => (
                        <span key={index} style={styles.skillTag}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={styles.requestsContainer}>
          {pendingRequests.length === 0 && acceptedRequests.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={styles.emptyText}>No collaboration requests yet.</p>
            </div>
          ) : (
            <>
              {pendingRequests.length > 0 && (
                <div style={styles.requestsSection}>
                  <h3 style={styles.sectionTitle}>Pending Requests</h3>
                  {pendingRequests.map(request => (
                    <div key={request._id} style={styles.requestCard}>
                      <div style={styles.requestHeader}>
                        <h4 style={styles.requestTitle}>
                          {request.sender.name} invited you to collaborate on {request.project.name}
                        </h4>
                        <span style={styles.requestRole}>{request.role}</span>
                      </div>
                      {request.message && (
                        <p style={styles.requestMessage}>{request.message}</p>
                      )}
                      <div style={styles.requestActions}>
                        <button
                          onClick={() => handleAcceptRequest(request._id)}
                          style={styles.acceptButton}
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectRequest(request._id)}
                          style={styles.rejectButton}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {acceptedRequests.length > 0 && (
                <div style={styles.requestsSection}>
                  <h3 style={styles.sectionTitle}>Active Collaborations</h3>
                  {acceptedRequests.map(request => (
                    <div key={request._id} style={styles.requestCard}>
                      <div style={styles.requestHeader}>
                        <h4 style={styles.requestTitle}>
                          Collaborating on {request.project.name} with {request.sender.name}
                        </h4>
                        <span style={styles.requestRole}>{request.role}</span>
                      </div>
                      <div style={styles.collaborationInfo}>
                        <p style={styles.collaborationDate}>
                          Started {new Date(request.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showModal && selectedUser && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <button
              onClick={() => {
                setShowModal(false);
                setSelectedUser(null);
              }}
              style={styles.closeButton}
            >
              ×
            </button>
            <h3 style={styles.modalTitle}>Connect with {selectedUser.name}</h3>
            
            <div style={styles.collaborationForm}>
              <h4 style={styles.modalSubtitle}>Invite to Project</h4>
              <select
                value={collaborationRequest.projectId}
                onChange={(e) => setCollaborationRequest({
                  ...collaborationRequest,
                  projectId: e.target.value
                })}
                style={styles.select}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.title}
                  </option>
                ))}
              </select>
              
              <select
                value={collaborationRequest.role}
                onChange={(e) => setCollaborationRequest({
                  ...collaborationRequest,
                  role: e.target.value
                })}
                style={styles.select}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
              
              <textarea
                placeholder="Message (optional)"
                value={collaborationRequest.message}
                onChange={(e) => setCollaborationRequest({
                  ...collaborationRequest,
                  message: e.target.value
                })}
                style={styles.textarea}
              />
              
              <button
                onClick={() => handleCollaborationRequest(selectedUser._id)}
                style={styles.modalConnectButton}
              >
                Send Collaboration Request
              </button>
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
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
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
      backgroundColor: '#4338ca',
    },
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
  },
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    marginBottom: '30px',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1e293b',
    margin: '0 0 20px 0',
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
  searchContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 40px 12px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#4f46e5',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    },
  },
  searchIcon: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#94a3b8',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '15px',
  },
  emptyText: {
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  userName: {
    fontSize: '18px',
    color: '#1e293b',
    margin: 0,
  },
  userEmail: {
    color: '#64748b',
    margin: '5px 0',
    fontSize: '14px',
  },
  skillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '10px',
  },
  skillTag: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
  },
  connectButton: {
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#64748b',
    '&:hover': {
      color: '#1e293b',
    },
  },
  modalTitle: {
    fontSize: '24px',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  modalSubtitle: {
    fontSize: '16px',
    color: '#1e293b',
    margin: '0 0 10px 0',
  },
  collaborationForm: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
  },
  select: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '14px',
    minHeight: '100px',
    resize: 'vertical',
  },
  modalConnectButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  requestsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  requestsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  requestCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  requestHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
  },
  requestTitle: {
    fontSize: '16px',
    color: '#1e293b',
    margin: 0,
    flex: 1,
  },
  requestRole: {
    backgroundColor: '#e2e8f0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  requestMessage: {
    fontSize: '14px',
    color: '#64748b',
    margin: '10px 0',
  },
  requestActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  acceptButton: {
    padding: '8px 16px',
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
  rejectButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
  collaborationInfo: {
    marginTop: '10px',
  },
  collaborationDate: {
    fontSize: '12px',
    color: '#64748b',
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
};

export default Collaborators;
