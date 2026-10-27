const crypto = require('crypto');
const db = require('../config/db');
const { analyzeTicketWithAI } = require('../services/aiService');
const {
  emitTicketCreated,
  emitTicketUpdated,
  emitMessageCreated,
  emitNoteCreated
} = require('../services/socketService');

// Generate clean human-readable Ticket IDs like TICK-1024
async function generateNextTicketId() {
  const row = await db.get(`SELECT COUNT(*) as count FROM tickets`);
  const num = (row?.count || 0) + 1001;
  return `TICK-${num}`;
}

async function createTicket(req, res) {
  try {
    const authorId = req.user.author_id;
    if (!authorId) {
      return res.status(403).json({
        success: false,
        error: 'Only author accounts can submit support queries.'
      });
    }

    const { subject, description, book_id, attachment_name, attachment_url } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'A subject line is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'A detailed description is required.' });
    }

    // 1. Fetch Author details
    const author = await db.get('SELECT * FROM authors WHERE author_id = ?', [authorId]);
    if (!author) {
      return res.status(404).json({ success: false, error: 'Author record not found.' });
    }

    // 2. Fetch Book details if linked
    let bookContext = null;
    let validBookId = null;
    if (book_id && book_id !== 'general' && book_id !== '') {
      bookContext = await db.get('SELECT * FROM books WHERE book_id = ? AND author_id = ?', [book_id, authorId]);
      if (bookContext) {
        validBookId = bookContext.book_id;
      }
    }

    // 3. AI Analysis: Auto-classification, Priority scoring, and Draft generation
    const aiAnalysis = await analyzeTicketWithAI({
      subject: subject.trim(),
      description: description.trim(),
      bookContext,
      authorName: author.name
    });

    const ticketId = await generateNextTicketId();
    const messageId = `MSG-${crypto.randomUUID().slice(0, 8)}`;

    // 4. Save Ticket
    await db.run(
      `INSERT INTO tickets (
        ticket_id, author_id, book_id, subject, description, status,
        category, category_ai, category_override,
        priority, priority_ai, priority_override,
        assigned_to, ai_draft_response, attachment_name, attachment_url,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'Open', ?, ?, 0, ?, ?, 0, NULL, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        ticketId,
        authorId,
        validBookId,
        subject.trim(),
        description.trim(),
        aiAnalysis.category,
        aiAnalysis.category,
        aiAnalysis.priority,
        aiAnalysis.priority,
        aiAnalysis.ai_draft_response,
        attachment_name || null,
        attachment_url || null
      ]
    );

    // 5. Save initial query into ticket_messages
    await db.run(
      `INSERT INTO ticket_messages (
        message_id, ticket_id, sender_id, sender_role, sender_name, content, is_ai_drafted, created_at
      ) VALUES (?, ?, ?, 'author', ?, ?, 0, CURRENT_TIMESTAMP)`,
      [messageId, ticketId, req.user.id, author.name, description.trim()]
    );

    // 6. Fetch complete created ticket object
    const createdTicket = await db.get(
      `SELECT t.*, a.name as author_name, a.email as author_email, b.title as book_title
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.ticket_id = ?`,
      [ticketId]
    );

    // 7. Emit real-time notification to BookLeaf operations admins
    emitTicketCreated(createdTicket);

    return res.status(201).json({
      success: true,
      message: 'Support ticket successfully submitted.',
      data: createdTicket,
      ai_meta: {
        provider: aiAnalysis.provider,
        reasoning: aiAnalysis.reasoning,
        confidence: aiAnalysis.confidence,
        latencyMs: aiAnalysis.latencyMs
      }
    });
  } catch (err) {
    console.error('Error creating ticket:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to create support ticket. Please try again.'
    });
  }
}

async function getAuthorTickets(req, res) {
  try {
    const authorId = req.user.author_id;
    if (!authorId) {
      return res.status(403).json({ success: false, error: 'Author account required.' });
    }

    const tickets = await db.all(
      `SELECT t.*, b.title as book_title,
              (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.ticket_id) as message_count,
              (SELECT m.content FROM ticket_messages m WHERE m.ticket_id = t.ticket_id ORDER BY m.created_at DESC LIMIT 1) as latest_message_preview,
              (SELECT m.created_at FROM ticket_messages m WHERE m.ticket_id = t.ticket_id ORDER BY m.created_at DESC LIMIT 1) as latest_activity
       FROM tickets t
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.author_id = ?
       ORDER BY t.created_at DESC`,
      [authorId]
    );

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    console.error('Error fetching author tickets:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve author tickets.' });
  }
}

async function getAllTickets(req, res) {
  try {
    const { status, category, priority, search, sortBy } = req.query;

    let sql = `
      SELECT t.*, a.name as author_name, a.email as author_email, a.city as author_city,
             b.title as book_title, b.isbn as book_isbn, b.status as book_status,
             (SELECT COUNT(*) FROM ticket_messages m WHERE m.ticket_id = t.ticket_id) as message_count,
             (SELECT COUNT(*) FROM ticket_notes n WHERE n.ticket_id = t.ticket_id) as note_count
      FROM tickets t
      JOIN authors a ON t.author_id = a.author_id
      LEFT JOIN books b ON t.book_id = b.book_id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'All') {
      sql += ` AND t.status = ?`;
      params.push(status);
    }

    if (category && category !== 'All') {
      sql += ` AND t.category = ?`;
      params.push(category);
    }

    if (priority && priority !== 'All') {
      sql += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (search && search.trim()) {
      sql += ` AND (t.ticket_id LIKE ? OR t.subject LIKE ? OR t.description LIKE ? OR a.name LIKE ? OR b.title LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term, term);
    }

    // Sorting: Most urgent and oldest unresolved tickets should be easy to spot
    if (sortBy === 'oldest') {
      sql += ` ORDER BY t.created_at ASC`;
    } else if (sortBy === 'newest') {
      sql += ` ORDER BY t.created_at DESC`;
    } else {
      // Default: 'urgency' (Critical first, then High, then Medium, then Low; unresolved first)
      sql += `
        ORDER BY 
          CASE WHEN t.status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END ASC,
          CASE t.priority
            WHEN 'Critical' THEN 1
            WHEN 'High' THEN 2
            WHEN 'Medium' THEN 3
            WHEN 'Low' THEN 4
            ELSE 5
          END ASC,
          t.created_at ASC
      `;
    }

    const tickets = await db.all(sql, params);

    return res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  } catch (err) {
    console.error('Error fetching all tickets for admin:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve tickets queue.' });
  }
}

async function getTicketById(req, res) {
  try {
    const { id } = req.params;

    const ticket = await db.get(
      `SELECT t.*, a.name as author_name, a.email as author_email, a.phone as author_phone, a.city as author_city,
              b.title as book_title, b.isbn as book_isbn, b.status as book_status, b.mrp as book_mrp,
              b.total_copies_sold as book_copies_sold, b.total_royalty_earned as book_royalty_earned,
              b.royalty_pending as book_royalty_pending, b.last_royalty_payout_date as book_last_payout
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.ticket_id = ?`,
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    // RBAC: Authors can only view their own tickets
    if (req.user.role === 'author' && ticket.author_id !== req.user.author_id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. You do not have permission to view this ticket.'
      });
    }

    // Fetch conversation messages
    const messages = await db.all(
      `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
      [id]
    );

    // Fetch internal notes ONLY if user is admin
    let notes = [];
    if (req.user.role === 'admin') {
      notes = await db.all(
        `SELECT * FROM ticket_notes WHERE ticket_id = ? ORDER BY created_at DESC`,
        [id]
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        ticket,
        messages,
        notes: req.user.role === 'admin' ? notes : undefined
      }
    });
  } catch (err) {
    console.error('Error fetching ticket by ID:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve ticket details.' });
  }
}

