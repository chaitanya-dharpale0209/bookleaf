import React, { useState } from 'react';
import { BookOpen, X, CheckCircle, Shield, Award, Sparkles } from 'lucide-react';

export default function KnowledgeBaseModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content kb-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: 'var(--emerald-100)',
                color: 'var(--emerald-800)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <BookOpen size={18} />
            </div>
            <div>
              <h3>BookLeaf Publishing Knowledge Base</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                Ground truth operational rules & AI calibrated response guidelines
              </p>
            </div>
          </div>

          <button className="btn-ghost modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="kb-tabs-bar">
          <div className="custom-tabs" style={{ margin: 0 }}>
            <button
              className={`custom-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Royalty
            </button>
            <button
              className={`custom-tab-btn ${activeTab === 'isbn-print' ? 'active' : ''}`}
              onClick={() => setActiveTab('isbn-print')}
            >
              ISBN & Printing
            </button>
            <button
              className={`custom-tab-btn ${activeTab === 'distribution' ? 'active' : ''}`}
              onClick={() => setActiveTab('distribution')}
            >
              Distribution & Stages
            </button>
            <button
              className={`custom-tab-btn ${activeTab === 'tone' ? 'active' : ''}`}
              onClick={() => setActiveTab('tone')}
            >
              Tone & AI Calibration
            </button>
          </div>
        </div>

        <div className="modal-body kb-modal-body">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div>
                <h4 style={{ color: 'var(--emerald-800)', marginBottom: '0.4rem' }}>Company Overview</h4>
                <p style={{ color: 'var(--slate-600)' }}>
                  BookLeaf Publishing is a self-publishing house operating in India and the US, processing 1,200+
                  books monthly across a catalog of 22,000+ titles. Packages include <strong>Standard Free</strong> (zero
                  upfront cost) and <strong>Bestseller Breakthrough</strong> (premium marketing add-ons).
                </p>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ color: 'var(--slate-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Award size={16} color="var(--emerald-600)" /> Royalty Policy (80/20 Profit Split)
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li><strong>80/20 Net Profit Split:</strong> 80% of net profit goes to author, 20% to BookLeaf.</li>
                  <li><strong>Net Profit Formula:</strong> MRP minus (Printing Cost + Platform Commission [Amazon/Flipkart] + Shipping).</li>
                  <li><strong>Payout Schedule:</strong> Calculated quarterly and paid within 45 days after quarter end.</li>
                  <li><strong>Minimum Threshold:</strong> ₹1,000. Accumulated royalties below ₹1,000 roll over safely to the next quarter.</li>
                  <li><strong>Disbursement:</strong> Direct bank transfer to the account verified on the author dashboard.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'isbn-print' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ color: 'var(--slate-900)', marginBottom: '0.5rem' }}>ISBN Policy</h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li>Every book receives a unique ISBN registered under BookLeaf's publisher imprint.</li>
                  <li>Authors wanting an ISBN under their own imprint must obtain it independently.</li>
                  <li><strong>ISBN Discrepancies:</strong> Treated as high/critical priority and escalated to production with a <strong>48-hour resolution timeline</strong>.</li>
                </ul>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Printing & Quality</h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li>In-house Delhi facility handles most print orders. Overflow and specialized formats handled by Repro India or Epitome Books.</li>
                  <li><strong>Print Turnaround:</strong> 5 to 7 business days from order confirmation.</li>
                  <li><strong>Quality Defects:</strong> For misprints, binding defects, or blurry images, BookLeaf arranges a <strong>100% free reprint</strong> upon photo verification.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ color: 'var(--slate-900)', marginBottom: '0.5rem' }}>Distribution & Channel Availability</h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li>Books listed on: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store.</li>
                  <li>New listings go live within 7 to 10 business days after publication completes.</li>
                  <li><strong>Stock Unavailable:</strong> If marked 'Currently Unavailable', it indicates stock sync lag. Ops team triggers re-sync with a <strong>24 to 48-hour restoration window</strong>.</li>
                </ul>
              </div>

              <div style={{ background: 'var(--slate-50)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--slate-200)' }}>
                <h4 style={{ color: 'var(--slate-900)', marginBottom: '0.5rem' }}>9-Stage Production Lifecycle</h4>
                <ol style={{ paddingLeft: '1.25rem', color: 'var(--slate-700)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Manuscript Received</li>
                  <li>Editing (if package opted)</li>
                  <li>Cover Design (awaits author proof approval)</li>
                  <li>Typesetting & Interior Formatting</li>
                  <li>Proofreading & Author Revision Rounds</li>
                  <li>ISBN Assignment & Barcoding</li>
                  <li>Printing & Quality Check</li>
                  <li>Distribution Setup</li>
                  <li>Published & Live</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'tone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.9rem' }}>
              <div style={{ background: 'var(--emerald-50)', border: '1px solid var(--emerald-200)', padding: '1.25rem', borderRadius: '10px' }}>
                <h4 style={{ color: 'var(--emerald-900)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={16} color="var(--emerald-700)" /> BookLeaf Communication Tone Guidelines
                </h4>
                <ul style={{ paddingLeft: '1.25rem', color: 'var(--emerald-950)', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <li><strong>Empathetic & Professional:</strong> Authors are our creative partners, never mere ticket numbers.</li>
                  <li><strong>Acknowledge First:</strong> Acknowledge the author's frustration before jumping to solutions.</li>
                  <li><strong>Be Specific:</strong> Incorporate exact sales numbers, royalties, titles, and dates.</li>
                  <li><strong>Direct Ownership:</strong> If BookLeaf is at fault (delayed royalty, ISBN glitch), own it directly without corporate deflection.</li>
                  <li><strong>Concrete Timelines:</strong> Always provide clear resolution timelines (24-48h, 5-7 business days).</li>
                  <li><strong>Next Steps:</strong> Conclude with a clear action item for both the author and the team.</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
