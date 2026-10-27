const db = require('../config/db');

async function getMyBooks(req, res) {
  try {
    const authorId = req.user.author_id;

    if (!authorId) {
      return res.status(403).json({
        success: false,
        error: 'Only author accounts have an associated book catalog.'
      });
    }

    const books = await db.all(
      `SELECT * FROM books WHERE author_id = ? ORDER BY publication_date DESC, created_at DESC`,
      [authorId]
    );

    // Parse available_on JSON strings
    const parsedBooks = books.map((b) => ({
      ...b,
      available_on: JSON.parse(b.available_on || '[]'),
      is_in_production: b.status.toLowerCase().includes('in production'),
      is_eligible_for_payout: b.royalty_pending >= 1000
    }));

    return res.status(200).json({
      success: true,
      count: parsedBooks.length,
      data: parsedBooks
    });
  } catch (err) {
    console.error('Error fetching author books:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve author book catalog.'
    });
  }
}

async function getAuthorStats(req, res) {
  try {
    const authorId = req.user.author_id;

    if (!authorId) {
      return res.status(403).json({
        success: false,
        error: 'Only author accounts have an associated statistics summary.'
      });
    }

    const books = await db.all(`SELECT * FROM books WHERE author_id = ?`, [authorId]);

    const totalBooks = books.length;
    const publishedBooks = books.filter((b) => b.status === 'Published & Live').length;
    const inProductionBooks = books.filter((b) => b.status.toLowerCase().includes('in production')).length;
    const totalCopiesSold = books.reduce((acc, b) => acc + (b.total_copies_sold || 0), 0);
    const totalRoyaltyEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
    const royaltyPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
    const royaltyPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);

    const ticketStats = await db.get(
      `SELECT 
        COUNT(*) as total_tickets,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open_tickets,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress_tickets,
        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_tickets
       FROM tickets WHERE author_id = ?`,
      [authorId]
    );

    return res.status(200).json({
      success: true,
      data: {
        books: {
          total: totalBooks,
          published: publishedBooks,
          in_production: inProductionBooks,
          total_copies_sold: totalCopiesSold,
          total_royalty_earned: totalRoyaltyEarned,
          royalty_paid: royaltyPaid,
          royalty_pending: royaltyPending,
          payout_threshold_met: royaltyPending >= 1000
        },
        tickets: {
          total: ticketStats.total_tickets || 0,
          open: ticketStats.open_tickets || 0,
          in_progress: ticketStats.in_progress_tickets || 0,
          resolved: ticketStats.resolved_tickets || 0
        }
      }
    });
  } catch (err) {
    console.error('Error fetching author stats:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve author statistics.'
    });
  }
}

module.exports = {
  getMyBooks,
  getAuthorStats
};