async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { content, is_ai_drafted } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Message content cannot be blank.' });
    }

    const ticket = await db.get('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    // Access check
    if (req.user.role === 'author' && ticket.author_id !== req.user.author_id) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    const messageId = `MSG-${crypto.randomUUID().slice(0, 8)}`;
    const senderRole = req.user.role;
    const senderName = req.user.name;

    await db.run(
      `INSERT INTO ticket_messages (
        message_id, ticket_id, sender_id, sender_role, sender_name, content, is_ai_drafted, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        messageId,
        id,
        req.user.id,
        senderRole,
        senderName,
        content.trim(),
        is_ai_drafted ? 1 : 0
      ]
    );

    // If an admin sends a response to an Open ticket, update status to In Progress
    if (senderRole === 'admin' && ticket.status === 'Open') {
      await db.run(
        `UPDATE tickets SET status = 'In Progress', updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
        [id]
      );
      ticket.status = 'In Progress';
      emitTicketUpdated(ticket);
    }

    const createdMessage = await db.get('SELECT * FROM ticket_messages WHERE message_id = ?', [messageId]);

    // Real-time broadcast
    emitMessageCreated(id, createdMessage, ticket.author_id);

    return res.status(201).json({
      success: true,
      data: createdMessage
    });
  } catch (err) {
    console.error('Error adding message:', err);
    return res.status(500).json({ success: false, error: 'Failed to post message.' });
  }
}

