import React, { useState } from 'react';
import { Label } from '@radix-ui/react-label';
import { Link, useNavigate } from 'react-router-dom';
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import logo from '../assets/Logo.png';
import googleIcon from '../assets/icons8-google-48.png';
import '../styles/Login.css';
import { supabase } from '../services/supabase-client';
import bcrypt from 'bcryptjs';
import Toast from '../components/Toast';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: userData, error } = await supabase
      .from('users')
      .select(`
        id,
        user_email,
        password,
        status_id,
        role_id,
        emp_id,
        created_at,
        email_verified,
        verification_token,
        user_status (
          status_name
        ),
        roles (
          role_name
        )
      `)
      .eq('user_email', email)
      .single();

    if (error || !userData) { 
      setToastMessage('Invalid email or password.');
      setToastVariant('error');
      setIsToastOpen(true);
      return;
    }

    if (userData.status_id !== 2) {
      setToastMessage('Your account is not active. Please contact support.');
      setToastVariant('error');
      setIsToastOpen(true);
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, userData.password);
    if (!isPasswordValid) {
      setToastMessage('Invalid email or password.');
      setToastVariant('error');
      setIsToastOpen(true);
      return;
    }

    const userSession = {
      user_email: userData.user_email,
      status_id: userData.status_id,
      role_id: userData.role_id,
      emp_id: userData.emp_id,
      id: userData.id
    };
    localStorage.setItem('userSession', JSON.stringify(userSession));

    setToastMessage('Login successful! Redirecting...');
    setToastVariant('success');
    setIsToastOpen(true);

    setTimeout(() => {
      if (userData.role_id === 1) {
        navigate('/human-resources/dashboard');
      } else if (userData.role_id === 2) {
        navigate('/dashboard-employee');
      } else {
        navigate('/human-resources/dashboard');
      }
    }, 2000);
  };

  const handleToastClose = () => {
    setIsToastOpen(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Form Section */}
        <div className="login-form-section">
          <div className="login-form-header">
            <img src={logo} alt="SugboWorks Logo" className="login-form-logo" />
            <span className="login-form-brand">SugboWorks</span>
          </div>
          <div className="login-form-container">
            <h2 className="login-heading">Welcome Back</h2>
            <p className="login-subheading">
              Don't have an account? <Link to="/register" className="login-link">Sign up</Link>
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="login-field">
                <Label htmlFor="email" className="login-label">
                  Email
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="Enter your email"
                />
              </div>

              <div className="login-field">
                <Label htmlFor="password" className="login-label">
                  Password
                </Label>
                <div className="password-input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="login-input"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <div className="login-remember">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="login-checkbox"
                  />
                  <Label htmlFor="remember-me" className="login-checkbox-label">
                    Remember me
                  </Label>
                </div>
                <div className="login-forgot">
                  <a href="#" className="login-link">
                    Forgot your password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="login-button"
                >
                  Sign in
                </button>
              </div>

              <div className="login-or-section">
                <div className="login-or">or</div>
                <button
                  type="button"
                  className="login-google-btn"
                >
                  <img src={googleIcon} alt="Google" className="google-logo" />
                  Continue with Google
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Image Section */}
        <div className="login-image-section">
          <Link to="/" className="login-back-button">
            Back to website →
          </Link>
          <div className="login-image-wrapper">
            <img src="/assets/image1.jpg" alt="HRIS Platform" className="login-hero-image" />
          </div>
        </div>
      </div>

      <Toast
        isOpen={isToastOpen}
        onClose={handleToastClose}
        message={toastMessage}
        variant={toastVariant}
      />
    </div>
  );
};

export default LoginPage;
