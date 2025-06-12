import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const MessageThread = ({ threadId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    // TODO: Set up WebSocket connection for real-time updates
  }, [threadId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get(`/messages/thread/${threadId}`);
      setMessages(response.data);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    try {
      const formData = new FormData();
      formData.append('content', newMessage);
      formData.append('threadId', threadId);
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await API.post('/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      setAttachments([]);
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      const response = await API.post(`/messages/${messageId}/reactions`, { emoji });
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? response.data : msg
      ));
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Message Thread</h3>
        <button onClick={onClose} style={styles.closeButton}>×</button>
      </div>

      {error && (
        <div style={styles.error}>
          {error}
          <button onClick={fetchMessages} style={styles.retryButton}>
            Retry
          </button>
        </div>
      )}

      <div style={styles.messagesContainer}>
        {loading ? (
          <div style={styles.loading}>Loading messages...</div>
        ) : (
          messages.map(message => (
            <div
              key={message._id}
              style={{
                ...styles.message,
                ...(message.sender._id === localStorage.getItem('userId')
                  ? styles.sentMessage
                  : styles.receivedMessage)
              }}
            >
              <div style={styles.messageHeader}>
                <span style={styles.sender}>{message.sender.name}</span>
                <span style={styles.timestamp}>
                  {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                </span>
              </div>

              <div style={styles.content}>{message.content}</div>

              {message.attachments?.length > 0 && (
                <div style={styles.attachments}>
                  {message.attachments.map((attachment, index) => (
                    <div key={index} style={styles.attachment}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.attachmentLink}
                      >
                        {attachment.originalName}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.reactions}>
                {message.reactions?.map((reaction, index) => (
                  <span key={index} style={styles.reaction}>
                    {reaction.emoji}
                  </span>
                ))}
                <button
                  onClick={() => setShowEmojiPicker(true)}
                  style={styles.addReactionButton}
                >
                  +
                </button>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} style={styles.inputContainer}>
        {attachments.length > 0 && (
          <div style={styles.attachmentPreview}>
            {attachments.map((file, index) => (
              <div key={index} style={styles.attachmentItem}>
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  style={styles.removeAttachment}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
          />
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={styles.attachButton}
          >
            📎
          </button>
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={styles.emojiButton}
          >
            😊
          </button>
          <button type="submit" style={styles.sendButton}>
            Send
          </button>
        </div>

        {showEmojiPicker && (
          <div style={styles.emojiPickerContainer}>
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #e2e8f0',
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#1e293b',
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0 8px',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    margin: '8px',
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
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  },
  loading: {
    textAlign: 'center',
    color: '#64748b',
    padding: '20px',
  },
  message: {
    maxWidth: '70%',
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
  },
  sentMessage: {
    backgroundColor: '#4f46e5',
    color: 'white',
    marginLeft: 'auto',
  },
  receivedMessage: {
    backgroundColor: '#f1f5f9',
    color: '#1e293b',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    fontSize: '12px',
  },
  sender: {
    fontWeight: 'bold',
  },
  timestamp: {
    opacity: 0.8,
  },
  content: {
    wordBreak: 'break-word',
  },
  attachments: {
    marginTop: '8px',
  },
  attachment: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '4px 8px',
    borderRadius: '4px',
    marginTop: '4px',
  },
  attachmentLink: {
    color: 'inherit',
    textDecoration: 'none',
  },
  reactions: {
    display: 'flex',
    gap: '4px',
    marginTop: '8px',
  },
  reaction: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '12px',
  },
  addReactionButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    padding: '2px 6px',
  },
  inputContainer: {
    padding: '16px',
    borderTop: '1px solid #e2e8f0',
  },
  attachmentPreview: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '8px',
  },
  attachmentItem: {
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  removeAttachment: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0 4px',
  },
  inputWrapper: {
    display: 'flex',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
  },
  attachButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  emojiButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 8px',
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  emojiPickerContainer: {
    position: 'absolute',
    bottom: '100%',
    right: '16px',
    marginBottom: '8px',
  },
};

export default MessageThread; 