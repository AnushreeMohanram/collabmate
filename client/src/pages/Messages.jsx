import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [messages, setMessages] = useState({
    sent: [],
    received: []
  });
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch sent messages
      const sentRes = await API.get('/messages', {
        params: { type: 'sent' }
      });
      console.log('Sent messages response:', sentRes.data);
      
      // Fetch received messages
      const receivedRes = await API.get('/messages', {
        params: { type: 'received' }
      });
      console.log('Received messages response:', receivedRes.data);

      // Ensure we have arrays even if the response is malformed
      const sentMessages = Array.isArray(sentRes.data?.messages) ? sentRes.data.messages : [];
      const receivedMessages = Array.isArray(receivedRes.data?.messages) ? receivedRes.data.messages : [];

      console.log('Processed sent messages:', sentMessages);
      console.log('Processed received messages:', receivedMessages);

      setMessages({
        sent: sentMessages,
        received: receivedMessages
      });
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to fetch messages. Please try again.');
      // Initialize with empty arrays on error
      setMessages({
        sent: [],
        received: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleSend = async () => {
    if (!receiverEmail || !subject || !content) {
      alert('All fields required');
      return;
    }

    try {
      setSending(true);
      console.log('Finding user with email:', receiverEmail);
      const userRes = await API.get(`/auth/email/${receiverEmail}`);
      console.log('User found:', userRes.data);
      
      if (!userRes.data || !userRes.data._id) {
        alert('User not found');
        return;
      }

      const recipientId = userRes.data._id;
      console.log('Sending message to recipient:', recipientId);

      const messageData = {
        recipientId,
        subject: subject.trim(),
        content: content.trim(),
        type: 'message'
      };
      console.log('Message data:', messageData);

      const response = await API.post('/messages', messageData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Message sent successfully:', response.data);

      // Update messages state with the new message
      setMessages(prev => ({
        ...prev,
        sent: [response.data, ...prev.sent]
      }));

      // Reset form
      setReceiverEmail('');
      setSubject('');
      setContent('');
      setIsComposing(false);
      alert('Message sent successfully!');
    } catch (err) {
      console.error('❌ Send Message Error:', err);
      if (err.response?.data?.error) {
        alert(`Error sending message: ${err.response.data.error}`);
      } else {
        alert('Error sending message. Please try again.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/messages/${id}`);
      fetchMessages();
      if (selectedMessage?._id === id) {
        setSelectedMessage(null);
      }
    } catch (err) {
      alert('Error deleting message');
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await API.patch(`/messages/${id}/read`);
      fetchMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const displayedMessages = activeTab === 'inbox' ? messages.received : messages.sent;
  const filteredMessages = displayedMessages?.filter(msg => 
    msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activeTab === 'inbox' ? msg.sender?.email : msg.recipient?.email)
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>📨 Messages</h2>
        <div style={styles.headerButtons}>
          <button 
            onClick={() => setIsComposing(!isComposing)}
            style={styles.composeButton}
          >
            {isComposing ? '✕ Cancel' : '✏️ Compose'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={fetchMessages}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      <div style={styles.mainContent}>
        {isComposing && (
          <div style={styles.composeSection}>
            <h3 style={styles.sectionTitle}>New Message</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label}>To:</label>
              <input
                type="email"
                placeholder="Recipient's Email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                style={styles.input}
                disabled={sending}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Subject:</label>
              <input
                type="text"
                placeholder="Message Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={styles.input}
                disabled={sending}
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Message:</label>
              <textarea
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={styles.textarea}
                disabled={sending}
              />
            </div>
            <button 
              onClick={handleSend} 
              style={{
                ...styles.sendButton,
                opacity: sending ? 0.7 : 1,
                cursor: sending ? 'not-allowed' : 'pointer'
              }}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        )}

        <div style={styles.messagesSection}>
          <div style={styles.controls}>
            <div style={styles.tabs}>
              <button 
                onClick={() => setActiveTab('inbox')} 
                style={activeTab === 'inbox' ? styles.activeTab : styles.tab}
              >
                Inbox ({messages.received.length})
              </button>
              <button 
                onClick={() => setActiveTab('sent')} 
                style={activeTab === 'sent' ? styles.activeTab : styles.tab}
              >
                Sent ({messages.sent.length})
              </button>
            </div>
            <div style={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner}></div>
              <p style={styles.loadingText}>Loading messages...</p>
            </div>
          ) : filteredMessages.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>📭</span>
              <p style={styles.emptyText}>
                {searchTerm ? 'No matching messages found.' : 'No messages yet.'}
              </p>
            </div>
          ) : (
            <div style={styles.messageList}>
              {filteredMessages.map((msg) => (
                <div 
                  key={msg._id} 
                  style={{
                    ...styles.messageCard,
                    ...(msg._id === selectedMessage?._id ? styles.selectedMessage : {}),
                    ...(activeTab === 'inbox' && !msg.read ? styles.unreadMessage : {})
                  }}
                  onClick={() => {
                    setSelectedMessage(msg);
                    if (activeTab === 'inbox' && !msg.read) {
                      handleMarkAsRead(msg._id);
                    }
                  }}
                >
                  <div style={styles.messageHeader}>
                    <h4 style={styles.messageSubject}>{msg.subject}</h4>
                    {activeTab === 'inbox' && !msg.read && (
                      <span style={styles.unreadBadge}>New</span>
                    )}
                  </div>
                  <p style={styles.messageMeta}>
                    <strong>{activeTab === 'inbox' ? 'From' : 'To'}:</strong>{' '}
                    {activeTab === 'inbox' ? msg.sender?.email : msg.recipient?.email}
                  </p>
                  <p style={styles.messagePreview}>
                    {msg.content.length > 100 ? `${msg.content.substring(0, 100)}...` : msg.content}
                  </p>
                  <div style={styles.messageFooter}>
                    <p style={styles.messageDate}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(msg._id);
                      }} 
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMessage && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <button 
              onClick={() => setSelectedMessage(null)}
              style={styles.closeButton}
            >
              ×
            </button>
            <h3 style={styles.modalSubject}>{selectedMessage.subject}</h3>
            <p style={styles.modalMeta}>
              <strong>{activeTab === 'inbox' ? 'From' : 'To'}:</strong>{' '}
              {activeTab === 'inbox' ? selectedMessage.sender?.email : selectedMessage.recipient?.email}
            </p>
            <p style={styles.modalDate}>
              {new Date(selectedMessage.createdAt).toLocaleString()}
            </p>
            <div style={styles.modalBody}>
              {selectedMessage.content}
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
    maxWidth: '100%',
  },
  headerButtons: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  heading: {
    fontSize: '28px',
    color: '#1e293b',
    margin: 0,
  },
  composeButton: {
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
  },
  mainContent: {
    display: 'grid',
    gap: '30px',
    maxWidth: '100%',
  },
  composeSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    animation: 'slideDown 0.3s ease',
    maxWidth: '100%',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#1e293b',
    marginBottom: '20px',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#64748b',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: '#4f46e5',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    },
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    height: '150px',
    resize: 'vertical',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    '&:focus': {
      borderColor: '#4f46e5',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    },
  },
  sendButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  messagesSection: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    maxWidth: '100%',
  },
  controls: {
    marginBottom: '25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
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
  searchContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
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
  },
  messageList: {
    display: 'grid',
    gap: '15px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  messageCard: {
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'white',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
  },
  selectedMessage: {
    borderColor: '#4f46e5',
    backgroundColor: '#f8fafc',
  },
  unreadMessage: {
    backgroundColor: '#f1f5f9',
    borderLeft: '4px solid #4f46e5',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  messageSubject: {
    fontSize: '16px',
    color: '#1e293b',
    margin: 0,
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#4f46e5',
    color: 'white',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  messageMeta: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px',
  },
  messagePreview: {
    fontSize: '14px',
    color: '#475569',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageDate: {
    fontSize: '12px',
    color: '#94a3b8',
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
  modal: {
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
    animation: 'fadeIn 0.2s ease',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    position: 'relative',
    animation: 'slideUp 0.3s ease',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    fontSize: '24px',
    color: '#64748b',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      color: '#1e293b',
    },
  },
  modalSubject: {
    fontSize: '20px',
    color: '#1e293b',
    marginBottom: '15px',
    fontWeight: '600',
  },
  modalMeta: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '8px',
  },
  modalDate: {
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '20px',
  },
  modalBody: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#1e293b',
    whiteSpace: 'pre-wrap',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
  },
  errorText: {
    fontSize: '16px',
    color: '#dc2626',
    marginBottom: '20px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
};

export default Messages;
