const ProjectModal = ({ project, onClose }) => {
    if (!project) return null;
  
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <h2 style={styles.title}>{project.title}</h2>
          <p style={styles.desc}>{project.description}</p>
          <small style={styles.date}>
            Created:{' '}
            {new Date(project.createdAt).toLocaleString('default', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
          <button onClick={onClose} style={styles.closeBtn}>
            Close
          </button>
        </div>
      </div>
    );
  };
  
  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modal: {
      backgroundColor: '#fff',
      padding: '30px',
      borderRadius: '12px',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
      textAlign: 'center',
    },
    title: {
      fontSize: '20px',
      fontWeight: '600',
      marginBottom: '16px',
      color: '#1e293b',
    },
    desc: {
      fontSize: '16px',
      color: '#4b5563',
      marginBottom: '20px',
    },
    date: {
      fontSize: '13px',
      color: '#6b7280',
      marginBottom: '24px',
    },
    closeBtn: {
      padding: '10px 20px',
      backgroundColor: '#4f46e5',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
    },
  };
  
  export default ProjectModal;
  