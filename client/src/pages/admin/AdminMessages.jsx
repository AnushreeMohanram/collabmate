import React, { useState, useEffect } from 'react';
import API from '../../api/axios';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [currentPage, searchTerm, filterStatus, sortBy]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/admin/message-analytics', {
        params: {
          page: currentPage,
          limit: 10,
          search: searchTerm,
          status: filterStatus,
          sort: sortBy
        }
      });
      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
        setTotalPages(response.data.totalPages);
      } else {
        setError('Invalid response format');
      }
    } catch (err) {
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageAction = async (messageId, action) => {
    try {
      setActionLoading(true);
      if (action === 'flag') {
        await API.put(`/admin/messages/${messageId}/flag`);
      } else if (action === 'delete') {
        await API.delete(`/admin/messages/${messageId}`);
      } else {
        await API.post(`/admin/messages/${messageId}/${action}`);
      }
      fetchMessages();
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
        setShowModal(false);
      }
    } catch (err) {
      setError(`Failed to ${action} message`);
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
    if (type === 'sort') setSortBy(value);
    setCurrentPage(1);
  };

  const openMessageDetails = (message) => {
    setSelectedMessage(message);
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
      <div style={{fontSize: '24px', marginBottom: '20px', color: '#1e293b'}}>Loading messages...</div>
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
        onClick={fetchMessages}
        style={{
          padding: '12px 24px',
          background: '#4a90e2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
          transition: 'background-color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.background = '#357abd'}
        onMouseOut={(e) => e.target.style.background = '#4a90e2'}
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
          }}>Messages Management</h2>
          <p style={{
            margin: '5px 0 0', 
            color: '#64748b',
            fontSize: '13px'
          }}>Monitor and manage all messages</p>
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
            placeholder="Search messages..."
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
            <option value="flagged">Flagged</option>
            <option value="deleted">Deleted</option>
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
            <option value="sender">Sender</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)', 
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
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
                fontWeight: '500'
              }}>Message</th>
              <th style={{
                padding: '10px 16px', 
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px', 
                fontWeight: '500'
              }}>Sender</th>
              <th style={{
                padding: '10px 16px', 
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px', 
                fontWeight: '500'
              }}>Status</th>
              <th style={{
                padding: '10px 16px', 
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px', 
                fontWeight: '500'
              }}>Created</th>
              <th style={{
                padding: '10px 16px', 
                textAlign: 'left',
                color: '#64748b',
                fontSize: '13px', 
                fontWeight: '500'
              }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages && messages.map(message => (
              <tr key={message._id} style={{
                borderBottom: '1px solid #e2e8f0',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
              >
                <td style={{padding: '8px 16px'}}> 
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px' 
                  }}>
                    <div style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      fontSize: '13px' 
                    }}>{message.subject || 'No Subject'}</div>
                    <div style={{
                      fontSize: '11px', 
                      color: '#64748b',
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>{message.content}</div>
                  </div>
                </td>
                <td style={{padding: '8px 16px'}}> 
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
                      fontSize: '12px' 
                    }}>
                      {message.sender?.name ? message.sender.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div>
                      <div style={{
                        fontWeight: '500',
                        color: '#1e293b',
                        fontSize: '13px' 
                      }}>{message.sender?.name || 'Unknown'}</div>
                      <div style={{
                        fontSize: '10px', 
                        color: '#64748b'
                      }}>{message.sender?.email || 'No email'}</div>
                    </div>
                  </div>
                </td>
                <td style={{padding: '8px 16px'}}> 
                  <span style={{
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    backgroundColor: message.status === 'active' ? '#dcfce7' : 
                             message.status === 'flagged' ? '#fef3c7' : '#fee2e2',
                    color: message.status === 'active' ? '#166534' : 
                          message.status === 'flagged' ? '#92400e' : '#991b1b',
                    fontSize: '11px', 
                    fontWeight: '500'
                  }}>
                    {message.status || 'Unknown'}
                  </span>
                </td>
                <td style={{
                  padding: '8px 16px', 
                  color: '#64748b',
                  fontSize: '12px'
                }}>{new Date(message.createdAt).toLocaleString()}</td>
                <td style={{padding: '8px 16px'}}> 
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button
                      onClick={() => openMessageDetails(message)}
                      style={{
                        padding: '6px 12px', 
                        backgroundColor: '#3b82f6', 
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px', 
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#3b82f6'}
                    >
                      View
                    </button>
                    {message.status === 'active' && (
                      <button
                        onClick={() => handleMessageAction(message._id, 'flag')}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 12px', 
                          backgroundColor: '#f97316', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px', 
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          opacity: actionLoading ? '0.7' : '1'
                        }}
                        onMouseOver={(e) => {
                          if (!actionLoading) {
                            e.target.style.backgroundColor = '#ea580c';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!actionLoading) {
                            e.target.style.backgroundColor = '#f97316';
                          }
                        }}
                      >
                        Flag
                      </button>
                    )}
                    {message.status !== 'deleted' && (
                      <button
                        onClick={() => handleMessageAction(message._id, 'delete')}
                        disabled={actionLoading}
                        style={{
                          padding: '6px 12px', 
                          backgroundColor: '#ef4444', 
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          opacity: actionLoading ? '0.7' : '1'
                        }}
                        onMouseOver={(e) => {
                          if (!actionLoading) {
                            e.target.style.backgroundColor = '#dc2626';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!actionLoading) {
                            e.target.style.backgroundColor = '#ef4444';
                          }
                        }}
                      >
                        Delete
                      </button>
                    )}
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
            if (currentPage !== 1) {
              e.target.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== 1) {
              e.target.style.backgroundColor = '#3b82f6';
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
            if (currentPage !== totalPages) {
              e.target.style.backgroundColor = '#2563eb';
            }
          }}
          onMouseOut={(e) => {
            if (currentPage !== totalPages) {
              e.target.style.backgroundColor = '#3b82f6';
            }
          }}
        >
          Next
        </button>
      </div>

      {showModal && selectedMessage && (
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
              }}>Message Details</h3>
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
              <div style={{gridColumn: 'auto'}}> 
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px', 
                  fontSize: '13px' 
                }}>Subject</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '15px', 
                  fontWeight: '500'
                }}>{selectedMessage.subject || 'No Subject'}</div>
              </div>
              <div style={{gridColumn: 'auto'}}> 
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px', 
                  fontSize: '13px' 
                }}>Content</div>
                <div style={{
                  color: '#1e293b',
                  fontSize: '14px', 
                  lineHeight: '1.4', 
                  padding: '10px', 
                  backgroundColor: '#f8fafc',
                  borderRadius: '6px', 
                  whiteSpace: 'pre-wrap'
                }}>{selectedMessage.content}</div>
              </div>
              <div>
                <div style={{
                  fontWeight: '500',
                  color: '#64748b',
                  marginBottom: '5px', 
                  fontSize: '13px' 
                }}>Sender</div>
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
                    {selectedMessage.sender?.name ? selectedMessage.sender.name.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div>
                    <div style={{
                      fontWeight: '500',
                      color: '#1e293b',
                      fontSize: '13px' 
                    }}>{selectedMessage.sender?.name || 'Unknown'}</div>
                    <div style={{
                      fontSize: '11px',
                      color: '#64748b'
                    }}>{selectedMessage.sender?.email || 'No email'}</div>
                  </div>
                </div>
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
                }}>{selectedMessage.status || 'Unknown'}</div>
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
                }}>{new Date(selectedMessage.createdAt).toLocaleString()}</div>
              </div>
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              marginTop: '20px', 
              paddingTop: '15px', 
              borderTop: '1px solid #e2e8f0'
            }}>
              {selectedMessage.status === 'active' && (
                <button
                  onClick={() => handleMessageAction(selectedMessage._id, 'flag')}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 15px', 
                    backgroundColor: '#f97316', 
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '12px', 
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    opacity: actionLoading ? '0.7' : '1'
                  }}
                  onMouseOver={(e) => {
                    if (!actionLoading) {
                      e.target.style.backgroundColor = '#ea580c';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!actionLoading) {
                      e.target.style.backgroundColor = '#f97316';
                    }
                  }}
                >
                  Flag Message
                </button>
              )}
              {selectedMessage.status !== 'deleted' && (
                <button
                  onClick={() => handleMessageAction(selectedMessage._id, 'delete')}
                  disabled={actionLoading}
                  style={{
                    padding: '8px 15px', 
                    backgroundColor: '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px', 
                    cursor: 'pointer',
                    fontSize: '12px', 
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    opacity: actionLoading ? '0.7' : '1'
                  }}
                  onMouseOver={(e) => {
                    if (!actionLoading) {
                      e.target.style.backgroundColor = '#dc2626';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!actionLoading) {
                      e.target.style.backgroundColor = '#ef4444';
                    }
                  }}
                >
                  Delete Message
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 15px', 
                  backgroundColor: '#e2e8f0',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontSize: '12px', 
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#cbd5e1'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#e2e8f0'}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMessages;