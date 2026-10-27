import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import {
  Shield,
  Filter,
  Search,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Send,
  RefreshCw,
  UserCheck,
  FileText,
  Lock,
  ChevronRight,
  X,
  ExternalLink,
  SlidersHorizontal,
  Bot
} from 'lucide-react';

const CATEGORIES = [
  'All',
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry'
];

const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUSES = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

export default function AdminDashboard() {
  const { user, token, socket } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [aiStatus, setAiStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [sortBy, setSortBy] = useState('urgency'); // 'urgency' | 'oldest' | 'newest'
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution Workbench State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [isWorkbenchLoading, setIsWorkbenchLoading] = useState(false);
  const [workbenchTab, setWorkbenchTab] = useState('conversation'); // 'conversation' | 'details' (responsive view)

  // AI Response Drafter State
  const [draftResponseText, setDraftResponseText] = useState('');
  const [isRegeneratingDraft, setIsRegeneratingDraft] = useState(false);
  const [isSendingResponse, setIsSendingResponse] = useState(false);

  // Internal Note State
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Load Admin Queue and Operations Metrics
  const fetchTicketsAndMetrics = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      // Build Query String
      const params = new URLSearchParams();
      if (selectedStatus !== 'All') params.append('status', selectedStatus);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      if (selectedPriority !== 'All') params.append('priority', selectedPriority);
      if (sortBy) params.append('sortBy', sortBy);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const [ticketsRes, metricsRes, aiStatusRes] = await Promise.all([
        fetch(getApiUrl(`/api/tickets?${params.toString()}`), { headers }),
        fetch(getApiUrl('/api/admin/metrics'), { headers }),
        fetch(getApiUrl('/api/admin/ai-status'), { headers })
      ]);

      const [ticketsData, metricsData, aiStatusData] = await Promise.all([
        ticketsRes.json(),
        metricsRes.json(),
        aiStatusRes.json()
      ]);

      if (ticketsData.success) setTickets(ticketsData.data);
      if (metricsData.success) setMetrics(metricsData.data);
      if (aiStatusData.success) setAiStatus(aiStatusData.data);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchTicketsAndMetrics();
    }
  }, [token, selectedStatus, selectedCategory, selectedPriority, sortBy, searchQuery]);

  // Real-Time Socket Listeners for Admin
  useEffect(() => {
    if (!socket) return;

    const handleTicketCreated = (newTicket) => {
      // Add or update ticket in queue
      setTickets((prev) => [newTicket, ...prev]);
      // Update metrics
      setMetrics((prev) =>
        prev
          ? {
              ...prev,
              totals: { ...prev.totals, tickets: prev.totals.tickets + 1 }
            }
          : prev
      );
    };

    const handleTicketUpdated = (updatedTicket) => {
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === updatedTicket.ticket_id ? { ...t, ...updatedTicket } : t))
      );

      if (selectedTicketId === updatedTicket.ticket_id) {
        setTicketDetails((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, ...updatedTicket } } : prev));
      }
    };

    const handleMessageCreated = ({ ticketId, message }) => {
      // If currently open in workbench, append message
      if (selectedTicketId === ticketId) {
        setTicketDetails((prev) => {
          if (!prev) return prev;
          const exists = prev.messages.some((m) => m.message_id === message.message_id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...prev.messages, message]
          };
        });
      }

      // Update message count in queue
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === ticketId ? { ...t, message_count: (t.message_count || 0) + 1 } : t))
      );
    };

    const handleNoteCreated = ({ ticketId, note }) => {
      if (selectedTicketId === ticketId) {
        setTicketDetails((prev) => {
          if (!prev) return prev;
          const exists = prev.notes?.some((n) => n.note_id === note.note_id);
          if (exists) return prev;
          return {
            ...prev,
            notes: [note, ...(prev.notes || [])]
          };
        });
      }
    };

    socket.on('ticket:created', handleTicketCreated);
    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('message:created', handleMessageCreated);
    socket.on('note:created', handleNoteCreated);

    return () => {
      socket.off('ticket:created', handleTicketCreated);
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('message:created', handleMessageCreated);
      socket.off('note:created', handleNoteCreated);
    };
  }, [socket, selectedTicketId]);

  // Open Ticket in Resolution Workbench
  const openTicketWorkbench = async (ticketId) => {
    setSelectedTicketId(ticketId);
    setWorkbenchTab('conversation');
    setIsWorkbenchLoading(true);

    try {
      const res = await fetch(getApiUrl(`/api/tickets/${ticketId}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setTicketDetails(data.data);
        // Pre-fill editable draft with AI draft response if present
        setDraftResponseText(data.data.ticket.ai_draft_response || '');
      }
    } catch (err) {
      console.error('Error opening workbench:', err);
    } finally {
      setIsWorkbenchLoading(false);
    }
  };

  // Admin Override Category / Priority / Status / Assignee
  const handleUpdateTicketField = async (fields) => {
    if (!selectedTicketId) return;

    try {
      const res = await fetch(getApiUrl(`/api/tickets/${selectedTicketId}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(fields)
      });
      const data = await res.json();
      if (data.success) {
        setTicketDetails((prev) => (prev ? { ...prev, ticket: data.data } : prev));
      }
    } catch (err) {
      alert('Failed to update ticket: ' + err.message);
    }
  };

  // Re-generate AI Draft
  const handleRegenerateAiDraft = async () => {
    if (!selectedTicketId) return;
    setIsRegeneratingDraft(true);

    try {
      const res = await fetch(getApiUrl(`/api/tickets/${selectedTicketId}/regenerate-ai`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setDraftResponseText(data.data.ai_draft_response);
      }
    } catch (err) {
      alert('AI draft regeneration failed: ' + err.message);
    } finally {
      setIsRegeneratingDraft(false);
    }
  };

  // Send Admin Response (Grounded in Draft)
  const handleSendAdminResponse = async (e) => {
    e.preventDefault();
    if (!draftResponseText.trim() || !selectedTicketId) return;

    setIsSendingResponse(true);
    try {
      const res = await fetch(getApiUrl(`/api/tickets/${selectedTicketId}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: draftResponseText.trim(),
          is_ai_drafted: 1
        })
      });
      const data = await res.json();
      if (data.success) {
        // Clear draft box or keep ready for follow-up
        setDraftResponseText('');
      }
    } catch (err) {
      alert('Failed to send response: ' + err.message);
    } finally {
      setIsSendingResponse(false);
    }
  };

  // Add Internal Note
  const handleAddInternalNote = async (e) => {
    e.preventDefault();
    if (!internalNoteText.trim() || !selectedTicketId) return;

    setIsAddingNote(true);
    try {
      const res = await fetch(getApiUrl(`/api/tickets/${selectedTicketId}/notes`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: internalNoteText.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setInternalNoteText('');
      }
    } catch (err) {
      alert('Failed to add note: ' + err.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="app-container">
      {/* Admin Top Header */}
      <div className="page-header-row">
        <div>
          <h2>Operations Ticket Queue</h2>
          <p>
            AI-Assisted Author Support Desk • Logged in as <strong>{user?.name}</strong> (Operations Lead)
          </p>
        </div>

        <div className="page-header-actions">
          {/* Active AI Engine Badge */}
          <div
            style={{
              background: '#f1f5f9',
              border: '1px solid var(--slate-300)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.78rem'
            }}
          >
            <Bot size={15} color="#4f46e5" />
            <span>AI Engine:</span>
            <strong style={{ color: '#4338ca' }}>{aiStatus?.activeProvider || 'Knowledge Base Calibrated'}</strong>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={fetchTicketsAndMetrics}>
            <RefreshCw size={14} /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      {metrics && (
        <div className="stats-grid">
          <div className="stat-card accent-rose">
            <div className="stat-header">
              <span>Urgent Attention Required</span>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div className="stat-value" style={{ color: '#b91c1c' }}>
              {metrics.totals.urgent}
            </div>
            <div className="stat-subtext">Critical & High priority issues prioritized at top</div>
          </div>

          <div className="stat-card accent-amber">
            <div className="stat-header">
              <span>Unresolved Backlog</span>
              <Clock size={18} color="var(--amber-500)" />
            </div>
            <div className="stat-value">
              {metrics.statusBreakdown.Open + metrics.statusBreakdown['In Progress']}
            </div>
            <div className="stat-subtext">
              {metrics.statusBreakdown.Open} Open • {metrics.statusBreakdown['In Progress']} In Progress
            </div>
          </div>

          <div className="stat-card accent-emerald">
            <div className="stat-header">
              <span>Resolved Cases</span>
              <CheckCircle2 size={18} color="var(--emerald-600)" />
            </div>
            <div className="stat-value">{metrics.statusBreakdown.Resolved + metrics.statusBreakdown.Closed}</div>
            <div className="stat-subtext">
              {metrics.statusBreakdown.Resolved} resolved • {metrics.statusBreakdown.Closed} closed
            </div>
          </div>

          <div className="stat-card accent-blue">
            <div className="stat-header">
              <span>AI Classification Accuracy</span>
              <Sparkles size={18} color="#6366f1" />
            </div>
            <div className="stat-value" style={{ color: '#4f46e5' }}>
              {metrics.aiPerformance.categoryAccuracyPercent}%
            </div>
            <div className="stat-subtext">
              {metrics.aiPerformance.categoryOverrides} overrides out of {metrics.aiPerformance.totalAnalyzed} tickets
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="filter-bar">
        <div className="filter-group">
          {/* Live Search */}
          <div className="search-input-wrap">
            <Search className="search-icon" size={15} />
            <input
              type="text"
              placeholder="Search by ID, author, book, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <select
            className="select-control"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUSES.filter((s) => s !== 'All').map((s) => (
              <option key={s} value={s}>
                Status: {s}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            className="select-control"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.filter((c) => c !== 'All').map((c) => (
              <option key={c} value={c}>
                Category: {c}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            className="select-control"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            {PRIORITIES.filter((p) => p !== 'All').map((p) => (
              <option key={p} value={p}>
                Priority: {p}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Controls */}
        <div className="filter-group sort-group">
          <span style={{ fontSize: '0.82rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            Sort Queue:
          </span>
          <select
            className="select-control"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="urgency">⚡ Urgency First (Critical & Oldest Unresolved)</option>
            <option value="oldest">⏳ Oldest Unresolved First</option>
            <option value="newest">🆕 Newest First</option>
          </select>
        </div>
      </div>

      {/* Tickets Queue Table */}
      <div className="tickets-table-container">
        <div className="table-scroll-hint">
          <SlidersHorizontal size={13} />
          <span>Swipe or scroll horizontally to view all ticket data & actions →</span>
        </div>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--slate-500)' }}>
            <RefreshCw size={24} className="spin-animation" style={{ margin: '0 auto 0.5rem' }} />
            Loading operations queue...
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem' }}>
            <CheckCircle2 size={40} color="var(--emerald-500)" style={{ margin: '0 auto 0.5rem' }} />
            <h3>No Tickets Found</h3>
            <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              No incoming tickets match your active filter criteria.
            </p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Ticket ID</th>
                <th>Author</th>
                <th>Book Context</th>
                <th>Category (AI)</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Assigned</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => {
                const isCriticalOrHigh = t.priority === 'Critical' || t.priority === 'High';
                return (
                  <tr
                    key={t.ticket_id}
                    className="clickable-row"
                    onClick={() => openTicketWorkbench(t.ticket_id)}
                    style={{
                      background:
                        t.priority === 'Critical' && t.status !== 'Resolved'
                          ? 'rgba(254, 242, 242, 0.45)'
                          : undefined
                    }}
                  >
                    <td>
                      <span className={`badge-priority ${t.priority}`}>
                        {isCriticalOrHigh && <AlertTriangle size={12} />}
                        {t.priority}
                      </span>
                      {t.priority_override ? (
                        <span className="ai-tag" style={{ color: '#d97706', borderColor: '#fde68a' }}>
                          Overridden
                        </span>
                      ) : null}
                    </td>

                    <td>
                      <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate-900)' }}>
                        {t.ticket_id}
                      </strong>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{t.author_name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--slate-500)' }}>
                        {t.author_email} {t.author_city ? `• ${t.author_city}` : ''}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                        {t.book_title || 'General / Account'}
                      </div>
                      {t.book_isbn && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--slate-500)', fontFamily: 'var(--font-mono)' }}>
                          {t.book_isbn}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="badge-category">{t.category}</span>
                      {t.category_override ? (
                        <span className="ai-tag" style={{ color: '#d97706', borderColor: '#fde68a' }}>
                          Manual
                        </span>
                      ) : (
                        <span className="ai-tag">
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </td>

                    <td style={{ maxWidth: '280px' }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: 'var(--slate-900)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t.subject}
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--slate-500)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {t.description}
                      </div>
                    </td>

                    <td>
                      <span className={`badge-status ${t.status.replace(/\s+/g, '-')}`}>{t.status}</span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {t.assigned_to ? (
                        <span style={{ fontWeight: 500, color: 'var(--slate-800)' }}>{t.assigned_to}</span>
                      ) : (
                        <span style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    <td>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openTicketWorkbench(t.ticket_id);
                        }}
                      >
                        Workbench <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* TICKET RESOLUTION WORKBENCH MODAL */}
      {selectedTicketId && ticketDetails && (
        <div className="workbench-modal-backdrop" onClick={() => setSelectedTicketId(null)}>
          <div className="workbench-card" onClick={(e) => e.stopPropagation()}>
            {/* Workbench Top Bar */}
            <div className="workbench-header">
              <div className="workbench-title-group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--emerald-700)',
                      color: '#fff',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem'
                    }}
                  >
                    {ticketDetails.ticket.ticket_id}
                  </span>
                  <h3>{ticketDetails.ticket.subject}</h3>
                </div>
                <p>
                  Raised by <strong>{ticketDetails.ticket.author_name}</strong> on{' '}
                  {new Date(ticketDetails.ticket.created_at).toLocaleString('en-IN')}
                </p>
              </div>

              <div className="workbench-header-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleUpdateTicketField({ assigned_to: user?.name })}
                  title="Assign this ticket to yourself"
                >
                  <UserCheck size={14} /> <span className="btn-label-text">Assign to Me</span>
                </button>
                <button
                  className="btn-ghost modal-close-btn"
                  style={{ color: '#fff' }}
                  onClick={() => setSelectedTicketId(null)}
                  aria-label="Close resolution workbench"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Mobile View Switcher Tab Navigation (hidden on desktop) */}
            <div className="workbench-mobile-nav">
              <button
                type="button"
                className={`workbench-mobile-nav-btn ${workbenchTab === 'conversation' ? 'active' : ''}`}
                onClick={() => setWorkbenchTab('conversation')}
              >
                <Bot size={15} /> <span>Chat & AI Drafter</span>
              </button>
              <button
                type="button"
                className={`workbench-mobile-nav-btn ${workbenchTab === 'details' ? 'active' : ''}`}
                onClick={() => setWorkbenchTab('details')}
              >
                <SlidersHorizontal size={15} /> <span>Controls, Author & Notes</span>
              </button>
            </div>

            {/* Workbench Split Body */}
            <div className="workbench-body">
              {/* Left Column: Author Context, Financials & Controls */}
              <div className={`workbench-sidebar ${workbenchTab === 'details' ? 'mobile-visible' : 'mobile-hidden'}`}>
                {/* 1. Ticket Controls: Status, Category Override, Priority Override */}
                <div>
                  <div className="sidebar-section-title">Ticket Controls & Overrides</div>

                  {/* Status Dropdown */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      Status
                    </label>
                    <select
                      className="select-control"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      value={ticketDetails.ticket.status}
                      onChange={(e) => handleUpdateTicketField({ status: e.target.value })}
                    >
                      {STATUSES.filter((s) => s !== 'All').map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Override */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                        Category
                      </label>
                      {ticketDetails.ticket.category_override ? (
                        <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>
                          Admin Overridden
                        </span>
                      ) : (
                        <span className="ai-tag">
                          <Sparkles size={10} /> AI Classified
                        </span>
                      )}
                    </div>
                    <select
                      className="select-control"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      value={ticketDetails.ticket.category}
                      onChange={(e) => handleUpdateTicketField({ category: e.target.value })}
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Override */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                        Priority Score
                      </label>
                      {ticketDetails.ticket.priority_override ? (
                        <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700 }}>
                          Admin Overridden
                        </span>
                      ) : (
                        <span className="ai-tag">
                          <Sparkles size={10} /> AI Scored
                        </span>
                      )}
                    </div>
                    <select
                      className="select-control"
                      style={{ width: '100%', marginTop: '0.25rem' }}
                      value={ticketDetails.ticket.priority}
                      onChange={(e) => handleUpdateTicketField({ priority: e.target.value })}
                    >
                      {PRIORITIES.filter((p) => p !== 'All').map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 2. Author Profile Context */}
                <div>
                  <div className="sidebar-section-title">Author Profile</div>
                  <div className="context-card">
                    <div className="context-row">
                      <span>Name:</span>
                      <strong>{ticketDetails.ticket.author_name}</strong>
                    </div>
                    <div className="context-row">
                      <span>Email:</span>
                      <strong>{ticketDetails.ticket.author_email}</strong>
                    </div>
                    {ticketDetails.ticket.author_phone && (
                      <div className="context-row">
                        <span>Phone:</span>
                        <strong>{ticketDetails.ticket.author_phone}</strong>
                      </div>
                    )}
                    {ticketDetails.ticket.author_city && (
                      <div className="context-row">
                        <span>City:</span>
                        <strong>{ticketDetails.ticket.author_city}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Related Book & Financial Context */}
                {ticketDetails.ticket.book_title ? (
                  <div>
                    <div className="sidebar-section-title">Book & Royalty Data</div>
                    <div className="context-card">
                      <div className="context-row">
                        <span>Title:</span>
                        <strong>{ticketDetails.ticket.book_title}</strong>
                      </div>
                      <div className="context-row">
                        <span>ISBN:</span>
                        <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {ticketDetails.ticket.book_isbn || 'Pending'}
                        </strong>
                      </div>
                      <div className="context-row">
                        <span>Status:</span>
                        <strong>{ticketDetails.ticket.book_status}</strong>
                      </div>
                      <div className="context-row">
                        <span>Copies Sold:</span>
                        <strong>{ticketDetails.ticket.book_copies_sold} copies</strong>
                      </div>
                      <div className="context-row">
                        <span>Lifetime Royalty:</span>
                        <strong style={{ color: 'var(--emerald-700)' }}>
                          ₹{(ticketDetails.ticket.book_royalty_earned || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      <div className="context-row">
                        <span>Pending Royalty:</span>
                        <strong style={{ color: 'var(--amber-600)' }}>
                          ₹{(ticketDetails.ticket.book_royalty_pending || 0).toLocaleString('en-IN')}
                        </strong>
                      </div>
                      {ticketDetails.ticket.book_last_payout && (
                        <div className="context-row">
                          <span>Last Payout:</span>
                          <strong>{ticketDetails.ticket.book_last_payout}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="sidebar-section-title">Book Context</div>
                    <div className="context-card" style={{ color: 'var(--slate-500)' }}>
                      General / Account-level query (No single book specified).
                    </div>
                  </div>
                )}

                {/* 4. Internal Notes (Admin-Only) */}
                <div>
                  <div className="sidebar-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Lock size={12} color="#a16207" /> Internal Operations Notes (Confidential)
                  </div>

                  <form onSubmit={handleAddInternalNote} style={{ marginBottom: '0.75rem' }}>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Add private note for ops team..."
                      value={internalNoteText}
                      onChange={(e) => setInternalNoteText(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary btn-sm"
                      style={{ marginTop: '0.35rem', width: '100%' }}
                      disabled={isAddingNote || !internalNoteText.trim()}
                    >
                      {isAddingNote ? 'Saving Note...' : 'Add Internal Note'}
                    </button>
                  </form>

                  <div className="internal-notes-feed">
                    {ticketDetails.notes?.length === 0 ? (
                      <div style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                        No internal notes recorded yet.
                      </div>
                    ) : (
                      ticketDetails.notes?.map((n) => (
                        <div key={n.note_id} className="note-item">
                          <div className="note-meta">
                            <span>{n.admin_name}</span>
                            <span>{new Date(n.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div>{n.content}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Live Conversation + AI-Assisted Response Drafter */}
              <div className={`workbench-main ${workbenchTab === 'conversation' ? 'mobile-visible' : 'mobile-hidden'}`}>
                {/* Conversation Thread */}
                <div className="messages-thread">
                  {ticketDetails.messages.map((m) => {
                    const isAuthor = m.sender_role === 'author';
                    return (
                      <div
                        key={m.message_id}
                        className={`message-bubble ${isAuthor ? 'author-message' : 'admin-message'}`}
                      >
                        <div className="message-meta">
                          <strong>
                            {m.sender_name} ({isAuthor ? 'Author' : 'BookLeaf Operations'})
                          </strong>
                          <span>
                            {new Date(m.created_at).toLocaleString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="message-content">{m.content}</div>
                      </div>
                    );
                  })}
                </div>

                {/* AI-Assisted Response Generator Box */}
                <div className="ai-draft-box">
                  <div className="ai-draft-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span className="ai-badge-chip">
                        <Sparkles size={13} /> AI Knowledge-Base Draft
                      </span>
                      <span className="ai-draft-hint">
                        Calibrated with BookLeaf policies & author data. Review & edit before sending.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm regenerate-draft-btn"
                      onClick={handleRegenerateAiDraft}
                      disabled={isRegeneratingDraft}
                      title="Regenerate fresh draft using AI & Knowledge Base"
                    >
                      <RefreshCw size={13} className={isRegeneratingDraft ? 'spin-animation' : ''} />
                      <span>{isRegeneratingDraft ? 'Regenerating...' : 'Regenerate'}</span>
                    </button>
                  </div>

                  <form onSubmit={handleSendAdminResponse}>
                    <textarea
                      className="draft-textarea"
                      value={draftResponseText}
                      onChange={(e) => setDraftResponseText(e.target.value)}
                      placeholder="Type or edit the AI-generated response..."
                    />

                    <div className="draft-actions-bar">
                      <div className="draft-quick-shortcuts">
                        {/* Knowledge Base Quick Insert Shortcuts */}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm quick-shortcut-pill"
                          onClick={() => {
                            setDraftResponseText((prev) =>
                              prev +
                              '\n\n[Policy Note: BookLeaf follows an 80/20 net profit split paid quarterly within 45 days. Minimum payout threshold is ₹1,000.]'
                            );
                          }}
                        >
                          + Royalty Policy
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm quick-shortcut-pill"
                          onClick={() => {
                            setDraftResponseText((prev) =>
                              prev +
                              '\n\n[Reprint Policy: BookLeaf provides 100% free reprints for verified manufacturing defects within 5–7 business days.]'
                            );
                          }}
                        >
                          + Quality Reprint
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm quick-shortcut-pill"
                          onClick={() => {
                            setDraftResponseText((prev) =>
                              prev +
                              '\n\n[Distribution Note: Stock-sync updates typically reflect live across Amazon and retail partners within 24–48 hours.]'
                            );
                          }}
                        >
                          + Stock Sync
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary draft-send-btn"
                        disabled={isSendingResponse || !draftResponseText.trim()}
                      >
                        {isSendingResponse ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send size={15} /> <span>Send Response to Author</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
