const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { generateToken } = require('../middleware/auth');

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Both email and password are required.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'No account found with this email address.'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect password. Please verify your credentials.'
      });
    }

    // Get author details if author
    let authorData = null;
    if (user.author_id) {
      authorData = await db.get('SELECT * FROM authors WHERE author_id = ?', [user.author_id]);
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Authentication successful.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          author_id: user.author_id
        },
        author: authorData
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred during authentication.'
    });
  }
}

async function quickSwitch(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required for quick switch.' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await db.get('SELECT * FROM users WHERE LOWER(email) = ?', [normalizedEmail]);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    let authorData = null;
    if (user.author_id) {
      authorData = await db.get('SELECT * FROM authors WHERE author_id = ?', [user.author_id]);
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: `Switched session to ${user.name} (${user.role}).`,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          author_id: user.author_id
        },
        author: authorData
      }
    });
  } catch (err) {
    console.error('Quick switch error:', err);
    return res.status(500).json({ success: false, error: 'Failed to switch user session.' });
  }
}

async function getCurrentUser(req, res) {
  try {
    const user = await db.get('SELECT id, email, role, name, author_id, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User profile not found.' });
    }

    let authorData = null;
    if (user.author_id) {
      authorData = await db.get('SELECT * FROM authors WHERE author_id = ?', [user.author_id]);
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        author: authorData
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch user profile.' });
  }
}

async function getDemoAccounts(req, res) {
  try {
    const users = await db.all(`
      SELECT u.id, u.email, u.role, u.name, u.author_id, a.city,
             (SELECT COUNT(*) FROM books b WHERE b.author_id = u.author_id) as book_count
      FROM users u
      LEFT JOIN authors a ON u.author_id = a.author_id
      ORDER BY u.role ASC, u.name ASC
    `);

    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error('Demo accounts error:', err);
    return res.status(500).json({ success: false, error: 'Failed to fetch demo accounts list.' });
  }
}

module.exports = {
  login,
  quickSwitch,
  getCurrentUser,
  getDemoAccounts
};
