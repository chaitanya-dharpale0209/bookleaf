import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Shield, Users, LogOut, ChevronDown, Check, Sparkles, FileText, Menu, X } from 'lucide-react';
import { getApiUrl } from '../config/api';

export default function Navbar({ onOpenKnowledgeBase, onOpenDocs }) {
  const { user, author, isSocketConnected, demoAccounts, quickSwitch, logout, isAdmin } = useAuth();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="top-navbar">
      <div className="navbar-main-row">
        {/* Brand Logo & Name */}
        <div className="brand-section">
          <div className="brand-logo-icon">🍃</div>
          <div className="brand-title-wrap">
            <h1>BookLeaf Publishing</h1>
            <span className="brand-subtitle">Author Support & Operations Portal</span>
          </div>
        </div>

        {/* Desktop Actions (Screens >= 860px) */}
        <div className="nav-actions nav-actions-desktop">
          {/* Real-time Socket Indicator */}
          <div className="socket-status-badge" title="Live bidirectional updates via WebSockets">
            <span className="live-dot" />
            <span>{isSocketConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
          </div>

          {/* API Docs Button */}
          <a
            href={getApiUrl('/api/docs')}
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
              title="Switch demo user or role"
            >
              {isAdmin ? <Shield size={14} color="#f59e0b" /> : <Users size={14} color="#10b981" />}
              <span className="account-pill-name">{user ? user.name : 'Select Account'}</span>
              <span className={`role-badge ${isAdmin ? 'admin' : 'author'}`}>
                {isAdmin ? 'Admin' : 'Author'}
              </span>
              <ChevronDown size={14} />
            </button>

            {showSwitchMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowSwitchMenu(false)}
                />
                <div className="role-switcher-dropdown" style={{ zIndex: 100 }}>
                  <div className="role-dropdown-header">
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
                        className={`role-dropdown-item ${isActive ? 'active' : ''}`}
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
              </>
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

        {/* Mobile Navigation Bar (Screens < 860px) */}
        <div className="nav-actions-mobile">
          {/* Compact Socket Dot */}
          <div
            className="socket-status-badge compact"
            title={isSocketConnected ? 'Real-Time Sync Connected' : 'Connecting...'}
          >
            <span className="live-dot" />
            <span className="socket-mobile-text">{isSocketConnected ? 'Live' : '...'}</span>
          </div>

          {/* Compact Role Switcher */}
          <div style={{ position: 'relative' }}>
            <button
              className="demo-account-pill compact-role-pill"
              style={{ borderColor: isAdmin ? 'var(--amber-400)' : 'var(--emerald-400)' }}
              onClick={() => setShowSwitchMenu(!showSwitchMenu)}
              title="Switch demo account"
            >
              {isAdmin ? <Shield size={13} color="#f59e0b" /> : <Users size={13} color="#10b981" />}
              <span className={`role-badge ${isAdmin ? 'admin' : 'author'}`}>
                {isAdmin ? 'Admin' : 'Author'}
              </span>
              <ChevronDown size={12} />
            </button>

            {showSwitchMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  onClick={() => setShowSwitchMenu(false)}
                />
                <div className="role-switcher-dropdown" style={{ zIndex: 100 }}>
                  <div className="role-dropdown-header">
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
                        className={`role-dropdown-item ${isActive ? 'active' : ''}`}
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
              </>
            )}
          </div>

          {/* Hamburger Menu Toggle */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            title="Navigation Menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation (Expands on toggle) */}
      {mobileMenuOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              top: '56px',
              zIndex: 40,
              background: 'rgba(15, 23, 42, 0.55)',
              WebkitBackdropFilter: 'blur(2px)',
              backdropFilter: 'blur(2px)'
            }}
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="mobile-nav-drawer" style={{ position: 'relative', zIndex: 45 }}>
            <div className="mobile-nav-user-info">
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.15rem' }}>
              {user?.email} •{' '}
              <span className={`role-badge ${isAdmin ? 'admin' : 'author'}`}>
                {isAdmin ? 'Admin' : 'Author'}
              </span>
            </div>
          </div>

          <div className="mobile-nav-links">
            <a
              href={getApiUrl('/api/docs')}
              target="_blank"
              rel="noreferrer"
              className="mobile-nav-item"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FileText size={16} color="var(--emerald-400)" />
              <span>Interactive API Docs</span>
            </a>

            <button
              className="mobile-nav-item"
              onClick={() => {
                onOpenKnowledgeBase();
                setMobileMenuOpen(false);
              }}
            >
              <BookOpen size={16} color="var(--emerald-400)" />
              <span>Knowledge Base Policies</span>
            </button>

            <button
              className="mobile-nav-item"
              onClick={() => {
                setShowSwitchMenu(true);
                setMobileMenuOpen(false);
              }}
            >
              <Users size={16} color="var(--amber-400)" />
              <span>Switch Account ({demoAccounts.length} Demo Profiles)</span>
            </button>

            <button
              className="mobile-nav-item logout"
              onClick={() => {
                setMobileMenuOpen(false);
                logout();
              }}
            >
              <LogOut size={16} color="#ef4444" />
              <span style={{ color: '#f87171' }}>Sign Out</span>
            </button>
          </div>
        </div>
        </>
      )}
    </header>
  );
}
