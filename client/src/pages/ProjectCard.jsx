const ProjectCard = ({ project, onClick }) => (
  <div
    style={{
      ...styles.card,
      backgroundColor: project.status === 'completed' ? '#d1fae5' : styles.card.backgroundColor,
      border: project.status === 'completed' ? '2px solid #22c55e' : 'none',
      color: project.status === 'completed' ? '#065f46' : styles.card.color,
      position: 'relative',
    }}
    onClick={onClick}
  >
    <div style={styles.header}>
      <h3 style={styles.title}>{project.name || project.title}</h3>
      {project.status === 'completed' && (
        <span style={{
          backgroundColor: '#22c55e',
          color: 'white',
          borderRadius: '8px',
          padding: '2px 10px',
          fontSize: '12px',
          fontWeight: 600,
          marginLeft: 8,
        }}>
          Completed
        </span>
      )}
      {project.userRole && project.userRole !== 'owner' && (
        <span style={styles.collaborationBadge}>
          {project.userRole === 'editor' ? '✏️ Editor' : 
           project.userRole === 'viewer' ? '👁️ Viewer' : 
           project.userRole === 'admin' ? '👑 Admin' : '🤝 Collaborator'}
        </span>
      )}
    </div>
    <p style={styles.desc}>{project.description}</p>
    <div style={styles.footer}>
      <small style={styles.date}>
        Created: {new Date(project.createdAt).toLocaleDateString()}
      </small>
      {project.collaborators && project.collaborators.length > 0 && (
        <small style={styles.collaborators}>
          🤝 {project.collaborators.length} collaborator{project.collaborators.length > 1 ? 's' : ''}
        </small>
      )}
    </div>
  </div>
);

const styles = {
  card: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 16px rgba(0,0,0,0.08)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1e293b',
    margin: 0,
  },
  collaborationBadge: {
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '12px',
    backgroundColor: '#e0e7ff',
    color: '#4f46e5',
    fontWeight: '500',
  },
  desc: {
    fontSize: '14px',
    color: '#4b5563',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  date: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  collaborators: {
    fontSize: '12px',
    color: '#4f46e5',
    backgroundColor: '#e0e7ff',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    width: '100%',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
};

export default ProjectCard;
  