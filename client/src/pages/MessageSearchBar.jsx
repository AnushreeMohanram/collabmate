const MessageSearchBar = ({ value, onChange }) => {
    return (
      <input
        type="text"
        placeholder="Search by sender or subject..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={styles.input}
      />
    );
  };
  
  const styles = {
    input: {
      marginTop: '20px',
      padding: '12px',
      fontSize: '16px',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      width: '100%',
      maxWidth: '400px'
    }
  };
  
  export default MessageSearchBar;
  