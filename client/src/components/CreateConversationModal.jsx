// client/src/components/CreateConversationModal.jsx
import React, { useState, useEffect } from 'react';
import API from '../api/axios'; // Adjust path as needed
import Swal from 'sweetalert2';

const CreateConversationModal = ({ isOpen, onClose, onCreateSuccess }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [subject, setSubject] = useState('');
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [error, setError] = useState(null);
    const [creatingConversation, setCreatingConversation] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user'));

    // Debounce search term for user lookup
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchTerm.length > 2) { // Only search if more than 2 characters
                searchUsers();
            } else {
                setSearchResults([]); // Clear results if search term is too short
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(delaySearch);
    }, [searchTerm]);

    const searchUsers = async () => {
        setLoadingSearch(true);
        setError(null);
        try {
            // Search for users, exclude current user
            const res = await API.get(`/users?search=${searchTerm}`);
            const filteredResults = res.data.filter(user => user._id !== currentUser?._id);
            setSearchResults(filteredResults);
        } catch (err) {
            console.error('Error searching users:', err);
            setError('Failed to search users.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleSelectParticipant = (user) => {
        // Prevent adding duplicate participants and current user
        if (!selectedParticipants.some(p => p._id === user._id) && user._id !== currentUser?._id) {
            setSelectedParticipants([...selectedParticipants, user]);
            setSearchTerm(''); // Clear search term after selection
            setSearchResults([]); // Clear search results
        }
    };

    const handleRemoveParticipant = (userId) => {
        setSelectedParticipants(selectedParticipants.filter(p => p._id !== userId));
    };

    const handleCreateConversation = async () => {
        setError(null);
        if (selectedParticipants.length === 0) {
            setError('Please select at least one participant.');
            return;
        }

        setCreatingConversation(true);
        try {
            const participantIds = selectedParticipants.map(p => p._id);
            const res = await API.post('/conversations', {
                participantIds: participantIds,
                subject: subject.trim() || undefined,
            });
            // Show SweetAlert2 success popup
            await Swal.fire({
                icon: 'success',
                title: 'Conversation Created!',
                text: 'Your new conversation has been created successfully.',
                confirmButtonColor: '#4f46e5',
                background: '#f0f9ff',
                color: '#1e293b',
            });
            onCreateSuccess(res.data); // Pass the new conversation back to the parent
            onClose(); // Close the modal
            // Reset state
            setSearchTerm('');
            setSearchResults([]);
            setSelectedParticipants([]);
            setSubject('');
        } catch (err) {
            console.error('Error creating conversation:', err);
            setError('Failed to create conversation: ' + (err.response?.data?.message || err.message));
        } finally {
            setCreatingConversation(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={modalStyles.overlay}>
            <div style={modalStyles.modal}>
                <h3 style={modalStyles.modalTitle}>Start New Conversation</h3>
                {error && <p style={modalStyles.errorText}>{error}</p>}

                {/* Subject Input */}
                <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>Conversation Ttile</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g., Project X Discussion"
                        style={modalStyles.input}
                    />
                </div>

                {/* Participant Search */}
                <div style={modalStyles.inputGroup}>
                    <label style={modalStyles.label}>Add Participants:</label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search users by name or username..."
                        style={modalStyles.input}
                    />
                    {loadingSearch && <p style={modalStyles.loadingText}>Searching...</p>}
                    <div style={modalStyles.searchResults}>
                    {searchResults.map(user => (
                    <div key={user._id} style={modalStyles.searchResultItem} onClick={() => handleSelectParticipant(user)}>
                    {user.name} {user.email ? `(${user.email})` : ''} {/* Changed here */}
                    </div>
                    ))} 
                    </div>
                    
                </div>

                {/* Selected Participants */}
                <div style={modalStyles.selectedList}>
                {selectedParticipants.map(user => (
                <span key={user._id} style={modalStyles.selectedTag}>
                {user.name || user.email || user.username} {/* Changed here: Prioritize name, then email, then username */}
                <button onClick={() => handleRemoveParticipant(user._id)} style={modalStyles.removeTagButton}>x</button>
                </span>
                ))}
                </div>

                <div style={modalStyles.buttonGroup}>
                    <button
                        onClick={handleCreateConversation}
                        disabled={selectedParticipants.length === 0 || creatingConversation}
                        style={modalStyles.createButton}
                    >
                        {creatingConversation ? 'Creating...' : 'Create Conversation'}
                    </button>
                    <button
                        onClick={async () => {
                            const result = await Swal.fire({
                                title: 'Discard new conversation?',
                                text: 'Are you sure you want to cancel creating this conversation? Your changes will be lost.',
                                icon: 'warning',
                                showCancelButton: true,
                                confirmButtonText: 'Yes, cancel',
                                cancelButtonText: 'No, keep editing',
                                confirmButtonColor: '#ef4444',
                                cancelButtonColor: '#4f46e5',
                                reverseButtons: true
                            });
                            if (result.isConfirmed) {
                                onClose();
                            }
                        }}
                        style={modalStyles.cancelButton}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

const modalStyles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '10px',
        width: '500px',
        maxWidth: '90%',
        boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    modalTitle: {
        fontSize: '24px',
        marginBottom: '10px',
        color: '#1e293b',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: '15px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#334155',
        fontSize: '14px',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #cbd5e1',
        fontSize: '15px',
        boxSizing: 'border-box',
    },
    searchResults: {
        border: '1px solid #e2e8f0',
        borderRadius: '5px',
        maxHeight: '150px',
        overflowY: 'auto',
        marginTop: '10px',
        backgroundColor: '#f8fafc',
    },
    searchResultItem: {
        padding: '10px',
        borderBottom: '1px solid #e2e8f0',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
        '&:last-child': {
            borderBottom: 'none',
        },
        '&:hover': {
            backgroundColor: '#e0e7ff',
        },
    },
    selectedParticipants: {
        minHeight: '40px',
        border: '1px solid #cbd5e1',
        borderRadius: '5px',
        padding: '10px',
        backgroundColor: '#f0f4ff',
    },
    selectedList: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
    },
    selectedTag: {
        backgroundColor: '#4f46e5',
        color: 'white',
        padding: '6px 10px',
        borderRadius: '20px',
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    removeTagButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '14px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginLeft: '5px',
        lineHeight: 1, // Fix vertical alignment
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
        marginTop: '20px',
    },
    createButton: {
        padding: '10px 20px',
        backgroundColor: '#22c55e',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#16a34a',
        },
        '&:disabled': {
            backgroundColor: '#a7f3d0',
            cursor: 'not-allowed',
        },
    },
    cancelButton: {
        padding: '10px 20px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s ease',
        '&:hover': {
            backgroundColor: '#dc2626',
        },
    },
    loadingText: {
        color: '#64748b',
        fontSize: '14px',
        marginTop: '5px',
    },
    errorText: {
        color: '#ef4444',
        fontSize: '14px',
        textAlign: 'center',
        marginBottom: '10px',
    },
    emptyText: {
        color: '#94a3b8',
        fontSize: '14px',
        fontStyle: 'italic',
    }
};

export default CreateConversationModal;