import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../config/api';
import {
  Book,
  PlusCircle,
  MessageSquare,
  Clock,
  IndianRupee,
  ShoppingBag,
  ExternalLink,
  Send,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  X,
  SlidersHorizontal
} from 'lucide-react';

export default function AuthorDashboard() {
  const { user, author, token, socket } = useAuth();

  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'tickets' | 'new-ticket'
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Ticket Form State
  const [selectedBookId, setSelectedBookId] = useState('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketSubmissionSuccess, setTicketSubmissionSuccess] = useState(null);

  // Active Ticket Viewer / Chat State
  const [activeTicket, setActiveTicket] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Load Author Books, Stats, and Tickets
  const fetchAuthorData = async () => {
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [booksRes, statsRes, ticketsRes] = await Promise.all([
        fetch(getApiUrl('/api/authors/books'), { headers }),
        fetch(getApiUrl('/api/authors/stats'), { headers }),
        fetch(getApiUrl('/api/tickets/my-tickets'), { headers })
      ]);

      const [booksData, statsData, ticketsData] = await Promise.all([
        booksRes.json(),
        statsRes.json(),
        ticketsRes.json()
      ]);

      if (booksData.success) setBooks(booksData.data);
      if (statsData.success) setStats(statsData.data);
      if (ticketsData.success) setTickets(ticketsData.data);
    } catch (err) {
      console.error('Error loading author dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAuthorData();
    }
  }, [token, user?.author_id]);

  // Real-Time Socket Listeners for Author
  useEffect(() => {
    if (!socket) return;

    const handleTicketUpdated = (updatedTicket) => {
      // If belongs to this author
      setTickets((prev) =>
        prev.map((t) => (t.ticket_id === updatedTicket.ticket_id ? { ...t, ...updatedTicket } : t))
      );

      if (activeTicket?.ticket_id === updatedTicket.ticket_id) {
        setTicketDetails((prev) => (prev ? { ...prev, ticket: { ...prev.ticket, ...updatedTicket } } : prev));
      }
    };

    const handleMessageCreated = ({ ticketId, message }) => {
      // Update ticket activity in list
      setTickets((prev) =>
        prev.map((t) => {
          if (t.ticket_id === ticketId) {
            return {
              ...t,
              message_count: (t.message_count || 0) + 1,
              latest_message_preview: message.content,
              latest_activity: message.created_at
            };
          }
          return t;
        })
      );

      // If active ticket is open, append message smoothly
      if (activeTicket?.ticket_id === ticketId) {
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
    };

    socket.on('ticket:updated', handleTicketUpdated);
    socket.on('message:created', handleMessageCreated);

    return () => {
      socket.off('ticket:updated', handleTicketUpdated);
      socket.off('message:created', handleMessageCreated);
    };
  }, [socket, activeTicket]);

  // Submit Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setIsSubmittingTicket(true);
    setTicketSubmissionSuccess(null);

    try {
      const res = await fetch(getApiUrl('/api/tickets'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: subject.trim(),
          description: description.trim(),
          book_id: selectedBookId === 'general' ? null : selectedBookId,
          attachment_name: attachmentName || null
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit ticket.');
      }

      setTicketSubmissionSuccess({
        ticketId: data.data.ticket_id,
        category: data.data.category,
        priority: data.data.priority,
        aiMeta: data.ai_meta
      });

      // Reset form
      setSubject('');
      setDescription('');
      setSelectedBookId('general');
      setAttachmentName('');

      // Refresh tickets
      fetchAuthorData();
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Open Ticket Details
  const handleOpenTicketDetails = async (t) => {
    setActiveTicket(t);
    try {
      const res = await fetch(getApiUrl(`/api/tickets/${t.ticket_id}`), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setTicketDetails(data.data);
      }
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    }
  };

  // Send Author Reply
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyMessage.trim() || !activeTicket) return;

    setIsSendingReply(true);
    try {
      const res = await fetch(getApiUrl(`/api/tickets/${activeTicket.ticket_id}/messages`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyMessage.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
      }
    } catch (err) {
      alert('Failed to send reply: ' + err.message);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="app-container">
      {/* Header Profile Summary */}
      <div className="page-header-row">
        <div>
          <h2>Author Dashboard</h2>
          <p>
            Welcome back, <strong>{author?.name || user?.name}</strong> • Account ID: {user?.author_id}{' '}
            {author?.city ? `(${author.city})` : ''}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchAuthorData}
            title="Refresh catalog & ticket statuses"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setTicketSubmissionSuccess(null);
              setActiveTab('new-ticket');
            }}
          >
            <PlusCircle size={16} /> Submit Support Query
          </button>
        </div>
      </div>

      {/* Top Metrics Row */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card accent-emerald">
            <div className="stat-header">
              <span>Lifetime Royalty Earned</span>
              <IndianRupee size={18} color="var(--emerald-600)" />
            </div>
            <div className="stat-value">₹{stats.books.total_royalty_earned.toLocaleString('en-IN')}</div>
            <div className="stat-subtext">80% Net profit split across all sales</div>
          </div>

          <div className="stat-card accent-amber">
            <div className="stat-header">
              <span>Pending Royalty Payout</span>
              <Clock size={18} color="var(--amber-500)" />
            </div>
            <div className="stat-value" style={{ color: 'var(--amber-600)' }}>
              ₹{stats.books.royalty_pending.toLocaleString('en-IN')}
            </div>
            <div className="stat-subtext">
              {stats.books.payout_threshold_met ? (
                <span style={{ color: 'var(--emerald-700)', fontWeight: 600 }}>
                  Eligible for next quarterly payout cycle (≥ ₹1,000)
                </span>
              ) : (
                <span style={{ color: 'var(--slate-500)' }}>
                  Below ₹1,000 threshold (safely rolls over to next quarter)
                </span>
              )}
            </div>
          </div>

          <div className="stat-card accent-blue">
            <div className="stat-header">
              <span>Total Books & Copies Sold</span>
              <ShoppingBag size={18} color="#3b82f6" />
            </div>
            <div className="stat-value">{stats.books.total_copies_sold.toLocaleString()}</div>
            <div className="stat-subtext">
              {stats.books.published} published • {stats.books.in_production} in production
            </div>
          </div>

          <div className="stat-card accent-rose">
            <div className="stat-header">
              <span>Support Tickets</span>
              <MessageSquare size={18} color="#ef4444" />
            </div>
            <div className="stat-value">{stats.tickets.total}</div>
            <div className="stat-subtext">
              {stats.tickets.open + stats.tickets.in_progress} active queries • {stats.tickets.resolved} resolved
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="custom-tabs">
        <button
          className={`custom-tab-btn ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <Book size={16} /> My Books Catalog ({books.length})
        </button>

        <button
          className={`custom-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <MessageSquare size={16} /> My Tickets ({tickets.length})
        </button>

        <button
          className={`custom-tab-btn ${activeTab === 'new-ticket' ? 'active' : ''}`}
          onClick={() => {
            setTicketSubmissionSuccess(null);
            setActiveTab('new-ticket');
          }}
        >
          <PlusCircle size={16} /> Raise Support Ticket
        </button>
      </div>

      {/* TAB 1: MY BOOKS CATALOG */}
      {activeTab === 'books' && (
        <div>
          {books.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '12px' }}>
              <Book size={40} color="var(--slate-400)" />
              <h3 style={{ marginTop: '0.75rem' }}>No books listed under this account</h3>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((b) => (
                <div key={b.book_id} className="book-card">
                  <div className="book-card-header">
                    <div className="book-cover-mock">
                      <Book size={24} />
                      <span>{b.book_id}</span>
                    </div>
                    <div className="book-title-meta">
                      <h3>{b.title}</h3>
                      <div className="book-genre">{b.genre}</div>
                      <div className="book-isbn-badge">
                        <span>ISBN:</span> {b.isbn || 'Pending Allocation'}
                      </div>
                    </div>
                  </div>

                  <div className="book-card-body">
                    {/* Status Pill */}
                    <div>
                      <span
                        className={`book-status-pill ${
                          b.is_in_production ? 'production' : 'published'
                        }`}
                      >
                        {b.is_in_production ? (
                          <Clock size={12} />
                        ) : (
                          <CheckCircle2 size={12} color="var(--emerald-600)" />
                        )}
                        {b.status}
                      </span>
                    </div>

                    {/* Edge Case: In Production */}
                    {b.is_in_production ? (
                      <div
                        style={{
                          background: 'var(--amber-50)',
                          border: '1px solid var(--amber-200)',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          color: 'var(--amber-900)'
                        }}
                      >
                        <strong>In Production Stage:</strong> Interior formatting & cover design are underway. Sales
                        and royalties will activate once publication goes live across retail channels.
                      </div>
                    ) : (
                      /* Published Financial & Sales Metrics */
                      <div className="royalty-metrics-table">
                        <div className="royalty-metric-item">
                          <span>Total Copies Sold</span>
                          <strong>{b.total_copies_sold} copies</strong>
                        </div>

                        <div className="royalty-metric-item">
                          <span>MRP / Royalty Per Copy</span>
                          <strong>
                            ₹{b.mrp} (₹{b.author_royalty_per_copy}/copy)
                          </strong>
                        </div>

                        <div className="royalty-metric-item highlight">
                          <span>Lifetime Earned</span>
                          <strong>₹{b.total_royalty_earned.toLocaleString('en-IN')}</strong>
                        </div>

                        <div className="royalty-metric-item pending">
                          <span>Pending Payout</span>
                          <strong>₹{b.royalty_pending.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    )}

                    {/* Available On Retail Channels */}
                    <div>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--slate-500)',
                          fontWeight: 600,
                          display: 'block',
                          marginBottom: '0.35rem'
                        }}
                      >
                        Distribution Channels:
                      </span>
                      {b.available_on && b.available_on.length > 0 ? (
                        <div className="platforms-list">
                          {b.available_on.map((p, idx) => (
                            <span key={idx} className="platform-chip">
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                          Listing in progress
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="book-card-footer">
                    <div>
                      <span>Print Partner: </span>
                      <strong>{b.print_partner || 'In-House Delhi'}</strong>
                    </div>

                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        setSelectedBookId(b.book_id);
                        setSubject(`Query regarding "${b.title}"`);
                        setActiveTab('new-ticket');
                      }}
                      title="Raise ticket about this book"
                    >
                      <MessageSquare size={13} /> Raise Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY TICKETS */}
      {activeTab === 'tickets' && (
        <div>
          {tickets.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3.5rem', background: '#fff', borderRadius: '14px' }}>
              <MessageSquare size={44} color="var(--slate-300)" />
              <h3 style={{ marginTop: '0.75rem', color: 'var(--slate-800)' }}>No Support Tickets Raised Yet</h3>
              <p style={{ color: 'var(--slate-500)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Have questions about royalties, printing quality, or distribution? Our team is here to assist.
              </p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '1.25rem' }}
                onClick={() => setActiveTab('new-ticket')}
              >
                <PlusCircle size={16} /> Submit Your First Ticket
              </button>
            </div>
          ) : (
            <div className="tickets-table-container">
              <div className="table-scroll-hint">
                <SlidersHorizontal size={13} />
                <span>Swipe or scroll horizontally to view all ticket data & actions →</span>
              </div>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Book / Topic</th>
                    <th>Subject & Summary</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Last Activity</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.ticket_id}
                      className="clickable-row"
                      onClick={() => handleOpenTicketDetails(t)}
                    >
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate-900)' }}>
                          {t.ticket_id}
                        </strong>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {t.book_title ? t.book_title : 'General / Account'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{t.subject}</div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            color: 'var(--slate-500)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {t.latest_message_preview || t.description}
                        </div>
                      </td>
                      <td>
                        <span className="badge-category">{t.category}</span>
                      </td>
                      <td>
                        <span className={`badge-status ${t.status.replace(/\s+/g, '-')}`}>{t.status}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {new Date(t.updated_at || t.created_at).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenTicketDetails(t);
                          }}
                        >
                          View Thread ({t.message_count || 1})
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SUBMIT A SUPPORT QUERY */}
      {activeTab === 'new-ticket' && (
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          {ticketSubmissionSuccess ? (
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--emerald-200)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  background: 'var(--emerald-50)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: 'var(--emerald-600)'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--slate-900)' }}>
                Support Ticket Successfully Created!
              </h3>
              <p style={{ color: 'var(--slate-600)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Ticket ID: <strong>{ticketSubmissionSuccess.ticketId}</strong> has been prioritized and routed to
                the BookLeaf operations desk.
              </p>

              {/* AI Auto-Classification Feedback for Author */}
              <div
                style={{
                  background: 'var(--slate-50)',
                  border: '1px solid var(--slate-200)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  margin: '1.5rem 0',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sparkles size={16} color="#6366f1" />
                  <strong style={{ fontSize: '0.88rem', color: 'var(--slate-800)' }}>
                    AI Automated Routing & Classification
                  </strong>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Detected Category:</span>{' '}
                    <span className="badge-category">{ticketSubmissionSuccess.category}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--slate-500)' }}>Assigned Priority:</span>{' '}
                    <span className={`badge-priority ${ticketSubmissionSuccess.priority}`}>
                      {ticketSubmissionSuccess.priority}
                    </span>
                  </div>
                </div>
                {ticketSubmissionSuccess.aiMeta?.reasoning && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.5rem' }}>
                    <strong>Routing Context:</strong> {ticketSubmissionSuccess.aiMeta.reasoning}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setTicketSubmissionSuccess(null);
                  }}
                >
                  Submit Another Ticket
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setTicketSubmissionSuccess(null);
                    setActiveTab('tickets');
                  }}
                >
                  View My Tickets
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'var(--white)',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.35rem' }}>Raise a Support Ticket</h3>
                <p style={{ color: 'var(--slate-500)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
                  Our AI auto-classifies your query against BookLeaf policies and escalates urgent issues directly to operations leads.
                </p>
              </div>

              <form onSubmit={handleSubmitTicket}>
                {/* Book Selector */}
                <div className="form-group">
                  <label className="form-label">Related Book</label>
                  <select
                    className="form-control select-control"
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}
                  >
                    <option value="general">General / Account Level (Not Book Specific)</option>
                    {books.map((b) => (
                      <option key={b.book_id} value={b.book_id}>
                        {b.title} ({b.isbn || 'In Production'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subject Line */}
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Haven't received Q3 royalty payout or ISBN mismatched on Amazon"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                {/* Detailed Description */}
                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    className="form-control"
                    rows={5}
                    placeholder="Please share specific details such as dates, platform names (Amazon/Flipkart), or defect descriptions..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>

                {/* Optional File Attachment UI */}
                <div className="form-group">
                  <label className="form-label">
                    Attachment (Optional - e.g. Defective print photos or royalty screenshots)
                  </label>
                  <div
                    className="file-dropzone"
                    onClick={() => {
                      const mockFile = prompt('Enter a mock file name to attach (e.g. misprinted_page_photo.jpg):', 'defect_proof.jpg');
                      if (mockFile) setAttachmentName(mockFile);
                    }}
                  >
                    <Paperclip size={24} style={{ margin: '0 auto 0.4rem', display: 'block' }} />
                    {attachmentName ? (
                      <div style={{ color: 'var(--emerald-700)', fontWeight: 600 }}>
                        Attached: {attachmentName} (Click to change)
                      </div>
                    ) : (
                      <div>
                        <strong>Click to select or drop files here</strong>
                        <div style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                          Supports JPG, PNG, PDF up to 15MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions-row">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveTab('tickets')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmittingTicket}
                  >
                    {isSubmittingTicket ? (
                      <>
                        <Sparkles size={16} /> Analyzing & Submitting...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit Ticket
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Real-time Ticket Detail & Conversation Modal */}
      {activeTicket && ticketDetails && (
        <div className="workbench-modal-backdrop" onClick={() => setActiveTicket(null)}>
          <div
            className="workbench-card author-chat-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="workbench-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald-400)', fontWeight: 700 }}>
                    {ticketDetails.ticket.ticket_id}
                  </span>
                  <h3>{ticketDetails.ticket.subject}</h3>
                </div>
                <p>
                  Status: <strong>{ticketDetails.ticket.status}</strong> • Category:{' '}
                  <strong>{ticketDetails.ticket.category}</strong>
                </p>
              </div>
              <button
                className="btn-ghost modal-close-btn"
                style={{ color: '#fff' }}
                onClick={() => setActiveTicket(null)}
                aria-label="Close conversation modal"
              >
                <X size={20} />
              </button>
            </div>

            <div className="workbench-main author-chat-main">
              {/* Message Thread */}
              <div className="messages-thread">
                {ticketDetails.messages.map((m) => {
                  const isAuthor = m.sender_role === 'author';
                  return (
                    <div
                      key={m.message_id}
                      className={`message-bubble ${isAuthor ? 'author-message' : 'admin-message'}`}
                    >
                      <div className="message-meta">
                        <strong>{m.sender_name} ({isAuthor ? 'You' : 'BookLeaf Operations'})</strong>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString('en-IN', {
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

              {/* Author Reply Input */}
              <div className="chat-reply-bar">
                <form
                  onSubmit={handleSendReply}
                  className="chat-reply-form"
                >
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a reply to BookLeaf support..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={isSendingReply || ticketDetails.ticket.status === 'Closed'}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary chat-send-btn"
                    disabled={isSendingReply || !replyMessage.trim()}
                    aria-label="Send reply message"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
