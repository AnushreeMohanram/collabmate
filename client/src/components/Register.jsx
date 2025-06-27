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
  const [formError, setFormError] = useState(''); 
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
    setFormError('');
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
    setFormError(''); 
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
    setFormError(''); 
  };

  const isFormValid = () => {
    return (
      !validateName(name) &&
      !validateEmail(email) &&
      !validatePassword(password)
    );
  };

  const handleRegister = async () => {
    setFormError(''); 
    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);

    if (nErr || eErr || pErr) {
      
      if (!nErr && !eErr && !pErr) { 
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
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user)); 
        console.log('User data stored in localStorage');
        navigate('/dashboard/projects'); 
      } else {
        throw new Error('Registration successful but no token received.');
      }
    } catch (err) {
      console.error("Registration failed:", err);
      const errorMessage = 
        err.response?.data?.message || 
        err.response?.data?.error ||   
        "Something went wrong. Please try again later."; 

      setFormError(errorMessage);
      
      
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
      fontFamily: 'Inter, sans-serif',
      background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
      minHeight: '100vh',
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      borderBottom: '1px solid #eee',
      backgroundColor: 'rgba(248,250,252,0.95)',
      boxShadow: '0 2px 8px rgba(79,70,229,0.04)',
      backdropFilter: 'blur(2px)',
    },
    logo: {
      fontWeight: '700',
      fontSize: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#4f46e5',
      letterSpacing: '1px',
    },
    navLinks: {
      display: 'flex',
      gap: '30px',
      fontSize: '16px',
    },
    container: {
      maxWidth: '420px',
      margin: '60px auto',
      padding: '32px 28px',
      backgroundColor: '#fff',
      borderRadius: '18px',
      boxShadow: '0 8px 32px rgba(79,70,229,0.10)',
      border: '1.5px solid #e0e7ff',
      boxSizing: 'border-box',
      flexShrink: 0,
    },
    title: {
      fontSize: '32px',
      fontWeight: '700', 
      marginBottom: '30px',
      color: '#1e293b', 
      textAlign: 'center',
    },
    label: {
      fontSize: '15px',
      fontWeight: '600', 
      marginBottom: '5px',
      display: 'block',
      color: '#334155', 
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: '15px', 
    },
    input: {
      width: '100%',
      padding: '12px 40px 12px 12px', 
      borderRadius: '8px', 
      border: '1px solid #cbd5e1', 
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      boxSizing: 'border-box',
      '&:focus': {
        borderColor: '#4f46e5', 
        boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.15)', 
      },
    },
    inputError: {
      borderColor: '#ef4444', 
      boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.15)', 
    },
    toggleButton: {
      position: 'absolute',
      right: '10px', 
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#64748b', 
      padding: '5px', 
      lineHeight: 1,
    },
    errorText: {
      color: '#ef4444',
      fontSize: '13px',
      marginTop: '5px', 
      marginBottom: '10px', 
      fontWeight: '500',
    },
    button: {
      width: '100%',
      padding: '15px',
      background: 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
      color: '#fff',
      fontSize: '17px',
      fontWeight: '700',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '28px',
      transition: 'background 0.2s, transform 0.1s',
      boxShadow: '0 2px 8px rgba(79,70,229,0.08)',
    },
    buttonDisabled: {
      background: '#c7d2fe',
      cursor: 'not-allowed',
      opacity: 0.7,
      transform: 'none',
    },
    footerText: {
      textAlign: 'center',
      marginTop: '20px', 
      fontSize: '14px',
      color: '#475569', 
    },
    link: {
      color: '#4f46e5', 
      marginLeft: '4px',
      textDecoration: 'none',
      fontWeight: '600', 
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
      backgroundColor: '#fee2e2', 
      borderRadius: '6px',
      border: '1px solid #fca5a5',
    },
    passwordRequirements: {
      marginTop: '15px',
      fontSize: '12px',
      color: '#475569',
      padding: '10px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px', 
      border: '1px solid #e2e8f0',
    },
    requirement: {
      marginBottom: '6px', 
      display: 'flex',
      alignItems: 'center',
      gap: '8px', 
    },
    requirementMet: {
      color: '#10b981', 
    },
    requirementUnmet: {
      color: '#64748b', 
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
