import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
import API from '../../api/axios';
import { toast } from 'react-toastify'; // Assuming you have react-toastify for notifications

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all'); // This will map to 'active' boolean on backend
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const SIDEBAR_WIDTH = '240px';
  const DEBOUNCE_DELAY = 500;

  // Memoized fetchUsers function to avoid unnecessary re-renders and issues with useEffect dependencies
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: filterRole,
        // Ensure 'all' status is not sent to backend, only 'active' or 'inactive'
        status: filterStatus === 'all' ? undefined : filterStatus,
        sort: sortBy
      };
      const response = await API.get('/admin/user-analytics', { params });
      if (response.data && response.data.users) {
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Failed to load users');
      console.error("Error fetching users:", err);
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filterRole, filterStatus, sortBy, searchTerm]); // Add searchTerm to dependencies

  // Main data fetching effect.
  // Re-fetch when filters or pagination change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]); // fetchUsers is now a dependency because it's wrapped in useCallback

  // Debounce effect for search term
  useEffect(() => {
    const handler = setTimeout(() => {
      // If the search term changes, reset to page 1 and fetch
      if (currentPage !== 1 || searchTerm) { // Only fetch if not already on page 1, or if searchTerm has content
        setCurrentPage(1);
        fetchUsers(); // This fetch is triggered by the currentPage change or directly if currentPage is already 1
      }
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, fetchUsers]); // Add fetchUsers as a dependency for debounce effect


  // --- UPDATED: Function to handle user status changes (activate/deactivate) ---
  const handleUserStatusChange = async (userId, currentIsActive) => { // Renamed action to currentIsActive for clarity
    try {
      setActionLoading(true);
      const action = currentIsActive ? 'deactivate' : 'activate'; // Determine backend action
      const user = users.find(u => u._id === userId);

      if (!user) {
        toast.error("User not found for status change.");
        return;
      }

      // Prevent deactivating the last active admin
      if (action === 'deactivate' && user.role === 'admin') {
        // Filter `users` state directly to count active admins
        const activeAdminCount = users.filter(u => u.role === 'admin' && u.active === true).length;
        if (activeAdminCount <= 1) {
          toast.error('Cannot deactivate the last active admin user. This would lock the system!');
          setActionLoading(false);
          return;
        }
      }

      const response = await API.post(`/admin/users/${userId}/${action}`);
      toast.success(response.data.message);

      // --- IMPORTANT: OPTIMISTIC UI UPDATE ---
      setUsers(prevUsers =>
        prevUsers.map(u =>
          u._id === userId ? { ...u, active: !currentIsActive } : u // Toggle the 'active' status
        )
      );

      // Update the selectedUser state if the modal is open
      if (selectedUser?._id === userId) {
        setSelectedUser(prev => ({ ...prev, active: !currentIsActive })); // Update 'active' field
      }

      // Re-fetch after a slight delay or if the filter is set to 'all'
      // This helps with data consistency across pagination/filtering
      // Alternatively, if you want *immediate* re-filtering on de/activation,
      // you could call fetchUsers() directly here, but the optimistic update is faster.
      // fetchUsers(); // This will trigger a full re-fetch after update.

    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to ${currentIsActive ? 'deactivate' : 'activate'} user.`;
      setError(errorMessage); // Set error for overall display
      toast.error(errorMessage); // Show specific error to user
      console.error(`Status change error (${currentIsActive ? 'deactivate' : 'activate'}):`, err);
    } finally {
      setActionLoading(false);
    }
  };
  // --- END UPDATED FUNCTION ---

  const handleDeleteUser = async (userId) => {
    try {
      setActionLoading(true);
      const userToDeleteConfirmed = users.find(u => u._id === userId);

      // Prevent deleting the last active admin (similar check as deactivation)
      if (userToDeleteConfirmed && userToDeleteConfirmed.role === 'admin') {
        const activeAdminCount = users.filter(u => u.role === 'admin' && u.active === true).length;
        if (activeAdminCount <= 1) {
            toast.error('Cannot delete the last active admin user. This would lock the system!');
            setActionLoading(false);
            return;
        }
      }

      await API.delete(`/admin/users/${userId}`);
      toast.success(`User deleted successfully.`);
      // Optimistic removal from UI, then re-fetch for consistency
      setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
      // Re-evaluate total pages if necessary (simple re-fetch handles this)
      fetchUsers();

      if (selectedUser?._id === userId) {
        setSelectedUser(null);
        setShowModal(false);
      }
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to delete user.`;
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Delete user error:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    // Debounce handles page reset to 1
  };

  const handleFilterChange = (type, value) => {
    if (type === 'role') setFilterRole(value);
    if (type === 'status') setFilterStatus(value);
    if (type === 'sort') setSortBy(value);
    setCurrentPage(1); // Reset page on filter change
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setUserToDelete(null);
    setShowDeleteConfirm(false);
  };

  const mainContainerStyle = {
    padding: '32px',
    marginLeft: `calc(${SIDEBAR_WIDTH} + 24px)`,
    marginRight: '24px',
    marginTop: '24px',
    marginBottom: '24px',
    width: `calc(100% - ${SIDEBAR_WIDTH} - 48px)`,
    background: '#ffffff',
    minHeight: 'calc(100vh - 48px)',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
    boxSizing: 'border-box',
    minWidth: 'calc(768px - 48px)'
  };

  if (loading && users.length === 0) return ( // Only show full loading screen if no users are loaded yet
    <div style={{
      ...mainContainerStyle,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      padding: '60px 24px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '16px', color: '#1e293b', fontWeight: 'bold' }}>Loading Users...</div>
      <div style={{ fontSize: '18px', color: '#64748b' }}>Fetching the latest user data for you.</div>
    </div>
  );

  if (error) return (
    <div style={{
      ...mainContainerStyle,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      padding: '60px 24px',
    }}>
      <div style={{ fontSize: '32px', marginBottom: '16px', color: '#dc2626', fontWeight: 'bold' }}>Oops! Something went wrong.</div>
      <div style={{ fontSize: '18px', color: '#b91c1c', marginBottom: '32px' }}>{error}. Please try again.</div>
      <button
        onClick={fetchUsers}
        style={{
          padding: '14px 28px',
          background: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '600',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
        }}
        onMouseOver={(e) => e.target.style.background = '#2563eb'}
        onMouseOut={(e) => e.target.style.background = '#3b82f6'}
      >
        Retry Loading Users
      </button>
    </div>
  );

  return (
    <div style={mainContainerStyle}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '40px',
        gap: '20px'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '36px',
            color: '#1a202c',
            fontWeight: '700'
          }}>User Management Dashboard</h2>
          <p style={{
            margin: '10px 0 0',
            color: '#718096',
            fontSize: '16px'
          }}>Efficiently manage and monitor all user accounts within the system.</p>
        </div>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          width: '100%',
          alignItems: 'center',
          boxSizing: 'border-box'
        }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              minWidth: '200px',
              flexGrow: 1,
              fontSize: '15px',
              outline: 'none',
              transition: 'all 0.3s ease',
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          />
          <select
            value={filterRole}
            onChange={(e) => handleFilterChange('role', e.target.value)}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: 'white',
              flexShrink: 0
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {/* Corrected Status Filter Buttons (includes 'active' and 'inactive') */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '4px',
            background: '#e2e8f0',
            borderRadius: '10px',
            flexShrink: 0
          }}>
            {['all', 'active', 'inactive'].map(status => (
              <button
                key={status}
                onClick={() => handleFilterChange('status', status)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  backgroundColor: filterStatus === status ? '#3b82f6' : 'transparent',
                  color: filterStatus === status ? 'white' : '#4a5568',
                  boxShadow: filterStatus === status ? '0 2px 5px rgba(59, 130, 246, 0.2)' : 'none',
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            style={{
              padding: '12px 18px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              fontSize: '15px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: 'white',
              flexShrink: 0
            }}
            onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.2)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
            <option value="email">Email (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        overflowX: 'auto',
        border: '1px solid #e2e8f0'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: '#f1f5f9',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <th style={{
                padding: '18px 24px',
                textAlign: 'left',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                minWidth: '150px'
              }}>Name</th>
              <th style={{
                padding: '18px 24px',
                textAlign: 'left',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                minWidth: '200px'
              }}>Email</th>
              <th style={{
                padding: '18px 24px',
                textAlign: 'left',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                minWidth: '100px'
              }}>Role</th>
              <th style={{
                padding: '18px 24px',
                textAlign: 'left',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                minWidth: '100px'
              }}>Status</th>
              <th style={{
                padding: '18px 24px',
                textAlign: 'left',
                color: '#4a5568',
                fontSize: '15px',
                fontWeight: '600',
                minWidth: '120px'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.map(user => (
              <tr key={user._id} style={{
                borderBottom: '1px solid #edf2f7',
                transition: 'background-color 0.3s ease'
              }}
                onMouseOver={(e) => e.currentTarget.style.background = '#fcfcfc'}
                onMouseOut={(e) => e.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '20px 24px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#e0e7ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#4338ca',
                      fontWeight: '700',
                      fontSize: '20px'
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#1a202c',
                        fontSize: '16px'
                      }}>{user.name}</div>
                      <div style={{
                        fontSize: '13px',
                        color: '#718096'
                      }}>ID: {user._id}</div>
                    </div>
                  </div>
                </td>
                <td style={{
                  padding: '16px 24px',
                  color: '#4a5568',
                  fontSize: '15px'
                }}>{user.email}</td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: user.role === 'admin' ? '#e0e7ff' : '#f0f4f8',
                    color: user.role === 'admin' ? '#4338ca' : '#4a5568',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {/* --- UPDATED: Use user.active for status display --- */}
                  <span style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: user.active ? '#d1fae5' : '#ffe4e6', // Green for active, Red for inactive
                    color: user.active ? '#065f46' : '#9f1239',
                    fontSize: '13px',
                    fontWeight: '600'
                  }}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => openUserDetails(user)}
                      style={{
                        padding: '8px 16px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#2563eb'}
                      onMouseOut={(e) => e.target.style.background = '#3b82f6'}
                    >
                      View Details
                    </button>

                    {/* --- UPDATED: Status Toggle Button in Table --- */}
                    {user.active ? ( // Check user.active, not user.status
                      <button
                        onClick={() => handleUserStatusChange(user._id, user.active)} // Pass user.active
                        disabled={actionLoading}
                        style={{
                          padding: '8px 16px',
                          background: '#f97316', // Orange for deactivate
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          opacity: actionLoading ? '0.7' : '1',
                          boxShadow: `0 2px 4px rgba(249, 115, 22, 0.2)`
                        }}
                        onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#ea580c'; } }}
                        onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#f97316'; } }}
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUserStatusChange(user._id, user.active)} // Pass user.active
                        disabled={actionLoading}
                        style={{
                          padding: '8px 16px',
                          background: '#22c55e', // Green for activate
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: actionLoading ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: '500',
                          transition: 'all 0.3s ease',
                          opacity: actionLoading ? '0.7' : '1',
                          boxShadow: `0 2px 4px rgba(34, 197, 94, 0.2)`
                        }}
                        onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#16a34a'; } }}
                        onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#22c55e'; } }}
                      >
                        Activate
                      </button>
                    )}
                    {/* --- END UPDATED --- */}

                    <button
                      onClick={() => confirmDelete(user)}
                      disabled={actionLoading}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        opacity: actionLoading ? '0.7' : '1',
                        boxShadow: `0 2px 4px rgba(239, 68, 68, 0.2)`
                      }}
                      onMouseOver={(e) => {
                        if (!actionLoading) {
                          e.target.style.background = '#dc2626';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!actionLoading) {
                          e.target.style.background = '#ef4444';
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#718096', fontSize: '16px' }}>
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div style={{
        marginTop: '32px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '20px',
        padding: '18px 24px',
        background: '#f8fafc',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
      }}>
        <button
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1 || actionLoading}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: (currentPage === 1 || actionLoading) ? 'not-allowed' : 'pointer',
            opacity: (currentPage === 1 || actionLoading) ? '0.6' : '1',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
          }}
          onMouseOver={(e) => {
            if (!(currentPage === 1 || actionLoading)) {
              e.target.style.background = '#2563eb';
            }
          }}
          onMouseOut={(e) => {
            if (!(currentPage === 1 || actionLoading)) {
              e.target.style.background = '#3b82f6';
            }
          }}
        >
          Previous Page
        </button>
        <span style={{
          padding: '10px 20px',
          color: '#4a5568',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Page <span style={{ fontWeight: '700' }}>{currentPage}</span> of <span style={{ fontWeight: '700' }}>{totalPages}</span>
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || actionLoading}
          style={{
            padding: '10px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: (currentPage === totalPages || actionLoading) ? 'not-allowed' : 'pointer',
            opacity: (currentPage === totalPages || actionLoading) ? '0.6' : '1',
            fontSize: '15px',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
          }}
          onMouseOver={(e) => {
            if (!(currentPage === totalPages || actionLoading)) {
              e.target.style.background = '#2563eb';
            }
          }}
          onMouseOut={(e) => {
            if (!(currentPage === totalPages || actionLoading)) {
              e.target.style.background = '#3b82f6';
            }
          }}
        >
          Next Page
        </button>
      </div>

      {/* User Details Modal */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            width: '90%',
            
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
            animation: 'fadeInScale 0.3s ease-out forwards'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '30px',
              paddingBottom: '20px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '28px',
                color: '#1a202c',
                fontWeight: '700'
              }}>User Profile</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '32px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '8px',
                  transition: 'color 0.2s',
                  lineHeight: 1
                }}
                onMouseOver={(e) => e.target.style.color = '#4a5568'}
                onMouseOut={(e) => e.target.style.color = '#9ca3af'}
              >
                &times;
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '24px'
            }}>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>Full Name</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>{selectedUser.name}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>Email Address</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>{selectedUser.email}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>User Role</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>{selectedUser.role}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>Account Status</div>
                {/* --- UPDATED: Use selectedUser.active for status display in modal --- */}
                <div style={{
                  color: selectedUser.active ? '#166534' : '#991b1b', // Green for active, Red for inactive
                  fontSize: '18px',
                  fontWeight: '600'
                }}>{selectedUser.active ? 'Active' : 'Inactive'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>Account Created</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '600',
                  color: '#64748b',
                  marginBottom: '10px',
                  fontSize: '15px'
                }}>Last Login</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '500'
                }}>{selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'flex-end',
              marginTop: '40px',
              paddingTop: '28px',
              borderTop: '1px solid #e2e8f0'
            }}>
              {/* --- UPDATED: Status Toggle Button in Modal --- */}
              {selectedUser.active ? ( // Check selectedUser.active
                <button
                  onClick={() => handleUserStatusChange(selectedUser._id, selectedUser.active)} // Pass selectedUser.active
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    background: '#f97316',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 10px rgba(249, 115, 22, 0.3)`
                  }}
                  onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#ea580c'; } }}
                  onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#f97316'; } }}
                >
                  Deactivate User
                </button>
              ) : (
                <button
                  onClick={() => handleUserStatusChange(selectedUser._id, selectedUser.active)} // Pass selectedUser.active
                  disabled={actionLoading}
                  style={{
                    padding: '12px 24px',
                    background: '#22c55e',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: `0 4px 10px rgba(34, 197, 94, 0.3)`
                  }}
                  onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#16a34a'; } }}
                  onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#22c55e'; } }}
                >
                  Activate User
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                disabled={actionLoading}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(107, 114, 128, 0.3)'
                }}
                onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#4b5563'; } }}
                onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#6b7280'; } }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && userToDelete && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 15px 30px rgba(0,0,0,0.15)',
            animation: 'fadeInScale 0.3s ease-out forwards'
          }}>
            <h3 style={{
              margin: '0 0 20px',
              fontSize: '24px',
              color: '#dc2626',
              fontWeight: '700'
            }}>Confirm Deletion</h3>
            <p style={{
              fontSize: '16px',
              color: '#4a5568',
              marginBottom: '30px'
            }}>
              Are you sure you want to permanently delete user <span style={{ fontWeight: '600' }}>{userToDelete.name}</span> ({userToDelete.email})? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px' }}>
              <button
                onClick={cancelDelete}
                disabled={actionLoading}
                style={{
                  padding: '12px 24px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(107, 114, 128, 0.3)'
                }}
                onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#4b5563'; } }}
                onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#6b7280'; } }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(userToDelete._id)}
                disabled={actionLoading}
                style={{
                  padding: '12px 24px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => { if (!actionLoading) { e.target.style.background = '#dc2626'; } }}
                onMouseOut={(e) => { if (!actionLoading) { e.target.style.background = '#ef4444'; } }}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
      {/* CSS for modal animation */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUsers;