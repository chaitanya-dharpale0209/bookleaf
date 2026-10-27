require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./config/db');
const { initSocket } = require('./services/socketService');

// Routes
const authRoutes = require('./routes/authRoutes');
const authorRoutes = require('./routes/authorRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE']
  }
});

initSocket(io);

// Core Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging in development
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    // console.log(`${req.method} ${req.url}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/authors', authorRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'BookLeaf Author Support & Communication Portal API',
    uptime: process.uptime()
  });
});

// API Documentation Endpoint
app.get('/api/docs', (req, res) => {
  res.status(200).json({
    title: 'BookLeaf Publishing Author Support & Communication Portal API',
    version: '1.0.0',
    description: 'REST API powering the Author Dashboard and Operations Admin Portal with AI-assisted response generation.',
    baseUrl: '/api',
    endpoints: [
      {
        section: 'Authentication',
        routes: [
          { method: 'POST', path: '/auth/login', desc: 'Authenticate author or admin', body: { email: 'string', password: 'string' } },
          { method: 'POST', path: '/auth/quick-switch', desc: 'Quick demo account switcher for evaluation', body: { email: 'string' } },
          { method: 'GET', path: '/auth/me', desc: 'Get authenticated user profile and author data (Bearer token)' },
          { method: 'GET', path: '/auth/demo-accounts', desc: 'List seeded test accounts for quick evaluator switching' }
        ]
      },
      {
        section: 'Author Portal',
        routes: [
          { method: 'GET', path: '/authors/books', desc: 'Retrieve books catalog for logged-in author (with sales & royalties)' },
          { method: 'GET', path: '/authors/stats', desc: 'Get aggregated sales, royalties, and ticket metrics for author' },
          { method: 'POST', path: '/tickets', desc: 'Submit a new support ticket (triggers AI classification & draft)', body: { subject: 'string', description: 'string', book_id: 'string (optional)' } },
          { method: 'GET', path: '/tickets/my-tickets', desc: 'List all tickets submitted by logged-in author' }
        ]
      },
      {
        section: 'Admin Portal',
        routes: [
          { method: 'GET', path: '/tickets', desc: 'List ticket queue with filters (status, category, priority, search, sortBy)' },
          { method: 'PATCH', path: '/tickets/:id', desc: 'Update ticket status, override AI category, override priority, or assign', body: { status: 'string', category: 'string', priority: 'string', assigned_to: 'string' } },
          { method: 'POST', path: '/tickets/:id/notes', desc: 'Add confidential internal note (admin only)', body: { content: 'string' } },
          { method: 'POST', path: '/tickets/:id/regenerate-ai', desc: 'Re-trigger AI draft response generation' },
          { method: 'GET', path: '/admin/metrics', desc: 'Operations metrics, queue volume, and AI performance' },
          { method: 'GET', path: '/admin/ai-status', desc: 'Current active AI model provider and configuration status' }
        ]
      },
      {
        section: 'Shared Ticket Communication',
        routes: [
          { method: 'GET', path: '/tickets/:id', desc: 'Get full ticket details, conversation thread, and author/book context' },
          { method: 'POST', path: '/tickets/:id/messages', desc: 'Send response or reply to ticket thread', body: { content: 'string', is_ai_drafted: 'boolean (optional)' } }
        ]
      }
    ]
  });
});

// Serve frontend build if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientDistPath));

// Fallback handler compatible with Express 5
app.use((req, res, next) => {
  // If requesting an API route that wasn't caught, return 404 JSON
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ success: false, error: `API route ${req.method} ${req.url} not found.` });
  }
  // Otherwise serve client SPA index.html if available
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.status(200).send('BookLeaf API is running. Client build not yet generated.');
    }
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred.'
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await db.initSchema();

    // Auto-seed on first launch or ephemeral cloud restarts (Render/Railway)
    const authorCheck = await db.get('SELECT COUNT(*) as count FROM authors');
    if (!authorCheck || authorCheck.count === 0) {
      console.log('No authors found in database. Auto-seeding initial BookLeaf dataset...');
      const seed = require('./scripts/seed');
      await seed();
    }

    server.listen(PORT, () => {
      console.log(`======================================================`);
      console.log(` BookLeaf Publishing Support Portal Server Active     `);
      console.log(` Port: http://localhost:${PORT}                      `);
      console.log(` API Docs: http://localhost:${PORT}/api/docs         `);
      console.log(`======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, server, startServer };
