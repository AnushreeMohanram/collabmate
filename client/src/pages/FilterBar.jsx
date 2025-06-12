const FilterBar = ({ value, onChange }) => (
    <input
      type="text"
      placeholder="Search projects..."
      value={value}
      onChange={e => onChange(e.target.value)}
      style={styles.input}
    />
  );
  
  const styles = {
    input: {
      padding: '12px 16px',
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      fontSize: '14px',
      width: '260px',
    },
  };
  
  export default FilterBar;
  