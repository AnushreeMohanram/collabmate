import { useState } from 'react';

const AddProjectForm = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    onAdd(title, description);
    setTitle('');
    setDescription('');
  };

  return (
    <div style={styles.form}>
      <input
        type="text"
        placeholder="New project title"
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={styles.input}
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        style={styles.input}
      />
      <button
        onClick={handleSubmit}
        style={styles.addBtn}
        disabled={!title.trim()}
      >
        ➕ Add Project
      </button>
    </div>
  );
};

const styles = {
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  input: {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    flex: 1,
    fontSize: '14px',
  },
  addBtn: {
    padding: '12px 20px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    borderRadius: '8px',
    cursor: 'pointer',
    border: 'none',
    fontWeight: '600',
  },
};

export default AddProjectForm;
