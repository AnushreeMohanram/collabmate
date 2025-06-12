import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  const navigate = useNavigate(); // useNavigate from react-router-dom

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Please enter a valid email address.';
    return '';
  };

  const validatePassword = (value) => {
    if (!value.trim()) return 'Password is required.';
    if (value.length < 6) return 'Password must be at least 6 characters.';
    return '';
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setEmailError(validateEmail(e.target.value));
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setPasswordError(validatePassword(e.target.value));
  };

  const isFormValid = () => {
    return !validateEmail(email) && !validatePassword(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);
    setEmailError(emailErr);
    setPasswordError(passwordErr);
    if (emailErr || passwordErr) return;

    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      const data = res.data;

      // Store user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('email', data.user.email);
      localStorage.setItem('name', data.user.name);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Navigate based on role
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard/projects');
      }
    } catch (err) {
      console.error('Network error:', err);
      setFormError(err.response?.data?.message || 'Network error. Please try again later.');
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
    },
    navbar: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '20px 40px',
      borderBottom: '1px solid #eee',
    },
    logo: {
      fontWeight: '600',
      fontSize: '22px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    navLinks: {
      display: 'flex',
      gap: '30px',
      fontSize: '16px',
      color: '#333',
    },
    container: {
      maxWidth: '400px',
      margin: '60px auto',
    },
    title: {
      fontSize: '32px',
      fontWeight: '600',
      marginBottom: '30px',
    },
    label: {
      fontSize: '15px',
      fontWeight: '500',
      marginBottom: '5px',
      display: 'block',
    },
    inputWrapper: {
      position: 'relative',
      marginBottom: '5px',
    },
    input: {
      width: '100%',
      padding: '12px 40px 12px 12px',
      borderRadius: '8px',
      border: '1px solid #ccc',
      fontSize: '15px',
      outline: 'none',
      transition: 'border-color 0.2s ease',
    },
    inputError: {
      borderColor: '#dc2626',
    },
    toggleButton: {
      position: 'absolute',
      right: '-40px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '18px',
      color: '#666',
      padding: 0,
      lineHeight: 1,
    },
    errorText: {
      color: '#dc2626',
      fontSize: '13px',
      marginBottom: '15px',
      fontWeight: '500',
    },
    button: {
      width: '114%',
      padding: '12px',
      backgroundColor: '#2563eb',
      color: '#fff',
      fontSize: '16px',
      fontWeight: '500',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      marginTop: '10px',
      opacity: 1,
      transition: 'background-color 0.3s ease',
    },
    buttonDisabled: {
      backgroundColor: '#94a3b8',
      cursor: 'not-allowed',
    },
    footerText: {
      textAlign: 'center',
      marginTop: '15px',
      fontSize: '14px',
      color: '#333',
    },
    link: {
      color: '#2563eb',
      marginLeft: '4px',
      textDecoration: 'none',
      fontWeight: '500',
    },
    formError: {
      color: '#dc2626',
      fontWeight: '600',
      marginBottom: '15px',
      textAlign: 'center',
    },
  };

  return (
    <div style={styles.page}>
      <header style={styles.navbar}>
        <div style={styles.logo}>
          <span style={{ fontSize: '22px' }}>👥</span> CollabMate
        </div>
        <nav style={styles.navLinks}>
          <a href="/projects">Projects</a>
          <a href="/about">About</a>
        </nav>
      </header>

      <div style={styles.container}>
        <h1 style={styles.title}>Log in</h1>

        <form onSubmit={handleSubmit} noValidate>
          <label style={styles.label} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            style={{
              ...styles.input,
              ...(emailError ? styles.inputError : {}),
            }}
            value={email}
            onChange={handleEmailChange}
            disabled={loading}
            aria-describedby="email-error"
            aria-invalid={!!emailError}
          />
          {emailError && <div id="email-error" style={styles.errorText}>{emailError}</div>}

          <label style={styles.label} htmlFor="password">Password</label>
          <div style={styles.inputWrapper}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              style={{
                ...styles.input,
                ...(passwordError ? styles.inputError : {}),
              }}
              value={password}
              onChange={handlePasswordChange}
              disabled={loading}
              aria-describedby="password-error"
              aria-invalid={!!passwordError}
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
          {passwordError && <div id="password-error" style={styles.errorText}>{passwordError}</div>}

          {formError && <div style={styles.formError}>{formError}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading || !isFormValid() ? styles.buttonDisabled : {}),
            }}
            disabled={loading || !isFormValid()}
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?
          <a href="/register" style={styles.link}>Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
