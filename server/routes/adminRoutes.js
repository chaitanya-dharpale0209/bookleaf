const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.use(verifyToken);
router.use(requireAdmin);

router.get('/metrics', async (req, res) => {
  try {
    const totalRow = await db.get(`SELECT COUNT(*) as count FROM tickets`);
    const statusRows = await db.all(`SELECT status, COUNT(*) as count FROM tickets GROUP BY status`);
    const priorityRows = await db.all(`SELECT priority, COUNT(*) as count FROM tickets GROUP BY priority`);
    const categoryRows = await db.all(`SELECT category, COUNT(*) as count FROM tickets GROUP BY category`);
    const overrideStats = await db.get(`
      SELECT 
        SUM(category_override) as category_overrides,
        SUM(priority_override) as priority_overrides,
        COUNT(*) as total_tickets
      FROM tickets
    `);

    const authorCount = await db.get(`SELECT COUNT(*) as count FROM authors`);
    const bookCount = await db.get(`SELECT COUNT(*) as count FROM books`);

    const statusCounts = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
    statusRows.forEach((r) => { statusCounts[r.status] = r.count; });

    const priorityCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    priorityRows.forEach((r) => { priorityCounts[r.priority] = r.count; });

    return res.status(200).json({
      success: true,
      data: {
        totals: {
          tickets: totalRow.count || 0,
          authors: authorCount.count || 0,
          books: bookCount.count || 0,
          urgent: (priorityCounts.Critical || 0) + (priorityCounts.High || 0)
        },
        statusBreakdown: statusCounts,
        priorityBreakdown: priorityCounts,
        categoryBreakdown: categoryRows,
        aiPerformance: {
          totalAnalyzed: overrideStats.total_tickets || 0,
          categoryOverrides: overrideStats.category_overrides || 0,
          priorityOverrides: overrideStats.priority_overrides || 0,
          categoryAccuracyPercent: overrideStats.total_tickets 
            ? Math.round(((overrideStats.total_tickets - (overrideStats.category_overrides || 0)) / overrideStats.total_tickets) * 100)
            : 100
        }
      }
    });
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve admin operations metrics.' });
  }
});

router.get('/ai-status', (req, res) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const openAiConfigured = Boolean(process.env.OPENAI_API_KEY);

  let activeProvider = 'BookLeaf Expert Rule Engine (Knowledge-Base Grounded)';
  if (geminiConfigured) {
    activeProvider = 'Google Gemini 1.5 Flash';
  } else if (openAiConfigured) {
    activeProvider = 'OpenAI gpt-4o-mini';
  }

  return res.status(200).json({
    success: true,
    data: {
      activeProvider,
      geminiConfigured,
      openAiConfigured,
      zeroConfigFallbackActive: !geminiConfigured && !openAiConfigured,
      knowledgeBaseLoaded: true,
      supportedCategories: [
        'Royalty & Payments',
        'ISBN & Metadata Issues',
        'Printing & Quality',
        'Distribution & Availability',
        'Book Status & Production Updates',
        'General Inquiry'
      ]
    }
  });
});

module.exports = router;
