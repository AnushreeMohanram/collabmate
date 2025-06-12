import { useEffect, useState } from 'react';
import API from '../api/axios';

const Suggestions = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuggestions, setSavedSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState(null);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get('/suggestions/ai');
      if (res.data && Array.isArray(res.data.suggestions)) {
        setSuggestions(res.data.suggestions);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError('Failed to fetch suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedSuggestions = async () => {
    try {
      setError(null);
      console.log('Fetching saved suggestions...');
      
      const res = await API.get('/suggestions/saved');
      console.log('Saved suggestions response:', res.data);
      
      if (res.data && Array.isArray(res.data.suggestions)) {
        setSavedSuggestions(res.data.suggestions);
      } else {
        console.error('Invalid response format:', res.data);
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Failed to fetch saved suggestions:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Failed to fetch saved suggestions. Please try again.';
      setError(errorMessage);
      setSavedSuggestions([]);
    }
  };

  useEffect(() => {
    fetchSuggestions();
    fetchSavedSuggestions();
  }, []);

  const handleSave = async (suggestion) => {
    try {
      setError(null);
      console.log('Attempting to save suggestion:', suggestion);
      
      const response = await API.post('/suggestions/save', { suggestion });
      console.log('Save suggestion response:', response.data);
      
      if (response.data.message === 'Suggestion saved successfully') {
        await fetchSavedSuggestions();
        alert('Suggestion saved successfully!');
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Failed to save suggestion:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      if (err.response?.data?.error === 'Suggestion already saved') {
        alert('This suggestion is already saved!');
      } else {
        const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Failed to save suggestion. Please try again.';
        setError(errorMessage);
        alert(errorMessage);
      }
    }
  };

  const handleDelete = async (suggestion) => {
    try {
      setError(null);
      console.log('Attempting to delete suggestion:', suggestion);
      
      const response = await API.delete('/suggestions/saved', { data: { suggestion } });
      console.log('Delete suggestion response:', response.data);
      
      if (response.data.message === 'Suggestion removed successfully') {
        await fetchSavedSuggestions();
        alert('Suggestion removed successfully!');
      } else {
        console.error('Unexpected response format:', response.data);
        throw new Error('Unexpected response format');
      }
    } catch (err) {
      console.error('Failed to remove suggestion:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      const errorMessage = err.response?.data?.details || err.response?.data?.error || 'Failed to remove suggestion. Please try again.';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const handleRefresh = () => {
    fetchSuggestions();
  };

  const filteredSuggestions = (activeTab === 'all' ? suggestions : savedSuggestions)
    .filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.heading}>🤖 AI-Powered Project Ideas</h2>
        <button 
          onClick={handleRefresh}
          style={styles.refreshButton}
          disabled={loading}
        >
          {loading ? '🔄 Loading...' : '🔄 Refresh'}
        </button>
      </div>
      
      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search suggestions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>🔍</span>
        </div>
        
        <div style={styles.tabs}>
          <button 
            onClick={() => setActiveTab('all')}
            style={activeTab === 'all' ? styles.activeTab : styles.tab}
          >
            All Suggestions ({suggestions.length})
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            style={activeTab === 'saved' ? styles.activeTab : styles.tab}
          >
            Saved Suggestions ({savedSuggestions.length})
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchSuggestions();
            }}
            style={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}></div>
          <p style={styles.loadingText}>Loading suggestions...</p>
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>💡</span>
          <p style={styles.emptyText}>
            {searchTerm ? 'No matching suggestions found.' : 'No suggestions available.'}
          </p>
          {!searchTerm && activeTab === 'all' && (
            <button 
              onClick={handleRefresh}
              style={styles.refreshButton}
            >
              Get New Suggestions
            </button>
          )}
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredSuggestions.map((suggestion, i) => (
            <div key={i} style={styles.card}>
              <p style={styles.suggestionText}>💡 {suggestion}</p>
              {activeTab === 'all' ? (
                <button 
                  onClick={() => handleSave(suggestion)}
                  style={styles.saveButton}
                >
                  Save
                </button>
              ) : (
                <button 
                  onClick={() => handleDelete(suggestion)}
                  style={styles.deleteButton}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginLeft: '240px',
    padding: '30px',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4ff, #fff)',
    width: 'calc(100% - 240px)',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  heading: {
    fontSize: '28px',
    color: '#1e293b',
    margin: 0,
  },
  refreshButton: {
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
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
  },
  controls: {
    marginBottom: '25px',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '100%',
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
  tabs: {
    display: 'flex',
    gap: '10px',
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
  errorContainer: {
    backgroundColor: '#fee2e2',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#dc2626',
    margin: 0,
    fontSize: '14px',
  },
  retryButton: {
    padding: '6px 12px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#b91c1c',
    },
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
    marginBottom: '20px',
  },
  grid: {
    display: 'grid',
    gap: '20px',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
  },
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    },
  },
  suggestionText: {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#1e293b',
    margin: 0,
  },
  saveButton: {
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    alignSelf: 'flex-start',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    alignSelf: 'flex-start',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
};

export default Suggestions;
