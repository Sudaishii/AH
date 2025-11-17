import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase-client';
import { validatePassword } from '../utils/validation';
import logo from '../assets/Logo.png';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import '../styles/Auth.css';

const AuthPage = ({ view = 'sign_in' }) => {
  const navigate = useNavigate();
  const isSignIn = view === 'sign_in';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setMessage(passwordValidation.error);
      return;
    }

    setLoading(true);

    try {
      if (isSignIn) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // Redirect handled by auth state change listener
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for the confirmation link!');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (error) {
      setMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-form-container">
          {/* Logo Section */}
          <div className="auth-logo-section">
            <img src={logo} alt="SugboWorks Logo" className="auth-logo" />
            <h2 className="auth-heading">{isSignIn ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="auth-subheading">{isSignIn ? 'Sign in to your account' : 'Sign up to get started'}</p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleEmailAuth} className="auth-form">
            <div className="space-y-4">
              <div className="auth-field">
                <Label htmlFor="email" className="auth-label">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your email"
                  className="auth-input"
                />
              </div>
              <div className="auth-field">
                <Label htmlFor="password" className="auth-label">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    const validation = validatePassword(e.target.value);
                    setPasswordError(validation.isValid ? '' : validation.error);
                  }}
                  required
                  placeholder="Enter your password"
                  className="auth-input"
                />
                {passwordError && (
                  <div className="error-message">
                    {passwordError}
                  </div>
                )}
              </div>
            </div>

            {message && (
              <div className="error-message">
                {message}
              </div>
            )}

            <Button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Loading...' : (isSignIn ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>

          {/* Or Continue with Google */}
          <div className="auth-or-section">
            <div className="auth-or">or</div>
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="auth-google-btn"
            >
              <span className="google-logo">G</span>
              Continue with Google
            </button>
          </div>

          {/* Toggle between sign in and sign up */}
          <div className="auth-signup">
            <p className="auth-signup-text">
              {isSignIn ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                onClick={() => navigate(isSignIn ? '/register' : '/login')}
                className="auth-link"
              >
                {isSignIn ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Back to Home */}
          <div className="auth-back-home">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="auth-link"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
