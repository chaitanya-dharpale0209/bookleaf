import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, User, Lock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';

export default function LoginModal() {
  const { login, quickSwitch, demoAccounts } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setError(null);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError(null);
    setIsLoading(true);
    try {
      await login(demoEmail, demoPassword);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">
        {/* Brand Header */}
        <div className="login-brand-header">
          <div className="login-brand-icon">
            🍃
          </div>
          <h2>BookLeaf Publishing</h2>
          <p>
            Author Support & Operations Communication Portal
          </p>
        </div>

        {error && (
          <div className="login-error-alert">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--slate-300)' }}>
              Email Address
            </label>
            <input
              type="email"
              className="form-control login-input"
              placeholder="e.g. priya.sharma@email.com or admin@bookleaf.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--slate-300)' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control login-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary login-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts */}
        <div className="login-demo-section">
          <div className="login-demo-title">
            ⚡ Quick Evaluator Demo Logins
          </div>

          <div className="login-demo-grid">
            <button
              type="button"
              className="btn btn-secondary btn-sm login-demo-btn admin"
              onClick={() => handleQuickLogin('admin@bookleaf.com', 'admin123')}
            >
              <Shield size={14} /> <span>Ops Admin Portal</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm login-demo-btn author"
              onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
            >
              <User size={14} /> <span>Priya Sharma (Author)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm login-demo-btn author-blue"
              onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'author123')}
            >
              <User size={14} /> <span>Rohit Kapoor (Author)</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm login-demo-btn author-purple"
              onClick={() => handleQuickLogin('sneha.kulkarni@email.com', 'author123')}
            >
              <User size={14} /> <span>Sneha K. (In Prod.)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
