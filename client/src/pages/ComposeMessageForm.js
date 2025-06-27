import { useState } from 'react';
import Swal from 'sweetalert2';

const ComposeMessageForm = ({ onSend }) => {
  const [receiver, setReceiver] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = () => {
    if (!receiver || !subject || !content) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Fill in all fields!' });
      return;
    }
    onSend(receiver, subject, content);
    setReceiver('');
    setSubject('');
    setContent('');
  };

  return (
    <div style={styles.form}>
      <input
        type="text"
        placeholder="To (Receiver Email or Username)"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
        style={styles.input}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        style={styles.input}
      />
      <textarea
        placeholder="Write your message..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        style={styles.textarea}
      />
      <button onClick={handleSubmit} style={styles.sendBtn}>Send Message</button>
    </div>
  );
};

const styles = {
  form: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxWidth: '500px'
  },
  input: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #ccc'
  },
  textarea: {
    padding: '10px',
    fontSize: '16px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    resize: 'vertical'
  },
  sendBtn: {
    padding: '10px',
    backgroundColor: '#10b981',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};

export default ComposeMessageForm;
