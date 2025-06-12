const MessageCard = ({ message, onClick, onDelete }) => {
    return (
      <div style={styles.card} onClick={onClick}>
        <h4 style={styles.subject}>{message.subject}</h4>
        <p style={styles.preview}>From: {message.sender}</p>
        <p style={styles.preview}>To: {message.receiver}</p>
        <button onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }} style={styles.deleteBtn}>
          Delete
        </button>
      </div>
    );
  };
  
  const styles = {
    card: {
      background: '#f9fafb',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
      marginBottom: '15px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out'
    },
    subject: {
      marginBottom: '8px',
      color: '#111827'
    },
    preview: {
      fontSize: '14px',
      color: '#6b7280',
      marginBottom: '4px'
    },
    deleteBtn: {
      marginTop: '10px',
      padding: '6px 12px',
      backgroundColor: '#ef4444',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }
  };
  
  export default MessageCard;
  