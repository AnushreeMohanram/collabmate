import React, { useState, useEffect } from 'react';
import API from '../../api/axios'; // Ensure your axios instance is correctly imported

const AdminProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [currentPage, searchTerm, filterStatus, filterCategory, sortBy]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/admin/project-analytics', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus,
          category: filterCategory,
          sort: sortBy
        }
      });
      if (response.data && response.data.projects) {
        setProjects(response.data.projects);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Failed to load projects');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectAction = async (projectId, action) => {
    try {
      setActionLoading(true);
      let response;
      if (action === 'delete') {
        // Use DELETE for deleting the project as per RESTful design
        response = await API.delete(`/admin/projects/${projectId}`);
      } else {
        setError(`Invalid project action: ${action}`);
        setActionLoading(false);
        return;
      }

      // Optional: Display a success message based on server response
      // For example, using a toast notification library instead of alert:
      // toast.success(response.data.message);
      console.log(response.data.message);


      fetchProjects(); // Re-fetch projects to update the UI
      if (selectedProject?._id === projectId) {
        setSelectedProject(null);
        setShowModal(false);
      }
    } catch (err) {
      // Improved error handling to show server-provided messages
      const errorMessage = err.response?.data?.error || err.response?.data?.message || `Failed to ${action} project. Please try again.`;
      setError(errorMessage);
      console.error(`Failed to ${action} project:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (type, value) => {
    if (type === 'status') setFilterStatus(value);
    if (type === 'category') setFilterCategory(value);
    if (type === 'sort') setSortBy(value);
    setCurrentPage(1);
  };

  const openProjectDetails = (project) => {
    setSelectedProject(project);
    setShowModal(true);
  };

  if (loading) return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '250px',
      flexGrow: 1,
      backgroundColor: '#f8fafc'
    }}>
      <div style={{fontSize: '24px', marginBottom: '20px', color: '#1e293b'}}>Loading projects...</div>
      <div style={{color: '#64748b'}}>Please wait while we fetch the data</div>
    </div>
  );

  if (error) return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: '250px',
      flexGrow: 1,
      backgroundColor: '#f8fafc'
    }}>
      <div style={{fontSize: '24px', marginBottom: '20px', color: '#ef4444'}}>Error</div>
      <div style={{color: '#991b1b', marginBottom: '20px'}}>{error}</div>
      <button
        onClick={fetchProjects}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#357abd'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#4a90e2'}
      >
        Retry
      </button>
    </div>
  );

  return (
    <div style={{
      padding: '20px',
      marginLeft: '250px',
      marginRight: '20px',
      flexGrow: 1,
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '10px 0'
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '24px',
            color: '#1e293b',
            fontWeight: '600'
          }}>Projects Management</h2>
          <p style={{
            margin: '5px 0 0',
            color: '#64748b',
            fontSize: '13px'
          }}>Monitor and manage all projects</p>
        </div>
        <div style={{
          display: 'flex',
          gap: '10px',
          backgroundColor: 'white',
          padding: '10px',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              width: '200px',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
          <select
            value={filterStatus}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="completed">Completed</option>
            <option value="inProgress">In Progress</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="all">All Categories</option>
            <option value="development">Development</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="research">Research</option>
            <option value="uncategorized">Uncategorized</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4a90e2'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Title</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <th style={{
                padding: '10px 16px',
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '25%'
              }}>Project</th>
              <th style={{
                padding: '10px 16px',
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '20%'
              }}>Owner</th>
              <th style={{
                padding: '10px 16px',
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '15%'
              }}>Category</th>
              <th style={{
                padding: '10px 16px',
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '15%'
              }}>Status</th>
              <th style={{
                padding: '10px 16px',
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '10%'
              }}>Created</th>
              <th style={{
                padding: '10px 16px',
                textAlign: 'right',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: '500',
                width: '15%'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects && projects.map(project => (
              <tr key={project._id} style={{
                borderBottom: '1px solid #e2e8f0',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <td style={{padding: '8px 16px', verticalAlign: 'top'}}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '3px'
                  }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      fontSize: '13px',
                      wordBreak: 'break-word'
                    }}>{project.name || project.title}</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{project.description}</div>
                  </div>
                </td>
                <td style={{padding: '8px 16px', verticalAlign: 'middle'}}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#64748b',
                      fontWeight: '600',
                      fontSize: '12px',
                      flexShrink: 0
                    }}>
                      {project.owner?.name ? project.owner.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <div style={{
                        fontWeight: '500',
                        color: '#1e293b',
                        fontSize: '13px'
                      }}>{project.owner?.name || 'Unknown'}</div>
                      <div style={{
                        fontSize: '10px',
                        color: '#64748b'
                      }}>{project.owner?.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '8px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e2e8f0',
                    color: '#1e293b',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}>
                    {project.category || 'Uncategorized'}
                  </span>
                </td>
                <td style={{padding: '8px 16px', verticalAlign: 'middle'}}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: project.status === 'active' ? '#d1fae5' :
                             project.status === 'archived' ? '#ffe4e6' :
                             project.status === 'inProgress' ? '#fffbeb' : '#e2e8f0',
                    color: project.status === 'active' ? '#10b981' :
                          project.status === 'archived' ? '#ef4444' :
                          project.status === 'inProgress' ? '#f59e0b' : '#64748b',
                    fontSize: '11px',
                    fontWeight: '500',
                    display: 'inline-block'
                  }}>
                    {project.status === 'inProgress' ? 'In Progress' : project.status || 'Unknown'}
                  </span>
                </td>
                <td style={{
                  padding: '8px 16px',
                  color: '#64748b',
                  fontSize: '12px',
                  verticalAlign: 'middle'
                }}>{new Date(project.createdAt).toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'})}</td>
                <td style={{padding: '8px 16px', textAlign: 'right', verticalAlign: 'middle'}}>
                  <div style={{display: 'flex', gap: '8px', justifyContent: 'flex-end'}}> {/* Increased gap for buttons */}
                    <button
                      onClick={() => openProjectDetails(project)}
                      style={{
                        padding: '6px 12px', // Increased padding
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px', // More rounded
                        cursor: 'pointer',
                        fontSize: '12px', // Slightly larger font
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      View
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <button
          onClick={()=>setCurrentPage(p=>Math.max(p-1,1))}
          disabled={currentPage===1}
          style={{
            padding: '6px 10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentPage===1 ? 'not-allowed' : 'pointer',
            opacity: currentPage===1 ? '0.5' : '1',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!actionLoading) { // Added actionLoading check here too
              if (currentPage !== 1) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }
          }}
          onMouseOut={(e) => {
            if (!actionLoading) { // Added actionLoading check here too
              if (currentPage !== 1) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }
          }}
        >
          Previous
        </button>
        <span style={{
          padding: '6px 10px',
          color: '#64748b',
          fontSize: '12px'
        }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={()=>setCurrentPage(p=>Math.min(p+1,totalPages))}
          disabled={currentPage===totalPages}
          style={{
            padding: '6px 10px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: currentPage===totalPages ? 'not-allowed' : 'pointer',
            opacity: currentPage===totalPages ? '0.5' : '1',
            fontSize: '12px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => {
            if (!actionLoading) { // Added actionLoading check here too
              if (currentPage !== totalPages) {
                e.target.style.backgroundColor = '#2563eb';
              }
            }
          }}
          onMouseOut={(e) => {
            if (!actionLoading) { // Added actionLoading check here too
              if (currentPage !== totalPages) {
                e.target.style.backgroundColor = '#3b82f6';
              }
            }
          }}
        >
          Next
        </button>
      </div>

      {showModal && selectedProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              paddingBottom: '10px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '18px',
                color: '#1e293b',
                fontWeight: '600'
              }}>Project Details</h3>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '2px',
                  transition: 'color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.color = '#1e293b'}
                onMouseOut={(e) => e.target.style.color = '#64748b'}
              >
                ×
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '15px'
            }}>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Title</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '15px',
                  fontWeight: '500'
                }}>{selectedProject.title}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Description</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '14px',
                  lineHeight: '1.4',
                  padding: '10px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px',
                  whiteSpace: 'pre-wrap'
                }}>{selectedProject.description}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Owner</div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b',
                    fontWeight: '600',
                    fontSize: '12px'
                  }}>
                    {selectedProject.owner?.name ? selectedProject.owner.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      fontSize: '13px'
                    }}>{selectedProject.owner?.name || 'Unknown'}</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b'
                    }}>{selectedProject.owner?.email || 'No email'}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Category</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '14px'
                }}>{selectedProject.category || 'Uncategorized'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Status</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '14px'
                }}>{selectedProject.status === 'inProgress' ? 'In Progress' : selectedProject.status || 'Unknown'}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Created At</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '14px'
                }}>{new Date(selectedProject.createdAt).toLocaleDateString('en-US', {month: 'numeric', day: 'numeric', year: 'numeric'})}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px',
                  fontSize: '13px'
                }}>Collaborators</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  padding: '8px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px'
                }}>
                  {selectedProject.collaborators && selectedProject.collaborators.length > 0 ? (
                    selectedProject.collaborators.map(collaborator => (
                      <div key={collaborator._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 8px',
                        backgroundColor: 'white',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        fontSize: '11px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#64748b',
                          fontWeight: '600',
                          fontSize: '10px'
                        }}>
                          {collaborator.name ? collaborator.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div style={{
                            fontWeight: '500',
                            color: '#1e293b',
                            fontSize: '11px'
                        }}>{collaborator.name || 'Unknown'}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      color: '#64748b',
                      fontSize: '13px'
                    }}>No collaborators</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;