import { useState, useEffect } from 'react';
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Messages = () => {
  const user = JSON.parse(localStorage.getItem('user')); // Ensure currentUser is consistent
  const navigate = useNavigate();
  const [messages, setMessages] = useState({
    sent: [],
    received: []
  });
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Keep searchTerm state

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // --- MODIFIED: Call existing backend endpoints with correct parameters ---
      const [sentRes, receivedRes] = await Promise.all([
        API.get('/messages', { params: { type: 'sent' } }),    // Use /messages?type=sent
        API.get('/messages', { params: { type: 'received' } }) // Use /messages?type=received
      ]);

      console.log('Messages.jsx: Sent messages response:', sentRes.data);
      console.log('Messages.jsx: Received messages response:', receivedRes.data);

      setMessages({
        // Backend now returns { messages: [...], pagination: {...} }
        sent: sentRes.data?.messages || [],     
        received: receivedRes.data?.messages || []
      });
    } catch (err) {
      console.error('Messages.jsx: Error fetching messages:', err.response?.data || err.message);
      setError('Failed to fetch messages. Please try again.');
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
  }, [activeTab]); // Trigger refetch on tab change to ensure filtered data is fresh

  const handleSend = async () => {
    const trimmedSubject = subject.trim();
    const trimmedContent = content.trim();

    // New: Validate email format and prevent sending to self
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!receiverEmail || !emailRegex.test(receiverEmail)) {
      setError('Please enter a valid recipient email.');
      setSuccess(null);
      return;
    }
    if (receiverEmail === user?.email) {
      setError('You cannot send a message to yourself.');
      setSuccess(null);
      return;
    }
    if (!trimmedSubject || !trimmedContent) {
      setError('Subject and message content are required.');
      setSuccess(null);
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      setSending(true);
      const userRes = await API.get(`/auth/email/${receiverEmail}`);
      if (!userRes.data || !userRes.data._id) {
        setError('Recipient user not found.');
        setSuccess(null);
        return;
      }
      const recipientId = userRes.data._id;
      const messageData = { recipient: recipientId, subject: trimmedSubject, content: trimmedContent }; // Corrected payload field to 'recipient'
      
      // --- MODIFIED: Call the existing POST /messages endpoint ---
      const response = await API.post('/messages', messageData, { // Use POST /messages
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Messages.jsx: Message sent successfully:', response.data);

      // Re-fetch messages to ensure consistency with backend filtering logic.
      fetchMessages();

      setReceiverEmail('');
      setSubject('');
      setContent('');
      setIsComposing(false);
      setSuccess('Message sent successfully!');
      setError(null);
      setActiveTab('sent');

    } catch (err) {
      console.error('Messages.jsx: ❌ Send Message Error:', err);
      setError(`Error sending message: ${err.response?.data?.message || err.message}`);
      setSuccess(null);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    const messageToDelete = displayedMessages.find(msg => msg._id === id);
    if (!messageToDelete || !messageToDelete.conversation) {
      setError('Cannot delete message: Associated conversation not found.');
      setSuccess(null);
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
      return;
    }
    try {
      // This deletes the entire direct conversation associated with the message
      await API.delete(`/messages/conversations/${messageToDelete.conversation._id}`); 
      console.log('Messages.jsx: Message/Conversation deleted successfully from frontend.');
      
      fetchMessages(); // Refetch messages to update the lists
      if (selectedMessage?._id === id) {
        setSelectedMessage(null); // Deselect if the deleted message was selected
      }
      setSuccess('Message deleted successfully.');
      setError(null);
    } catch (err) {
      console.error('Messages.jsx: Error deleting message/conversation:', err.response?.data || err.message);
      setError('Error deleting message. ' + (err.response?.data?.message || err.message));
      setSuccess(null);
    } finally {
      setShowDeleteConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      // Your backend has a PATCH /messages/:messageId/read endpoint (from your previously shared backend files).
      await API.patch(`/messages/${id}/read`); 
      
      setMessages(prev => ({
        sent: prev.sent.map(msg => msg._id === id ? { ...msg, read: true } : msg),
        received: prev.received.map(msg => msg._id === id ? { ...msg, read: true } : msg)
      }));
    } catch (err) {
      console.error('Messages.jsx: Error marking message as read:', err);
      setError('Failed to mark message as read.');
    }
  };

  const displayedMessages = activeTab === 'inbox' ? messages.received : messages.sent;
  const filteredMessages = displayedMessages?.filter(msg => {
    const searchLower = searchTerm.toLowerCase();
    const subjectMatch = msg.subject && msg.subject.toLowerCase().includes(searchLower);
    
    let senderRecipientEmail = '';
    if (activeTab === 'inbox') {
      senderRecipientEmail = msg.sender?.email;
    } else {
      senderRecipientEmail = msg.recipient?.email;
    }
    
    const emailMatch = senderRecipientEmail && senderRecipientEmail.toLowerCase().includes(searchLower);
    const contentMatch = msg.content && msg.content.toLowerCase().includes(searchLower);

    return subjectMatch || emailMatch || contentMatch; // Search by content too
  }) || [];


  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>📨 Messages</h2>
        <div style={styles.headerButtons}>
          <button 
            onClick={() => {
                setIsComposing(!isComposing);
                setError(null);
                setSuccess(null);
            }}
            style={styles.composeButton}
            aria-label={isComposing ? 'Cancel composing message' : 'Compose new message'}
          >
            {isComposing ? '✕ Cancel' : '✏️ Compose'}
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer} role="alert">
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={fetchMessages}
            style={styles.retryButton}
            aria-label="Retry fetching messages"
          >
            Retry
          </button>
        </div>
      )}

      {success && (
        <div style={{...styles.errorContainer, backgroundColor: '#dcfce7', border: '1px solid #86efac'}} role="status">
          <p style={{...styles.errorText, color: '#166534'}}>{success}</p>
        </div>
      )}

      <div style={styles.mainContent}>
        {isComposing && (
          <div style={styles.composeSection}>
            <h3 style={styles.sectionTitle}>New Direct Message</h3>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="dm-to">To:</label>
              <input
                id="dm-to"
                type="email"
                placeholder="Recipient's Email"
                value={receiverEmail}
                onChange={(e) => setReceiverEmail(e.target.value)}
                style={styles.input}
                disabled={sending}
                aria-label="Recipient's Email"
                autoFocus
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="dm-subject">Subject:</label>
              <input
                id="dm-subject"
                type="text"
                placeholder="Message Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={styles.input}
                disabled={sending}
                aria-label="Message Subject"
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label} htmlFor="dm-content">Message:</label>
              <textarea
                id="dm-content"
                placeholder="Write your message..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={styles.textarea}
                disabled={sending}
                aria-label="Message Content"
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
              aria-label="Send Message"
            >
              {sending ? <span>Sending... <span className="spinner" /></span> : 'Send Message'}
            </button>
          </div>
        )}

        <div style={styles.messagesSection}>
          <div style={styles.controls}>
            <div style={styles.tabs}>
              <button 
                onClick={() => setActiveTab('inbox')} 
                style={activeTab === 'inbox' ? styles.activeTab : styles.tab}
                aria-label="Inbox tab"
              >
                Inbox ({messages.received.length})
              </button>
              <button 
                onClick={() => setActiveTab('sent')} 
                style={activeTab === 'sent' ? styles.activeTab : styles.tab}
                aria-label="Sent tab"
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
                aria-label="Search messages"
              />
              <span style={styles.searchIcon}>🔍</span>
            </div>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>
              <div style={styles.loadingSpinner} aria-label="Loading messages"></div>
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
                  tabIndex={0}
                  aria-label={`Message from ${msg.sender?.email || msg.recipient?.email || 'Unknown'}: ${msg.subject}`}
                  onKeyDown={e => { if (e.key === 'Enter') { setSelectedMessage(msg); } }}
                >
                  <div style={styles.messageHeader}>
                    <h4 style={styles.messageSubject}>{msg.subject || '(No Subject)'}</h4>
                    {activeTab === 'inbox' && !msg.read && (
                      <span style={styles.unreadBadge}>New</span>
                    )}
                  </div>
                  <p style={styles.messageMeta}>
                    <strong>{activeTab === 'inbox' ? 'From' : 'To'}:</strong>{' '}
                    {activeTab === 'inbox' ? msg.sender?.email : msg.recipient?.email || '(Unknown)'}
                  </p>
                  <p style={styles.messagePreview}>
                    {(msg.content || '').length > 100 ? `${(msg.content || '').substring(0, 100)}...` : (msg.content || '(No Content)')}
                  </p>
                  <div style={styles.messageFooter}>
                    <p style={styles.messageDate}>
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                    <button 
                      onClick={e => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                        setPendingDeleteId(msg._id);
                      }} 
                      style={styles.deleteButton}
                      aria-label="Delete message"
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
        <div style={styles.modal} role="dialog" aria-modal="true" tabIndex={-1}>
          <div style={styles.modalContent}>
            <button 
              onClick={() => setSelectedMessage(null)}
              style={styles.closeButton}
              aria-label="Close message details"
              autoFocus
            >
              ×
            </button>
            <h3 style={styles.modalSubject}>{selectedMessage.subject || '(No Subject)'}</h3>
            <p style={styles.modalMeta}>
              <strong>{activeTab === 'inbox' ? 'From' : 'To'}:</strong>{' '}
              {selectedMessage.sender?.email || selectedMessage.recipient?.email || '(Unknown)'}
            </p>
            <p style={styles.modalDate}>
              {new Date(selectedMessage.createdAt).toLocaleString()}
            </p>
            <div style={styles.modalBody}>
              {selectedMessage.content || '(No Content)'}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div style={styles.modal} role="dialog" aria-modal="true" tabIndex={-1}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalSubject}>Delete Message</h3>
            <p style={styles.modalBody}>Are you sure you want to delete this message? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPendingDeleteId(null);
                }}
                style={{ ...styles.sendButton, backgroundColor: '#f1f5f9', color: '#1e293b' }}
                aria-label="Cancel delete"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(pendingDeleteId)}
                style={{ ...styles.sendButton, backgroundColor: '#ef4444' }}
                aria-label="Confirm delete"
              >
                Delete
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
    backgroundColor: '#fee2e2',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #fca5a5',
  },
  errorText: {
    fontSize: '16px',
    color: '#dc2626',
    marginBottom: '20px',
    textAlign: 'center',
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
