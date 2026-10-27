const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { analyzeTicketWithAI } = require('../services/aiService');

async function seed() {
  console.log('--- Starting BookLeaf Platform Database Seeding ---');

  // 1. Initialize DB Schema
  await db.initSchema();

  // Clear existing data to ensure idempotent clean seed
  await db.run('DELETE FROM ticket_notes');
  await db.run('DELETE FROM ticket_messages');
  await db.run('DELETE FROM tickets');
  await db.run('DELETE FROM books');
  await db.run('DELETE FROM users');
  await db.run('DELETE FROM authors');

  console.log('Previous database records cleared.');

  // 2. Hash default passwords
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const authorPasswordHash = await bcrypt.hash('author123', 10);

  // 3. Create Admin User
  await db.run(
    `INSERT INTO users (id, email, password_hash, role, name, author_id)
     VALUES (?, ?, ?, 'admin', ?, NULL)`,
    ['USR_ADMIN_01', 'admin@bookleaf.com', adminPasswordHash, 'BookLeaf Operations Lead']
  );
  console.log('Seeded Admin account: admin@bookleaf.com (password: admin123)');

  // 4. Load sample data
  const sampleDataPath = path.join(__dirname, '../../bookleaf_sample_data.json');
  if (!fs.existsSync(sampleDataPath)) {
    throw new Error(`Sample data file not found at ${sampleDataPath}`);
  }

  const rawJson = fs.readFileSync(sampleDataPath, 'utf8');
  const sampleData = JSON.parse(rawJson);
  const authors = sampleData.authors || [];

  console.log(`Loading ${authors.length} authors from sample dataset...`);

  let totalBooksCount = 0;

  for (const a of authors) {
    // Insert into authors table
    await db.run(
      `INSERT INTO authors (author_id, name, email, phone, city, joined_date)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [a.author_id, a.name, a.email, a.phone, a.city, a.joined_date]
    );

    // Insert user account for author
    await db.run(
      `INSERT INTO users (id, email, password_hash, role, name, author_id)
       VALUES (?, ?, ?, 'author', ?, ?)`,
      [`USR_${a.author_id}`, a.email.toLowerCase(), authorPasswordHash, a.name, a.author_id]
    );

    // Insert books
    for (const b of a.books || []) {
      totalBooksCount++;
      await db.run(
        `INSERT INTO books (
          book_id, author_id, title, isbn, genre, publication_date, status,
          mrp, author_royalty_per_copy, total_copies_sold, total_royalty_earned,
          royalty_paid, royalty_pending, last_royalty_payout_date, print_partner, available_on
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          b.book_id,
          a.author_id,
          b.title,
          b.isbn,
          b.genre,
          b.publication_date,
          b.status,
          b.mrp,
          b.author_royalty_per_copy,
          b.total_copies_sold || 0,
          b.total_royalty_earned || 0,
          b.royalty_paid || 0,
          b.royalty_pending || 0,
          b.last_royalty_payout_date,
          b.print_partner,
          JSON.stringify(b.available_on || [])
        ]
      );
    }
  }

  console.log(`Seeded ${authors.length} authors and ${totalBooksCount} books.`);

  // 5. Seed Pre-populated Tickets representing real operational scenarios
  console.log('Seeding initial support tickets representing diverse real-world edge cases...');

  const initialTickets = [
    {
      ticket_id: 'TICK-1001',
      author_id: 'AUTH001', // Priya Sharma
      book_id: 'BK001',     // Whispers of the Ganges
      subject: "I published my book 4 months ago and still haven't received any royalty. What's going on?",
      description: "I published Whispers of the Ganges 4 months ago and have recorded 342 copies sold. My pending royalty shows ₹3,570, but no payment has been deposited into my account. Could you please clarify why this is delayed?",
      status: 'Open',
      author_name: 'Priya Sharma',
      author_user_id: 'USR_AUTH001'
    },
    {
      ticket_id: 'TICK-1002',
      author_id: 'AUTH007', // Sneha Kulkarni
      book_id: 'BK011',     // The Algorithm of Love
      subject: "My book is showing a different ISBN on Amazon than what's on the physical copy",
      description: "A reader notified me today that the Amazon India product listing has a mismatched ISBN ending in -99 rather than the official ISBN 978-93-5XXXX-11-0 on the back cover. This needs urgent fixing!",
      status: 'In Progress',
      author_name: 'Sneha Kulkarni',
      author_user_id: 'USR_AUTH007',
      assigned_to: 'BookLeaf Operations Lead',
      existing_reply: "Dear Sneha,\n\nThank you for bringing this to our attention immediately regarding 'The Algorithm of Love'. We treat any retail ISBN mismatch as a critical data issue.\n\nI have escalated this ticket to our senior metadata specialist and triggered an emergency catalog review with Amazon India. We are requesting an expedited feed correction within 48 hours.\n\nI will monitor this hourly and email you the moment the corrected ISBN reflects live on Amazon.\n\nWarm regards,\nBookLeaf Operations Lead",
      internal_note: "Escalated to retail catalog ops. Amazon merchant support ticket #IN-78923 logged for ISBN correction."
    },
    {
      ticket_id: 'TICK-1003',
      author_id: 'AUTH002', // Rohit Kapoor
      book_id: 'BK003',     // Code & Karma
      subject: "Received author copies with blurry text and binding defects",
      description: "I received a carton of 20 author copies for Code & Karma printed by Repro India. Several copies have misaligned page borders and blurry text in Chapter 4. Please advise on how to get reprints.",
      status: 'In Progress',
      author_name: 'Rohit Kapoor',
      author_user_id: 'USR_AUTH002',
      assigned_to: 'BookLeaf Operations Lead',
      existing_reply: "Dear Rohit,\n\nI apologize sincerely for the print quality defects you encountered with your batch of 'Code & Karma'. This does not meet BookLeaf's print standards.\n\nCould you please reply with photos of the misaligned pages and blurry chapters? As per our policy, once verified, BookLeaf will immediately arrange a 100% free reprint of the defective copies.\n\nReprints typically dispatch within 5–7 business days from our Delhi facility.\n\nWarm regards,\nBookLeaf Author Support Team",
      internal_note: "Partner Repro India notified. Awaiting author photos to issue reprint order."
    },
    {
      ticket_id: 'TICK-1004',
      author_id: 'AUTH009', // Kavita Deshmukh
      book_id: 'BK015',     // Raising Roots (In Production)
      subject: "Book has been in typesetting for 3 weeks - timeline update?",
      description: "It has been 3 weeks since typesetting started for 'Raising Roots'. When can I expect the interior proofs for approval?",
      status: 'Open',
      author_name: 'Kavita Deshmukh',
      author_user_id: 'USR_AUTH009'
    },
    {
      ticket_id: 'TICK-1005',
      author_id: 'AUTH006', // Arjun Malhotra
      book_id: 'BK010',     // Turban Tales
      subject: "Can I update the description and author bio on Amazon?",
      description: "My book 'Turban Tales' is live and doing well. I recently received a major literary review that I would love to include in the Amazon description. Can I update this?",
      status: 'Resolved',
      author_name: 'Arjun Malhotra',
      author_user_id: 'USR_AUTH006',
      assigned_to: 'BookLeaf Operations Lead',
      existing_reply: "Dear Arjun,\n\nCongratulations on the literary review for 'Turban Tales'!\n\nYes, metadata updates including book descriptions and author bios can easily be updated. Please share the revised description text here, and our distribution team will push the updates to Amazon India and BookLeaf Store.\n\nChanges typically take 3 to 5 business days to index across platforms.\n\nWarm regards,\nBookLeaf Operations Lead"
    }
  ];

  for (const t of initialTickets) {
    const book = await db.get('SELECT * FROM books WHERE book_id = ?', [t.book_id]);
    const aiAnalysis = await analyzeTicketWithAI({
      subject: t.subject,
      description: t.description,
      bookContext: book,
      authorName: t.author_name
    });

    // 500ms throttle between tickets to respect free-tier RPM limits
    await new Promise((r) => setTimeout(r, 500));

    await db.run(
      `INSERT INTO tickets (
        ticket_id, author_id, book_id, subject, description, status,
        category, category_ai, category_override,
        priority, priority_ai, priority_override,
        assigned_to, ai_draft_response, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        t.ticket_id,
        t.author_id,
        t.book_id,
        t.subject,
        t.description,
        t.status,
        aiAnalysis.category,
        aiAnalysis.category,
        aiAnalysis.priority,
        aiAnalysis.priority,
        t.assigned_to || null,
        aiAnalysis.ai_draft_response
      ]
    );

    // Initial author message
    await db.run(
      `INSERT INTO ticket_messages (
        message_id, ticket_id, sender_id, sender_role, sender_name, content, is_ai_drafted, created_at
      ) VALUES (?, ?, ?, 'author', ?, ?, 0, datetime('now', '-2 hours'))`,
      [`MSG-${t.ticket_id}-01`, t.ticket_id, t.author_user_id, t.author_name, t.description]
    );

    // Admin reply if present
    if (t.existing_reply) {
      await db.run(
        `INSERT INTO ticket_messages (
          message_id, ticket_id, sender_id, sender_role, sender_name, content, is_ai_drafted, created_at
        ) VALUES (?, ?, 'USR_ADMIN_01', 'admin', 'BookLeaf Operations Lead', ?, 1, datetime('now', '-30 minutes'))`,
        [`MSG-${t.ticket_id}-02`, t.ticket_id, t.existing_reply]
      );
    }

    // Internal note if present
    if (t.internal_note) {
      await db.run(
        `INSERT INTO ticket_notes (
          note_id, ticket_id, admin_id, admin_name, content, created_at
        ) VALUES (?, ?, 'USR_ADMIN_01', 'BookLeaf Operations Lead', ?, datetime('now', '-25 minutes'))`,
        [`NOTE-${t.ticket_id}-01`, t.ticket_id, t.internal_note]
      );
    }
  }

  console.log('Seeded 5 sample tickets with realistic communication threads and internal notes.');
  console.log('--- Database Seeding Complete! ---');
}

// Run directly if called as CLI script
if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}

module.exports = seed;
