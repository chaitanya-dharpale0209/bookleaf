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
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
        padding: '1.5rem',
        color: 'var(--white)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '500px',
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              background: 'linear-gradient(135deg, var(--emerald-500), var(--emerald-700))',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              margin: '0 auto 1rem',
              boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)'
            }}
          >
            🍃
          </div>
          <h2 style={{ fontSize: '1.65rem', color: '#fff', fontWeight: 800 }}>BookLeaf Publishing</h2>
          <p style={{ color: 'var(--slate-400)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Author Support & Operations Communication Portal
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#fca5a5',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1.25rem'
            }}
          >
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
              className="form-control"
              placeholder="e.g. priya.sharma@email.com or admin@bookleaf.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.15)'
              }}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--slate-300)' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.15)'
              }}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Portal'} <ArrowRight size={16} />
          </button>
        </form>

        {/* 1-Click Demo Login Shortcuts */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--slate-400)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              fontWeight: 700,
              textAlign: 'center',
              marginBottom: '0.85rem'
            }}
          >
            ⚡ Quick Evaluator Demo Logins
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(245, 158, 11, 0.12)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
                color: '#fbbf24'
              }}
              onClick={() => handleQuickLogin('admin@bookleaf.com', 'admin123')}
            >
              <Shield size={13} /> Ops Admin Portal
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
                color: '#34d399'
              }}
              onClick={() => handleQuickLogin('priya.sharma@email.com', 'author123')}
            >
              <User size={13} /> Priya Sharma (Author)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(59, 130, 246, 0.12)',
                borderColor: 'rgba(59, 130, 246, 0.3)',
                color: '#60a5fa'
              }}
              onClick={() => handleQuickLogin('rohit.kapoor@email.com', 'author123')}
            >
              <User size={13} /> Rohit Kapoor (Author)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                background: 'rgba(168, 85, 247, 0.12)',
                borderColor: 'rgba(168, 85, 247, 0.3)',
                color: '#c084fc'
              }}
              onClick={() => handleQuickLogin('sneha.kulkarni@email.com', 'author123')}
            >
              <User size={13} /> Sneha K. (In Prod.)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
