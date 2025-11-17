import React, { useState, useEffect } from 'react';
import { Label } from '@radix-ui/react-label';
import { Link, useNavigate } from 'react-router-dom';
import { EyeOpenIcon, EyeClosedIcon } from '@radix-ui/react-icons';
import logo from '../assets/Logo.png';
import '../styles/Register.css';
import { supabase } from '../services/supabase-client';
import * as validation from '../utils/validation';
import bcrypt from 'bcryptjs';
import Toast from '../components/Toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [shakeFields, setShakeFields] = useState({});
  const [isToastOpen, setIsToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');

  const hasErrors = Object.keys(errors).some(key => errors[key] && key !== 'general');

  useEffect(() => {
    document.title = 'Register - SugboWorks HRIS';
  }, []);

  useEffect(() => {
    if (!email) {
      setErrors((prev) => ({ ...prev, email: null }));
      setShakeFields((prev) => ({ ...prev, email: false }));
      return;
    }

    const timer = setTimeout(async () => {
      const result = await validation.existingEmail(email);
      if (!result.isValid) {
        setErrors((prev) => ({ ...prev, email: result.error }));
        setShakeFields((prev) => ({ ...prev, email: true }));
        setTimeout(() => setShakeFields((prev) => ({ ...prev, email: false })), 500);
      } else {
        setErrors((prev) => ({ ...prev, email: null }));
        setShakeFields((prev) => ({ ...prev, email: false }));
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [email]);

  useEffect(() => {
    if (confirmPassword === '') {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
      setShakeFields((prev) => ({ ...prev, confirmPassword: false }));
      return;
    }

    if (confirmPassword !== password) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      setShakeFields((prev) => ({ ...prev, confirmPassword: true }));
      setTimeout(() => setShakeFields((prev) => ({ ...prev, confirmPassword: false })), 500);
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: null }));
      setShakeFields((prev) => ({ ...prev, confirmPassword: false }));
    }
  }, [confirmPassword, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setErrors({});
    setShakeFields({});

    const hasErrors = Object.keys(errors).some(key => errors[key] && key !== 'general');
    if (hasErrors) {
      const fieldsToShake = {};
      Object.keys(errors).forEach(key => {
        if (errors[key] && key !== 'general') {
          fieldsToShake[key] = true;
        }
      });
      setShakeFields(fieldsToShake);
      setTimeout(() => setShakeFields({}), 500);
      return;
    }

    const emailResult = validation.validateEmail(email);
    if (!emailResult.isValid) {
      setErrors({ email: emailResult.error });
      setShakeFields({ email: true });
      setTimeout(() => setShakeFields({}), 500);
      return;
    }

    const passwordResult = validation.validatePassword(password);
    if (!passwordResult.isValid) {
      setErrors({ password: passwordResult.error });
      setShakeFields({ password: true });
      setTimeout(() => setShakeFields({}), 500);
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setShakeFields({ confirmPassword: true });
      setTimeout(() => setShakeFields({}), 500);
      return;
    }

    if (!agreeTerms) {
      setErrors({ agreeTerms: 'Please agree to the terms and conditions' });
      setShakeFields({ agreeTerms: true });
      setTimeout(() => setShakeFields({}), 500);
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { error } = await supabase
      .from('users')
      .insert([
        {
          user_email: email,
          password: hashedPassword,
          status_id: 2,
          role_id: 2,
          emp_id: null,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      setToastMessage('Registration failed. Please try again.');
      setToastVariant('error');
      setIsToastOpen(true);
      return;
    }

    setToastMessage('You are now registered!');
    setToastVariant('success');
    setIsToastOpen(true);

    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgreeTerms(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setErrors({});
    setShakeFields({});

    setTimeout(() => {
      navigate('/login');
    }, 2000);
  };

  const handleToastClose = () => {
    setIsToastOpen(false);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Left Side - Form Section */}
        <div className="register-form-section">
          <div className="register-form-header">
            <img src={logo} alt="SugboWorks Logo" className="register-form-logo" />
            <span className="register-form-brand">SugboWorks</span>
          </div>
          <div className="register-form-container">
            <h2 className="register-heading">Create an account</h2>
            <p className="register-subheading">
              Already have an account? <Link to="/login" className="register-link">Log in</Link>
            </p>

            <form className="register-form" onSubmit={handleSubmit}>
              <div className={`register-field ${shakeFields.email ? 'shake' : ''}`}>
                <Label htmlFor="email" className="register-label">
                  Email address
                </Label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="register-input"
                  placeholder="Enter your email"
                />
                {errors.email && <p className="error-message">{errors.email}</p>}
              </div>

              <div className={`register-field ${shakeFields.password ? 'shake' : ''}`}>
                <Label htmlFor="password" className="register-label">
                  Password
                </Label>
                <div className="password-input-container">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (e.target.value === '') {
                        setErrors((prev) => ({ ...prev, password: null }));
                      } else {
                        const result = validation.validatePassword(e.target.value);
                        setErrors((prev) => ({ ...prev, password: result.isValid ? null : result.error }));
                      }
                    }}
                    className="register-input"
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
                {errors.password && <p className="error-message">{errors.password}</p>}
              </div>

              <div className={`register-field ${shakeFields.confirmPassword ? 'shake' : ''}`}>
                <Label htmlFor="confirm-password" className="register-label">
                  Confirm Password
                </Label>
                <div className="password-input-container">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="register-input"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
              </div>

              <div className={`register-options ${shakeFields.agreeTerms ? 'shake' : ''}`}>
                <div className="register-remember">
                  <input
                    id="agree-terms"
                    name="agree-terms"
                    type="checkbox"
                    required
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="register-checkbox"
                  />
                  <Label htmlFor="agree-terms" className="register-checkbox-label">
                    I agree to the <a href="#" className="register-link">Terms and Conditions</a>
                  </Label>
                </div>
                {errors.agreeTerms && <p className="error-message">{errors.agreeTerms}</p>}
              </div>

              <div>
                <button
                  type="submit"
                  className="register-button"
                  disabled={hasErrors}
                >
                  Sign up
                </button>
                {errors.general && <p className="error-message">{errors.general}</p>}
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Image Section */}
        <div className="register-image-section">
          <Link to="/" className="register-back-button">
            Back to website →
          </Link>
          <div className="register-image-wrapper">
            <img src="/assets/image2.jpg" alt="HRIS Platform" className="register-hero-image" />
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

export default RegisterPage;
