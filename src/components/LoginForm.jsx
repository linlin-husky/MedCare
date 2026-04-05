import { useState } from 'react';
import { validateUsername } from '../utils/helpers.js';
import libraryBooksIcon from '../assets/icons/library-books.svg';
import handshakeIcon from '../assets/icons/handshake.svg';
import starFilledIcon from '../assets/icons/star-filled.svg';
import './LoginForm.css';

function LoginForm({ onLogin, onSwitchToRegister, error, success }) {
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState([]);

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validateUsername(username);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    onLogin(username);
  }

  function handleUsernameChange(e) {
    setUsername(e.target.value);
    if (errors.length > 0) {
      setErrors([]);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Home Medical Care</h1>
          <p className="auth-subtitle">Your Social Lending Community</p>
        </div>

        {success && (
          <div className="success-banner">
            {success}
          </div>
        )}

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Welcome Back</h2>

          <div className="form-group">
            <label htmlFor="login-username" className="form-label">Username</label>
            <input
              type="text"
              id="login-username"
              className="form-input"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              autoComplete="username"
            />
            {errors.length > 0 && (
              <ul className="field-errors">
                {errors.map((error, index) => (
                  <li key={index} className="field-error">{error}</li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="auth-button">
            Sign In
          </button>

          <p className="auth-switch">
            New to Home Medical Care?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToRegister}
            >
              Create an account
            </button>
          </p>
        </form>

        <div className="auth-features">
          <h3 className="features-title">Why Home Medical Care?</h3>
          <ul className="features-list">
            <li className="feature-item">
              <span className="feature-icon"><img src={libraryBooksIcon} alt="" className="feature-svg" /></span>
              <span>Complete Family Care, One Simple System</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon"><img src={handshakeIcon} alt="" className="feature-svg" /></span>
              <span>You Health Data, Your Home, Your Control</span>
            </li>
            <li className="feature-item">
              <span className="feature-icon"><img src={starFilledIcon} alt="" className="feature-svg" /></span>
              <span>Make private healthcare   affordable for every family</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
