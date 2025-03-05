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

// Get all items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting items:', err);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

// Get a single item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting item:', err);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// Create a new item
router.post('/', async (req, res) => {
  try {
    const { name, price, stock } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await pool.query(
      'INSERT INTO items (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
      [name, price, stock || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating item:', err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update an item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const result = await pool.query(
      'UPDATE items SET name = $1, price = $2, stock = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, price, stock || 0, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating item:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete an item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM items WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = router;
