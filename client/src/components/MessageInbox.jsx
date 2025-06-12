import React, { useState, useEffect } from 'react';
import API from '../api/axios';
import { format } from 'date-fns';
import MessageThread from './MessageThread';

const MessageInbox = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
    fetchUnreadCount();
  }, [page, filter, searchTerm]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/messages', {
        params: {
          page,
          limit: 20,
          type: filter !== 'all' ? filter : undefined,
          search: searchTerm || undefined
        }
      });
      
      if (page === 1) {
        setMessages(response.data.messages);
      } else {
        setMessages(prev => [...prev, ...response.data.messages]);
      }
      
      setHasMore(response.data.pagination.page < response.data.pagination.pages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await API.get('/messages/unread/count');
      setUnreadCount(response.data.count);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleThreadSelect = (threadId) => {
    setSelectedThread(threadId);
  };

  const handleThreadClose = () => {
    setSelectedThread(null);
    fetchMessages();
    fetchUnreadCount();
  };

  const getMessagePreview = (content) => {
    return content.length > 50 ? content.substring(0, 50) + '...' : content;
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.header}>
          <h2 style={styles.title}>Messages</h2>
          <span style={styles.unreadBadge}>{unreadCount}</span>
        </div>

        <form onSubmit={handleSearch} style={styles.searchForm}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search messages..."
            style={styles.searchInput}
          />
          <button type="submit" style={styles.searchButton}>
            🔍
          </button>
        </form>

        <div style={styles.filters}>
          <button
            onClick={() => handleFilterChange('all')}
            style={filter === 'all' ? styles.activeFilter : styles.filter}
          >
            All
          </button>
          <button
            onClick={() => handleFilterChange('message')}
            style={filter === 'message' ? styles.activeFilter : styles.filter}
          >
            Messages
          </button>
          <button
            onClick={() => handleFilterChange('suggestion')}
            style={filter === 'suggestion' ? styles.activeFilter : styles.filter}
          >
            Suggestions
          </button>
          <button
            onClick={() => handleFilterChange('announcement')}
            style={filter === 'announcement' ? styles.activeFilter : styles.filter}
          >
            Announcements
          </button>
        </div>

        {error && (
          <div style={styles.error}>
            {error}
            <button onClick={fetchMessages} style={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        <div style={styles.messageList}>
          {loading && page === 1 ? (
            <div style={styles.loading}>Loading messages...</div>
          ) : messages.length === 0 ? (
            <div style={styles.emptyState}>
              No messages found
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message._id}
                onClick={() => handleThreadSelect(message.thread || message._id)}
                style={{
                  ...styles.messageItem,
                  ...(message.read ? {} : styles.unreadMessage)
                }}
              >
                <div style={styles.messageHeader}>
                  <span style={styles.sender}>{message.sender.name}</span>
                  <span style={styles.timestamp}>
                    {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <div style={styles.subject}>{message.subject}</div>
                <div style={styles.preview}>
                  {getMessagePreview(message.content)}
                </div>
                {message.attachments?.length > 0 && (
                  <div style={styles.attachmentIndicator}>
                    📎 {message.attachments.length}
                  </div>
                )}
              </div>
            ))
          )}

          {hasMore && (
            <button
              onClick={handleLoadMore}
              style={styles.loadMoreButton}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          )}
        </div>
      </div>

      {selectedThread && (
        <div style={styles.threadContainer}>
          <MessageThread
            threadId={selectedThread}
            onClose={handleThreadClose}
          />
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f8fafc',
  },
  sidebar: {
    width: '400px',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#1e293b',
  },
  unreadBadge: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  searchForm: {
    padding: '16px',
    display: 'flex',
    gap: '8px',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
  },
  searchButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  filters: {
    padding: '0 16px',
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  filter: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  activeFilter: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #4f46e5',
    backgroundColor: '#4f46e5',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    margin: '8px 16px',
    borderRadius: '4px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  retryButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    padding: '4px 8px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 16px',
  },
  loading: {
    textAlign: 'center',
    color: '#64748b',
    padding: '20px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#64748b',
    padding: '40px',
  },
  messageItem: {
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  unreadMessage: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
  },
  sender: {
    color: '#1e293b',
  },
  timestamp: {
    color: '#64748b',
    fontSize: '12px',
  },
  subject: {
    color: '#1e293b',
    marginBottom: '4px',
  },
  preview: {
    color: '#64748b',
    fontSize: '14px',
  },
  attachmentIndicator: {
    marginTop: '4px',
    color: '#64748b',
    fontSize: '12px',
  },
  loadMoreButton: {
    width: '100%',
    padding: '12px',
    margin: '16px 0',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  threadContainer: {
    flex: 1,
    padding: '16px',
  },
};

export default MessageInbox; 