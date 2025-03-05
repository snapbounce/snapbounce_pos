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

// Get daily report
router.get('/daily-report', async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as total_sales,
        COALESCE(AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END), 0) as average_transaction,
        COUNT(CASE WHEN status = 'voided' THEN 1 END) as voided_transactions
      FROM transactions 
      WHERE DATE(transaction_date AT TIME ZONE 'UTC') = DATE($1 AT TIME ZONE 'UTC')
    `;
    
    const summaryResult = await pool.query(summaryQuery, [startDate]);
    
    // Get detailed transactions
    const transactionsQuery = `
      SELECT 
        t.id,
        t.total_amount,
        t.items_count,
        t.transaction_date,
        t.status,
        t.voided_at,
        COALESCE(
          json_agg(
            CASE WHEN ti.id IS NOT NULL THEN
              json_build_object(
                'item_id', i.id,
                'item_name', i.name,
                'quantity', ti.quantity,
                'price', ti.price_at_time
              )
            ELSE NULL END
          ) FILTER (WHERE ti.id IS NOT NULL),
          '[]'
        ) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN items i ON ti.item_id = i.id
      WHERE DATE(t.transaction_date AT TIME ZONE 'UTC') = DATE($1 AT TIME ZONE 'UTC')
      GROUP BY t.id
      ORDER BY t.transaction_date DESC
    `;
    
    const transactionsResult = await pool.query(transactionsQuery, [startDate]);
    
    res.json({
      summary: {
        ...summaryResult.rows[0],
        date: startDate.toISOString().split('T')[0]
      },
      transactions: transactionsResult.rows
    });
  } catch (err) {
    console.error('Error fetching daily report:', err);
    res.status(500).json({ error: 'Failed to fetch daily report' });
  }
});

// Get all transactions for a date
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    const startDate = date ? new Date(date) : new Date();
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(23, 59, 59, 999);

    const result = await pool.query(
      `SELECT t.*, 
        json_agg(json_build_object(
          'item_id', i.id,
          'item_name', i.name,
          'quantity', ti.quantity,
          'price', ti.price_at_time
        )) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN items i ON ti.item_id = i.id
      WHERE t.transaction_date BETWEEN $1 AND $2
      GROUP BY t.id
      ORDER BY t.transaction_date DESC`,
      [startDate, endDate]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting transactions:', err);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Create a new transaction
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Invalid items');
    }

    // Calculate total amount and items count
    let totalAmount = 0;
    let itemsCount = 0;
    
    // Create initial transaction
    const transactionResult = await client.query(
      'INSERT INTO transactions DEFAULT VALUES RETURNING id'
    );
    const transactionId = transactionResult.rows[0].id;

    // Process each item
    for (const item of items) {
      // Check stock
      const stockResult = await client.query(
        'SELECT stock, price FROM items WHERE id = $1',
        [item.id]
      );
      
      if (stockResult.rows.length === 0) {
        throw new Error(`Item ${item.id} not found`);
      }
      
      const currentStock = stockResult.rows[0].stock;
      const currentPrice = stockResult.rows[0].price;
      
      if (currentStock < item.quantity) {
        throw new Error(`Insufficient stock for item ${item.id}`);
      }

      // Add to transaction_items
      await client.query(
        'INSERT INTO transaction_items (transaction_id, item_id, quantity, price_at_time) VALUES ($1, $2, $3, $4)',
        [transactionId, item.id, item.quantity, currentPrice]
      );

      // Update stock
      await client.query(
        'UPDATE items SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );

      // Update totals
      totalAmount += currentPrice * item.quantity;
      itemsCount += item.quantity;
    }

    // Update transaction with final totals
    await client.query(
      'UPDATE transactions SET total_amount = $1, items_count = $2 WHERE id = $3',
      [totalAmount, itemsCount, transactionId]
    );

    await client.query('COMMIT');
    
    // Get complete transaction details
    const result = await client.query(
      `SELECT t.*, 
        json_agg(json_build_object(
          'item_id', i.id,
          'item_name', i.name,
          'quantity', ti.quantity,
          'price', ti.price_at_time
        )) as items
      FROM transactions t
      LEFT JOIN transaction_items ti ON t.id = ti.transaction_id
      LEFT JOIN items i ON ti.item_id = i.id
      WHERE t.id = $1
      GROUP BY t.id`,
      [transactionId]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction:', err);
    res.status(500).json({ error: err.message || 'Failed to create transaction' });
  } finally {
    client.release();
  }
});

// Void a transaction
router.post('/:id/void', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if transaction exists and isn't already voided
    const transactionResult = await client.query(
      'SELECT status FROM transactions WHERE id = $1',
      [id]
    );
    
    if (transactionResult.rows.length === 0) {
      throw new Error('Transaction not found');
    }
    
    if (transactionResult.rows[0].status === 'voided') {
      throw new Error('Transaction is already voided');
    }

    // Get transaction items
    const itemsResult = await client.query(
      'SELECT item_id, quantity FROM transaction_items WHERE transaction_id = $1',
      [id]
    );

    // Restore stock for each item
    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE items SET stock = stock + $1 WHERE id = $2',
        [item.quantity, item.item_id]
      );
    }

    // Update transaction status
    await client.query(
      'UPDATE transactions SET status = $1, voided_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['voided', id]
    );

    await client.query('COMMIT');
    
    res.json({ message: 'Transaction voided successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error voiding transaction:', err);
    res.status(500).json({ error: err.message || 'Failed to void transaction' });
  } finally {
    client.release();
  }
});

module.exports = router;
