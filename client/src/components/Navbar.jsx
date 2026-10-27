import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Shield, Users, LogOut, ChevronDown, Check, Sparkles, FileText, Wifi } from 'lucide-react';

export default function Navbar({ onOpenKnowledgeBase, onOpenDocs }) {
  const { user, author, isSocketConnected, demoAccounts, quickSwitch, logout, isAdmin } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  return (
    <header className="top-navbar">
      <div className="brand-section">
        <div className="brand-logo-icon">🍃</div>
        <div className="brand-title-wrap">
          <h1>BookLeaf Publishing</h1>
          <span className="brand-subtitle">Author Support & Operations Portal</span>
        </div>
      </div>

      <div className="nav-actions">
        {/* Real-time Socket Indicator */}
        <div className="socket-status-badge" title="Live bidirectional updates via WebSockets">
          <span className="live-dot" />
          <span>{isSocketConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
        </div>

        {/* API Docs Button */}
        <a
          href="/api/docs"
          target="_blank"
          rel="noreferrer"
          className="demo-account-pill"
          title="Interactive API Documentation"
        >
          <FileText size={14} />
          <span>API Docs</span>
        </a>

        {/* Knowledge Base Modal Button */}
        <button
          className="demo-account-pill"
          onClick={onOpenKnowledgeBase}
          title="View Ground Truth BookLeaf Policies"
        >
          <BookOpen size={14} />
          <span>Knowledge Base</span>
        </button>

        {/* Evaluator Quick Role Switcher */}
        <div style={{ position: 'relative' }}>
          <button
            className="demo-account-pill"
            style={{ borderColor: isAdmin ? 'var(--amber-400)' : 'var(--emerald-400)' }}
            onClick={() => setShowSwitchMenu(!showSwitchMenu)}
          >
            {isAdmin ? <Shield size={14} color="#f59e0b" /> : <Users size={14} color="#10b981" />}
            <span style={{ fontWeight: 600 }}>{user ? user.name : 'Select Account'}</span>
            <span className={`role-badge ${isAdmin ? 'admin' : 'author'}`}>
              {isAdmin ? 'Admin' : 'Author'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showSwitchMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '320px',
                background: 'var(--white)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid var(--slate-200)',
                zIndex: 100,
                color: 'var(--slate-800)',
                padding: '0.75rem',
                maxHeight: '440px',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--slate-400)',
                  textTransform: 'uppercase',
                  padding: '0.4rem 0.6rem',
                  borderBottom: '1px solid var(--slate-100)',
                  marginBottom: '0.5rem'
                }}
              >
                1-Click Account Switcher (Evaluator Mode)
              </div>

              {demoAccounts.map((acc) => {
                const isActive = user?.email?.toLowerCase() === acc.email.toLowerCase();
                return (
                  <div
                    key={acc.id}
                    onClick={() => {
                      quickSwitch(acc.email);
                      setShowSwitchMenu(false);
                    }}
                    style={{
                      padding: '0.55rem 0.65rem',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: isActive ? 'var(--emerald-50)' : 'transparent',
                      marginBottom: '0.25rem',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'var(--slate-100)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--slate-900)' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                        {acc.email} {acc.city ? `• ${acc.city}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span className={`role-badge ${acc.role === 'admin' ? 'admin' : 'author'}`}>
                        {acc.role}
                      </span>
                      {isActive && <Check size={14} color="#059669" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className="btn-ghost"
          style={{ padding: '0.4rem 0.6rem', color: 'var(--slate-300)' }}
          onClick={logout}
          title="Sign out of current account"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
