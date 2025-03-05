const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Get current terms & conditions
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT content FROM terms ORDER BY created_at DESC LIMIT 1'
    );
    
    if (result.rows.length === 0) {
      return res.json({ content: '' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting terms:', err);
    res.status(500).json({ error: 'Failed to get terms & conditions' });
  }
});

// Update terms & conditions
router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const result = await pool.query(
      'INSERT INTO terms (content) VALUES ($1) RETURNING *',
      [content]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error saving terms:', err);
    res.status(500).json({ error: 'Failed to save terms & conditions' });
  }
});

module.exports = router;
