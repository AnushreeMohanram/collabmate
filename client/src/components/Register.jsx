import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation error states
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState(''); // This will display backend errors or general form errors

  const navigate = useNavigate();

  const validateName = (value) => {
    if (!value.trim()) return 'Name is required.';
    if (value.trim().length < 2) return 'Name must be at least 2 characters.';
    return '';
  };

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters.';
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter.';
    if (!/[a-z]/.test(value)) return 'Password must include at least one lowercase letter.';
    if (!/[0-9]/.test(value)) return 'Password must include at least one number.';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must include at least one special character.';
    return '';
  };

  const handleNameChange = (e) => {
    setName(e.target.value);
    setNameError(validateName(e.target.value));
    setFormError(''); // Clear form-level error on input change
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
    setFormError(''); // Clear form-level error on input change
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
    setFormError(''); // Clear form-level error on input change
  };

  const isFormValid = () => {
    return (
      !validateName(name) &&
      !validateEmail(email) &&
      !validatePassword(password)
    );
  };

  const handleRegister = async () => {
    setFormError(''); // Clear previous form-level errors before new attempt
    
    // Run all validations again before submitting
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (nErr || eErr || pErr) {
      // If client-side validation fails, set a generic form error if specific ones aren't enough
      if (!nErr && !eErr && !pErr) { // Only set if specific errors are clear but form is somehow invalid
        setFormError('Please fill out all fields correctly.');
      }
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting registration with:', { name, email, password: '***' });
      const res = await API.post('/auth/register', { name, email, password });
      console.log('Registration response:', res.data);

      if (res.data.token) {
        // Store user data
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user)); // Store the full user object
        console.log('User data stored in localStorage');
        navigate('/dashboard/projects'); // Redirect to dashboard
      } else {
        // This case should ideally not happen if backend sends token, but good fallback
        throw new Error('Registration successful but no token received.');
      }
    } catch (err) {
      console.error("Registration failed:", err);
      // More robust error message extraction from Axios error response
      const errorMessage = 
        err.response?.data?.message || // For "User already exists" or other specific messages
        err.response?.data?.error ||   // For other errors where backend might use 'error' field
        "Something went wrong. Please try again later."; // Generic fallback

      setFormError(errorMessage); // Display the extracted error message
      
      // Also log details to console for debugging
      console.error("Full error details for debugging:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      fontFamily: 'sans-serif',
      backgroundColor: '#fff',
      minHeight: '100vh',
      margin: 0,
      display: 'flex', // Add flex to center content vertically
      flexDirection: 'column',
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      borderBottom: '1px solid #eee',
      backgroundColor: '#f8fafc', // Added a light background for clarity
    },
    logo: {
      fontWeight: '600',
      fontSize: '22px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#1e293b', // Darker color for logo text
    },
    navLinks: {
      display: 'flex',
      gap: '30px',
      fontSize: '16px',
    },
    container: {
      maxWidth: '400px',
      margin: '60px auto', // Centered with margin
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)', // Stronger shadow
      boxSizing: 'border-box',
      flexShrink: 0, // Prevent shrinking when content is too tall
    },
    title: {
      fontSize: '32px',
      fontWeight: '700', // Slightly bolder title
      marginBottom: '30px',
      color: '#1e293b', // Darker title color
      textAlign: 'center',
    },
    label: {
      fontSize: '15px',
      fontWeight: '600', // Bolder label
      marginBottom: '5px',
      display: 'block',
      color: '#334155', // Slightly darker label color
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: '15px', // Increased margin for better spacing
    },
    input: {
      width: '100%',
      padding: '12px 40px 12px 12px', // Right padding for toggle button
      borderRadius: '8px', // More rounded corners
      border: '1px solid #cbd5e1', // Lighter border
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxSizing: 'border-box',
      '&:focus': {
        borderColor: '#4f46e5', // Primary brand color on focus
        boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.15)', // Soft shadow on focus
      },
    },
    inputError: {
      borderColor: '#ef4444', // Red border for error
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)', // Red shadow for error
    },
    toggleButton: {
      position: 'absolute',
      right: '10px', // Adjusted position
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#64748b', // Neutral color for icon
      padding: '5px', // Added padding for easier click
      lineHeight: 1,
    },
    errorText: {
      color: '#ef4444',
      fontSize: '13px',
      marginTop: '5px', // Adjusted margin
      marginBottom: '10px', // Adjusted margin
      fontWeight: '500',
    },
    button: {
      width: '100%',
      padding: '14px', // Slightly larger button
      backgroundColor: '#4f46e5', // Primary brand color
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600', // Bolder text
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '25px', // More margin at top
      transition: 'background-color 0.3s ease, transform 0.1s ease',
      '&:hover': {
        backgroundColor: '#4338ca', // Darker shade on hover
        transform: 'translateY(-1px)', // Slight lift effect
      },
    },
    buttonDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
      opacity: 0.7, // More visible disabled state
      transform: 'none', // No lift effect when disabled
    },
    footerText: {
      textAlign: 'center',
      marginTop: '20px', // More margin at top
      fontSize: '14px',
      color: '#475569', // Darker text
    },
    link: {
      color: '#4f46e5', // Primary brand color for link
      marginLeft: '4px',
      textDecoration: 'none',
      fontWeight: '600', // Bolder link text
      '&:hover': {
        textDecoration: 'underline',
      },
    },
    formError: {
      color: '#ef4444',
      fontWeight: '600',
      marginBottom: '15px',
      textAlign: 'center',
      padding: '8px',
      backgroundColor: '#fee2e2', // Light red background for error message
      borderRadius: '6px',
      border: '1px solid #fca5a5',
    },
    passwordRequirements: {
      marginTop: '15px', // Increased margin
      fontSize: '12px',
      color: '#475569',
      padding: '10px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px', // More rounded
      border: '1px solid #e2e8f0',
    },
    requirement: {
      marginBottom: '6px', // Increased margin
      display: 'flex',
      alignItems: 'center',
      gap: '8px', // Increased gap
    },
    requirementMet: {
      color: '#10b981', // Green for met requirements
    },
    requirementUnmet: {
      color: '#64748b', // Gray for unmet requirements
    },
  };

  const passwordRequirements = [
    { text: 'At least 6 characters', met: password.length >= 6 },
    { text: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'At least one lowercase letter', met: /[a-z]/.test(password) },
    { text: 'At least one number', met: /[0-9]/.test(password) },
    { text: 'At least one special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div style={styles.logo}>
          <span style={{ fontSize: '22px' }}>👥</span> CollabMate
        </div>
        <nav style={styles.navLinks}>
          <a href="/projects" style={{textDecoration: 'none', color: 'inherit'}}>Projects</a> {/* Added styles for consistency */}
          <a href="/about" style={{textDecoration: 'none', color: 'inherit'}}>About</a>
        </nav>
      </header>

      <div style={styles.container}>
        <h1 style={styles.title}>Sign Up</h1>

        <label style={styles.label} htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          placeholder="Your Name"
          style={{ ...styles.input, ...(nameError ? styles.inputError : {}) }}
          value={name}
          onChange={handleNameChange}
          disabled={loading}
        />
        {nameError && <div style={styles.errorText}>{nameError}</div>}

        <label style={styles.label} htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          style={{ ...styles.input, ...(emailError ? styles.inputError : {}) }}
          value={email}
          onChange={handleEmailChange}
          disabled={loading}
        />
        {emailError && <div style={styles.errorText}>{emailError}</div>}

        <label style={styles.label} htmlFor="password">Password</label>
        <div style={styles.inputWrapper}>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            style={{ ...styles.input, ...(passwordError ? styles.inputError : {}) }}
            value={password}
            onChange={handlePasswordChange}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            style={styles.toggleButton}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {passwordError && <div style={styles.errorText}>{passwordError}</div>}

        <div style={styles.passwordRequirements}>
          <div style={{ marginBottom: '8px', fontWeight: '500' }}>Password Requirements:</div>
          {passwordRequirements.map((req, index) => (
            <div
              key={index}
              style={{
                ...styles.requirement,
                ...(req.met ? styles.requirementMet : styles.requirementUnmet),
              }}
            >
              {req.met ? '✓' : '○'} {req.text}
            </div>
          ))}
        </div>

        {formError && <div style={styles.formError}>{formError}</div>}

        <button
          style={{
            ...styles.button,
            ...(loading || !isFormValid() ? styles.buttonDisabled : {}),
          }}
          onClick={handleRegister}
          disabled={loading || !isFormValid()}
        >
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>

        <p style={styles.footerText}>
          Already have an account?
          <a href="/" style={styles.link}>Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Register;
