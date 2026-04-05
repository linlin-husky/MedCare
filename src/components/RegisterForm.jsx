import { useState } from 'react';
import { validateUsername, validateEmail, validatePhone } from '../utils/helpers.js';
import ErrorMessage from './ErrorMessage.jsx';
import './LoginForm.css';

function RegisterForm({ onRegister, onSwitchToLogin, error, success }) {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    email: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});

  function validateForm() {
    const newErrors = {};

    const usernameErrors = validateUsername(formData.username);
    if (usernameErrors.length > 0) {
      newErrors.username = usernameErrors;
    }

    if (formData.email) {
      const emailErrors = validateEmail(formData.email);
      if (emailErrors.length > 0) {
        newErrors.email = emailErrors;
      }
    }

    if (formData.phone) {
      const phoneErrors = validatePhone(formData.phone);
      if (phoneErrors.length > 0) {
        newErrors.phone = phoneErrors;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onRegister(formData);
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-title">Home Medical Care</h1>
          <p className="auth-subtitle">Join the Medical Care Community</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="form-title">Create Account</h2>

          {error && <ErrorMessage message={error} />}
          {success && (
            <div className="success-banner">
              {success}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="register-username" className="form-label">
              Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="register-username"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Choose a username"
              autoComplete="username"
            />
            {errors.username && (
              <ul className="field-errors">
                {errors.username.map((error, index) => (
                  <li key={index} className="field-error">{error}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="register-displayName" className="form-label">
              Display Name
            </label>
            <input
              type="text"
              id="register-displayName"
              name="displayName"
              className="form-input"
              value={formData.displayName}
              onChange={handleInputChange}
              placeholder="How should we call you?"
              autoComplete="name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="register-email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              autoComplete="email"
            />
            {errors.email && (
              <ul className="field-errors">
                {errors.email.map((error, index) => (
                  <li key={index} className="field-error">{error}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="register-phone" className="form-label">
              Phone
            </label>
            <input
              type="tel"
              id="register-phone"
              name="phone"
              className="form-input"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Your phone number (e.g., 123-456-7890)"
              autoComplete="tel"
            />
            {errors.phone && (
              <ul className="field-errors">
                {errors.phone.map((error, index) => (
                  <li key={index} className="field-error">{error}</li>
                ))}
              </ul>
            )}
          </div>

          <button type="submit" className="auth-button">
            Create Account
          </button>

          <p className="auth-switch">
            Already have an account?{' '}
            <button
              type="button"
              className="link-button"
              onClick={onSwitchToLogin}
            >
              Sign in
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterForm;