async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const { status, category, priority, assigned_to } = req.body;

    const ticket = await db.get('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    let categoryOverride = ticket.category_override;
    let priorityOverride = ticket.priority_override;

    if (category && category !== ticket.category) {
      categoryOverride = 1;
    }
    if (priority && priority !== ticket.priority) {
      priorityOverride = 1;
    }

    await db.run(
      `UPDATE tickets SET
        status = COALESCE(?, status),
        category = COALESCE(?, category),
        category_override = ?,
        priority = COALESCE(?, priority),
        priority_override = ?,
        assigned_to = COALESCE(?, assigned_to),
        updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = ?`,
      [
        status || null,
        category || null,
        categoryOverride,
        priority || null,
        priorityOverride,
        assigned_to !== undefined ? assigned_to : null,
        id
      ]
    );

    const updated = await db.get(
      `SELECT t.*, a.name as author_name, a.email as author_email, b.title as book_title
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.ticket_id = ?`,
      [id]
    );

    emitTicketUpdated(updated);

    return res.status(200).json({
      success: true,
      message: 'Ticket details updated successfully.',
      data: updated
    });
  } catch (err) {
    console.error('Error updating ticket:', err);
    return res.status(500).json({ success: false, error: 'Failed to update ticket.' });
  }
}

async function addInternalNote(req, res) {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, error: 'Internal note content cannot be empty.' });
    }

    const ticket = await db.get('SELECT * FROM tickets WHERE ticket_id = ?', [id]);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const noteId = `NOTE-${crypto.randomUUID().slice(0, 8)}`;

    await db.run(
      `INSERT INTO ticket_notes (
        note_id, ticket_id, admin_id, admin_name, content, created_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [noteId, id, req.user.id, req.user.name, content.trim()]
    );

    const createdNote = await db.get('SELECT * FROM ticket_notes WHERE note_id = ?', [noteId]);

    // Real-time broadcast strictly to admins
    emitNoteCreated(id, createdNote);

    return res.status(201).json({
      success: true,
      data: createdNote
    });
  } catch (err) {
    console.error('Error adding internal note:', err);
    return res.status(500).json({ success: false, error: 'Failed to save internal note.' });
  }
}

async function regenerateAiDraft(req, res) {
  try {
    const { id } = req.params;

    const ticket = await db.get(
      `SELECT t.*, a.name as author_name, b.title, b.isbn, b.status as book_status,
              b.royalty_pending, b.total_copies_sold, b.last_royalty_payout_date
       FROM tickets t
       JOIN authors a ON t.author_id = a.author_id
       LEFT JOIN books b ON t.book_id = b.book_id
       WHERE t.ticket_id = ?`,
      [id]
    );

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found.' });
    }

    const bookContext = ticket.title ? {
      title: ticket.title,
      isbn: ticket.isbn,
      status: ticket.book_status,
      royalty_pending: ticket.royalty_pending,
      total_copies_sold: ticket.total_copies_sold,
      last_royalty_payout_date: ticket.last_royalty_payout_date
    } : null;

    const aiResult = await analyzeTicketWithAI({
      subject: ticket.subject,
      description: ticket.description,
      bookContext,
      authorName: ticket.author_name
    });

    // Update stored AI draft
    await db.run(
      `UPDATE tickets SET ai_draft_response = ?, updated_at = CURRENT_TIMESTAMP WHERE ticket_id = ?`,
      [aiResult.ai_draft_response, id]
    );

    return res.status(200).json({
      success: true,
      message: 'AI draft response regenerated.',
      data: {
        ai_draft_response: aiResult.ai_draft_response,
        category: aiResult.category,
        priority: aiResult.priority,
        provider: aiResult.provider,
        reasoning: aiResult.reasoning,
        latencyMs: aiResult.latencyMs
      }
    });
  } catch (err) {
    console.error('Error regenerating AI draft:', err);
    return res.status(500).json({ success: false, error: 'Failed to regenerate AI response.' });
  }
}

module.exports = {
  createTicket,
  getAuthorTickets,
  getAllTickets,
  getTicketById,
  addMessage,
  updateTicket,
  addInternalNote,
  regenerateAiDraft
};
