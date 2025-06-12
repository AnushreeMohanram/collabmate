import { useState } from 'react';

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

    if (nErr || eErr || pErr) return;

    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })  // 👈 no role sent here
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.message || "Error registering. Please try again.");
      } else {
        alert("Registered successfully! Please log in.");
        window.location.href = "/";
      }
    } catch (err) {
      console.error("Registration failed:", err);
      setFormError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    page: {
      fontFamily: 'sans-serif',
      backgroundColor: '#fff',
      height: '100vh',
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
      marginBottom: '10px',
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
      opacity: 0.6,
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
