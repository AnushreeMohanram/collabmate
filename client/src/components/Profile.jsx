// src/components/Profile.jsx
import React, { useState, useEffect, useRef } from 'react'; // Import useRef
import API from '../api/axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

const Profile = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // State for form inputs when editing
  const [editedName, setEditedName] = useState('');
  // removed editedAvatar state as it's handled by selectedAvatarFile and userProfile.avatar
  const [editedInterests, setEditedInterests] = useState([]);
  const [editedSkills, setEditedSkills] = useState([]); // This will be an array of objects

  // State for adding a new skill
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState('beginner');

  // NEW STATE FOR AI SUGGESTIONS
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState(null);

  // NEW STATES FOR AVATAR UPLOAD
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUploadError, setAvatarUploadError] = useState(null);
  const avatarFileInputRef = useRef(null); // Ref for the hidden file input

  const navigate = useNavigate();

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await API.get('/users/profile'); // Backend endpoint for user profile
      setUserProfile(response.data);
      // Initialize editable states with fetched data
      setEditedName(response.data.name);
      setEditedInterests(response.data.interests || []);
      setEditedSkills(response.data.skills || []);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to fetch profile data. Please try again.');
      // If unauthorized, redirect to login
      if (err.response && err.response.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handlers for form input changes
  const handleInterestChange = (e, index) => {
    const newInterests = [...editedInterests];
    newInterests[index] = e.target.value;
    setEditedInterests(newInterests);
  };

  const addInterestInput = () => {
    setEditedInterests([...editedInterests, '']);
  };

  const removeInterestInput = (index) => {
    const newInterests = editedInterests.filter((_, i) => i !== index);
    setEditedInterests(newInterests);
  };

  const handleAddSkill = () => {
    if (newSkillName.trim() === '') {
      Swal.fire({ icon: 'error', title: 'Error', text: 'Skill name cannot be empty.' });
      return;
    }
    // Check for duplicate skill names (case-insensitive)
    if (editedSkills.some(s => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'This skill already exists.' });
        return;
    }
    const newSkill = { name: newSkillName.trim(), level: newSkillLevel, verified: false };
    setEditedSkills([...editedSkills, newSkill]);
    setNewSkillName(''); // Clear input
    setNewSkillLevel('beginner'); // Reset level
  };

  const handleRemoveSkill = (indexToRemove) => {
    setEditedSkills(editedSkills.filter((_, index) => index !== indexToRemove));
  };

  const handleSkillLevelChange = (e, index) => {
    const updatedSkills = [...editedSkills];
    updatedSkills[index].level = e.target.value;
    setEditedSkills(updatedSkills);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      setLoading(true); // Set loading for profile update, not just avatar
      setError(null);

      // Construct the payload for the PUT request (NO AVATAR HERE)
      const payload = {
        name: editedName,
        interests: editedInterests.filter(i => i.trim() !== ''), // Filter out empty interest inputs
        skills: editedSkills.filter(s => s.name.trim() !== '') // Filter out skills with empty names
      };

      const response = await API.put('/users/profile', payload);
      setUserProfile(response.data); // Update the displayed profile with the response
      // Also update localStorage user data for consistency in sidebar
      const updatedUserInStorage = { ...JSON.parse(localStorage.getItem('user')), ...response.data };
      localStorage.setItem('user', JSON.stringify(updatedUserInStorage));

      setIsEditing(false); // Exit editing mode
      Swal.fire({ icon: 'success', title: 'Success', text: 'Profile updated successfully!' });
    } catch (err) {
      console.error('Error updating user profile:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // NEW FUNCTION: Handle Avatar File Change
  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Basic validation: Check file type and size
      if (!file.type.startsWith('image/')) {
        setAvatarUploadError('Only image files are allowed.');
        setSelectedAvatarFile(null);
        if(avatarFileInputRef.current) avatarFileInputRef.current.value = ''; // Clear file input
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5 MB limit
        setAvatarUploadError('File size exceeds 5MB limit.');
        setSelectedAvatarFile(null);
        if(avatarFileInputRef.current) avatarFileInputRef.current.value = ''; // Clear file input
        return;
      }
      setAvatarUploadError(null); // Clear previous errors
      setSelectedAvatarFile(file);
    } else {
      setSelectedAvatarFile(null);
    }
  };

  // NEW FUNCTION: Handle Avatar Upload
  const handleAvatarUpload = async () => {
    if (!selectedAvatarFile) {
      setAvatarUploadError('Please select an image to upload.');
      return;
    }

    setUploadingAvatar(true);
    setAvatarUploadError(null);

    const formData = new FormData();
    formData.append('avatar', selectedAvatarFile); // 'avatar' must match the field name in multer.single('avatar')

    try {
      const response = await API.post('/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Crucial for file uploads
        },
      });
      console.log('Avatar upload response:', response.data);
      // Update userProfile state with new avatar URL
      setUserProfile(prevProfile => ({
        ...prevProfile,
        avatar: response.data.avatar // Backend sends back the new avatar URL
      }));
      // Also update localStorage user data for sidebar consistency
      const updatedUserInStorage = { ...JSON.parse(localStorage.getItem('user')), avatar: response.data.avatar };
      localStorage.setItem('user', JSON.stringify(updatedUserInStorage));

      setSelectedAvatarFile(null); // Clear selected file
      if(avatarFileInputRef.current) avatarFileInputRef.current.value = ''; // Clear file input
      Swal.fire({ icon: 'success', title: 'Success', text: 'Avatar updated successfully!' });
    } catch (err) {
      console.error('Error uploading avatar:', err);
      const errorMessage = err.response?.data?.message || 'Failed to upload avatar. Please try again.';
      setAvatarUploadError(errorMessage);
    } finally {
      setUploadingAvatar(false);
    }
  };


  // NEW FUNCTION: Handle getting AI suggestions
  const handleGetSuggestions = async () => {
    setSuggestionsLoading(true);
    setSuggestionsError(null);
    setAiSuggestions(null); // Clear previous suggestions

    try {
      // Use the *current* userProfile's skills and interests, as they are up-to-date after fetch
      const payload = {
        skills: userProfile?.skills || [], // Use optional chaining
        interests: userProfile?.interests || [] // Use optional chaining
      };

      const response = await API.post('/ai/get-suggestions', payload);
      setAiSuggestions(response.data.suggestions);
    } catch (err) {
      console.error('Error getting AI suggestions:', err);
      setSuggestionsError(err.response?.data?.message || 'Failed to get suggestions. Please try again.');
    } finally {
      setSuggestionsLoading(false);
    }
  };


  if (loading) {
    return <div style={styles.container}>Loading profile...</div>;
  }

  if (error) {
    return <div style={styles.container}><p style={styles.errorText}>{error}</p></div>;
  }

  if (!userProfile) {
    return <div style={styles.container}>No user profile found.</div>;
  }

  // Determine which avatar URL to display (selected file preview > current profile avatar > default)
  const displayAvatarUrl = selectedAvatarFile
    ? URL.createObjectURL(selectedAvatarFile) // Show preview of newly selected file
    : userProfile.avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';


  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>User Profile</h2>

      {!isEditing ? (
        // Display Mode
        <div style={styles.profileDisplay}>
          <img src={userProfile.avatar} alt="User Avatar" style={styles.avatarDisplay} />
          <p><strong>Name:</strong> {userProfile.name}</p>
          <p><strong>Email:</strong> {userProfile.email}</p> {/* Email is not editable by design */}
          <p><strong>Role:</strong> {userProfile.role}</p>

          <div style={styles.section}>
            <h3>Skills</h3>
            {/* Check userProfile.skills for null/undefined before accessing length */}
            {(userProfile.skills && userProfile.skills.length > 0) ? (
              <ul style={styles.list}>
                {userProfile.skills.map((skill, index) => (
                  <li key={index} style={styles.listItem}>
                    {skill.name} ({skill.level}) {skill.verified && '✅'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No skills added yet.</p>
            )}
          </div>

          <div style={styles.section}>
            <h3>Interests</h3>
            {/* Check userProfile.interests for null/undefined before accessing length */}
            {(userProfile.interests && userProfile.interests.length > 0) ? (
              <ul style={styles.list}>
                {userProfile.interests.map((interest, index) => (
                  <li key={index} style={styles.listItem}>{interest}</li>
                ))}
              </ul>
            ) : (
              <p>No interests added yet.</p>
            )}
          </div>
          <button onClick={() => setIsEditing(true)} style={styles.editButton}>Edit Profile</button>

          {/* NEW SECTION: AI Suggestions */}
          <div style={styles.section}>
            <h3>AI-Powered Suggestions</h3>
            <button
              onClick={handleGetSuggestions}
              // Use optional chaining with nullish coalescing to safely check length
              style={{
                ...styles.getSuggestionsButton,
                ...(suggestionsLoading || ((userProfile?.skills?.length || 0) === 0 && (userProfile?.interests?.length || 0) === 0) ? styles.buttonDisabled : {})
              }}
              disabled={suggestionsLoading || ((userProfile?.skills?.length || 0) === 0 && (userProfile?.interests?.length || 0) === 0)}
            >
              {suggestionsLoading ? 'Generating...' : 'Get Suggestions'}
            </button>

            {suggestionsError && <p style={styles.errorText}>{suggestionsError}</p>}

            {aiSuggestions && (
              <div style={styles.suggestionsOutput}>
                <pre style={styles.preformattedText}>{aiSuggestions}</pre>
                {/* You might want to parse this into a more structured display later */}
              </div>
            )}
            {!aiSuggestions && !suggestionsLoading && !suggestionsError && (
                <p style={styles.noteText}>Add your skills and interests to get personalized AI suggestions!</p>
            )}
          </div>
        </div>
      ) : (
        // Edit Mode
        <form onSubmit={handleUpdateProfile} style={styles.profileForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Name:</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          {/* NEW AVATAR UPLOAD SECTION */}
          <div style={styles.avatarUploadSection}>
            <label style={styles.label}>Current/New Avatar:</label>
            <div style={styles.avatarPreviewContainer}>
              <img src={displayAvatarUrl} alt="Avatar Preview" style={styles.avatarPreview} />
              {selectedAvatarFile && <p style={styles.selectedFileName}>{selectedAvatarFile.name}</p>}
            </div>
            
            <input
              type="file"
              accept="image/*"
              ref={avatarFileInputRef}
              onChange={handleAvatarFileChange}
              style={{ display: 'none' }} // Hide default input
              disabled={uploadingAvatar}
            />
            <button
              type="button"
              onClick={() => avatarFileInputRef.current.click()} // Trigger hidden input
              style={{ ...styles.uploadButton, ...styles.selectFileButton, ...(uploadingAvatar ? styles.buttonDisabled : {}) }}
              disabled={uploadingAvatar}
            >
              {selectedAvatarFile ? 'Change File' : 'Select New Avatar'}
            </button>

            {selectedAvatarFile && (
              <button
                type="button"
                onClick={handleAvatarUpload}
                style={{ ...styles.uploadButton, ...(uploadingAvatar ? styles.buttonDisabled : {}) }}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
              </button>
            )}
            {avatarUploadError && <p style={styles.errorText}>{avatarUploadError}</p>}
          </div>


          <div style={styles.section}>
            <h3>Skills:</h3>
            <div style={styles.skillInputGroup}>
              <input
                type="text"
                placeholder="New skill name"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                style={styles.input}
              />
              <select
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(e.target.value)}
                style={styles.select}
              >
                {skillLevels.map(level => (
                  <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                ))}
              </select>
              <button type="button" onClick={handleAddSkill} style={styles.addButton}>Add Skill</button>
            </div>
            <ul style={styles.list}>
              {editedSkills.map((skill, index) => (
                <li key={index} style={styles.editableListItem}>
                  <input
                    type="text"
                    value={skill.name}
                    onChange={(e) => {
                      const newSkills = [...editedSkills];
                      newSkills[index].name = e.target.value;
                      setEditedSkills(newSkills);
                    }}
                    style={styles.smallInput}
                  />
                  <select
                    value={skill.level}
                    onChange={(e) => handleSkillLevelChange(e, index)}
                    style={styles.smallSelect}
                  >
                    {skillLevels.map(level => (
                      <option key={level} value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => handleRemoveSkill(index)} style={styles.removeButton}>Remove</button>
                </li>
              ))}
            </ul>
          </div>

          <div style={styles.section}>
            <h3>Interests:</h3>
            {editedInterests.map((interest, index) => (
              <div key={index} style={styles.interestInputGroup}>
                <input
                  type="text"
                  value={interest}
                  onChange={(e) => handleInterestChange(e, index)}
                  style={styles.input}
                />
                <button type="button" onClick={() => removeInterestInput(index)} style={styles.removeButton}>Remove</button>
              </div>
            ))}
            <button type="button" onClick={addInterestInput} style={styles.addButton}>Add Interest</button>
          </div>

          <div style={styles.formActions}>
            <button type="submit" style={styles.saveButton} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={async () => {
              const result = await Swal.fire({
                title: 'Discard changes?',
                text: 'Are you sure you want to discard your changes?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, discard',
                cancelButtonText: 'No, keep editing'
              });
              if (!result.isConfirmed) return;
              setIsEditing(false);
              setSelectedAvatarFile(null); // Clear selected file when canceling
              setAvatarUploadError(null); // Clear avatar upload errors
              fetchUserProfile(); // Re-fetch original profile to reset state
            }} style={styles.cancelButton}>Cancel</button>
          </div>
        </form>
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
    fontFamily: 'Arial, sans-serif',
    color: '#1e293b',
  },
  heading: {
    fontSize: '28px',
    color: '#1e293b',
    marginBottom: '30px',
    textAlign: 'center',
  },
  profileDisplay: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  avatarDisplay: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #4f46e5',
    marginBottom: '10px',
  },
  section: {
    width: '100%',
    marginTop: '20px',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '20px',
  },
  list: {
    listStyleType: 'none',
    padding: 0,
    margin: '10px 0 0 0',
  },
  listItem: {
    backgroundColor: '#f1f5f9',
    padding: '10px 15px',
    borderRadius: '6px',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '15px',
  },
  editButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
  },
  profileForm: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    maxWidth: '600px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#334155',
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    '&:focus': {
      borderColor: '#4f46e5',
      outline: 'none',
      boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    },
  },
  select: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: 'white',
  },
  avatarPreview: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginTop: '10px',
    border: '2px solid #a78bfa',
    alignSelf: 'center',
  },
  skillInputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  smallInput: {
    flex: '1',
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
  },
  smallSelect: {
    padding: '8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    backgroundColor: 'white',
  },
  addButton: {
    padding: '8px 15px',
    backgroundColor: '#22c55e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#16a34a',
    },
  },
  removeButton: {
    padding: '8px 15px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#dc2626',
    },
  },
  editableListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f1f5f9',
    padding: '8px 15px',
    borderRadius: '6px',
    marginBottom: '8px',
  },
  interestInputGroup: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    marginTop: '20px',
  },
  saveButton: {
    padding: '10px 20px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#4338ca',
    },
    '&:disabled': {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#cbd5e1',
    color: '#334155',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: '#a2aab8',
    },
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
  },
  // NEW STYLES FOR AI SUGGESTIONS
  getSuggestionsButton: {
    padding: '10px 20px',
    backgroundColor: '#0ea5e9', // Blue color
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
    transition: 'background-color 0.2s ease',
    // Removed &:hover - handle conditionally if needed
  },
  suggestionsOutput: {
    backgroundColor: '#f8fafc',
    padding: '15px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginTop: '15px',
    whiteSpace: 'pre-wrap', // Ensures text wraps but preserves formatting
    wordBreak: 'break-word',
  },
  preformattedText: {
    fontFamily: 'inherit', // Use page's font
    margin: 0,
    fontSize: '15px',
    lineHeight: '1.6',
  },
  noteText: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '10px',
    textAlign: 'center',
  },
  // NEW STYLES FOR AVATAR UPLOAD SECTION
  avatarUploadSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center', // Center content horizontally
    gap: '10px',
    marginBottom: '20px',
    padding: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
  },
  avatarPreviewContainer: {
    position: 'relative',
    width: '120px',
    height: '120px',
    marginBottom: '10px',
  },
  selectedFileName: {
    fontSize: '13px',
    color: '#475569',
    textAlign: 'center',
    wordBreak: 'break-all',
  },
  uploadButton: {
    padding: '10px 15px',
    backgroundColor: '#6366f1', // Indigo color for upload actions
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
    // Removed &:hover - handle conditionally if needed
  },
  selectFileButton: {
    backgroundColor: '#3b82f6', // Blue for selecting file
    // Removed &:hover - handle conditionally if needed
  },
  // Generic disabled style applied conditionally
  buttonDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    backgroundColor: '#a78bfa', // Lighter indigo when disabled (specific to uploadButton)
    // For getSuggestionsButton, it will take the color from getSuggestionsButton and opacity/cursor from here.
    // If you need distinct disabled colors for different buttons, you'd apply them separately.
  }
};

export default Profile;
