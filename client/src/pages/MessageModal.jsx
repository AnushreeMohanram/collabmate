const MessageModal = ({ message, onClose }) => {
    return (
      <div style={styles.backdrop}>
        <div style={styles.modal}>
          <h3>{message.subject}</h3>
          <p><strong>From:</strong> {message.sender}</p>
          <p><strong>To:</strong> {message.receiver}</p>
          <p style={{ marginTop: '15px' }}>{message.content}</p>
          <button onClick={onClose} style={styles.closeBtn}>Close</button>
        </div>
      </div>
    );
  };
  
  const styles = {
    backdrop: {
      position: 'fixed',
      top: 0, left: 0,
      width: '100vw', height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    },
    modal: {
      background: '#fff',
      padding: '30px',
      borderRadius: '12px',
      width: '90%',
      maxWidth: '500px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
    },
    closeBtn: {
      marginTop: '20px',
      padding: '10px 16px',
      backgroundColor: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer'
    }
  };
  
  export default MessageModal;
  