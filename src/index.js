const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const itemsRouter = require('./routes/items');
const transactionsRouter = require('./routes/transactions');
const termsRouter = require('./routes/terms');

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for frontend
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'views')));

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Initialize database
async function initializeDatabase() {
  try {
    const sqlFile = await fs.readFile(path.join(__dirname, 'db', 'init.sql'), 'utf8');
    await pool.query(sqlFile);
    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Routes
app.use('/api/items', itemsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/terms', termsRouter);

// Admin interface route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

// Items management page
app.get('/admin/items', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'items.html'));
});

// Terms page
app.get('/admin/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'terms.html'));
});

// Basic test route
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(port, '0.0.0.0', async () => {
  console.log(`Server is running on port ${port}`);
  await initializeDatabase();
});
