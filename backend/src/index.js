// Set default timezone for the application
process.env.TZ = 'Asia/Singapore';

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 3000;

// Database connection
const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'postgres',
  database: process.env.PGDATABASE || 'snapbounce_pos',
  password: process.env.PGPASSWORD || 'postgres',
  port: process.env.PGPORT || 5432,
});

// Set timezone for PostgreSQL connection
pool.on('connect', (client) => {
  client.query('SET timezone = "Asia/Singapore";');
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to database at:', res.rows[0].now);
  }
});

// CORS configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Routes
app.get('/api/items', async (req, res) => {
  try {
    console.log('GET /api/items');
    const result = await pool.query('SELECT * FROM items ORDER BY id');
    // Convert price from string to number
    const items = result.rows.map(item => ({
      ...item,
      price: parseFloat(item.price)
    }));
    console.log('Items:', items);
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    console.log('GET /api/transactions');
    const result = await pool.query(`
      SELECT 
        t.id,
        t.transaction_date,
        t.total_amount::float as total_amount,
        t.status,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'item_name', ti.item_name,
                'quantity', ti.quantity,
                'price', ti.price::float
              )
            )
            FROM transaction_items ti
            WHERE ti.transaction_id = t.id
          ),
          '[]'
        ) as items
      FROM transactions t
      ORDER BY t.transaction_date DESC
    `);
    console.log('Transactions:', result.rows);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Creating transaction:', req.body);
    
    // Create transaction
    const totalAmount = req.body.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    const transactionResult = await client.query(
      'INSERT INTO transactions (transaction_date, total_amount, status) VALUES (NOW(), $1, $2) RETURNING id',
      [totalAmount, 'completed']
    );
    
    const transactionId = transactionResult.rows[0].id;
    console.log('Created transaction:', transactionId);
    
    // Store complete item details in transaction_items
    for (const item of req.body.items) {
      console.log('Adding item to transaction:', item);
      
      // Get item name from frontend or fallback to database
      let itemName = item.name;
      if (!itemName) {
        const itemResult = await client.query('SELECT name FROM items WHERE id = $1', [item.id]);
        if (!itemResult.rows[0]) {
          throw new Error(`Item with id ${item.id} not found`);
        }
        itemName = itemResult.rows[0].name;
      }
      
      await client.query(
        'INSERT INTO transaction_items (transaction_id, item_name, quantity, price) VALUES ($1, $2, $3, $4)',
        [transactionId, itemName, item.quantity, item.price]
      );
      
      // Update item stock
      await client.query(
        'UPDATE items SET stock = stock - $1 WHERE id = $2',
        [item.quantity, item.id]
      );
    }
    
    await client.query('COMMIT');
    console.log('Transaction completed successfully');
    res.status(201).json({ id: transactionId });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

app.post('/api/transactions/:id/void', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Voiding transaction:', req.params.id);
    
    // Get transaction items
    const itemsResult = await client.query(
      'SELECT item_name, quantity FROM transaction_items WHERE transaction_id = $1',
      [req.params.id]
    );
    
    // Return items to stock
    for (const item of itemsResult.rows) {
      // Get the item id from the items table
      const itemResult = await client.query(
        'SELECT id FROM items WHERE name = $1',
        [item.item_name]
      );
      
      if (itemResult.rows.length > 0) {
        await client.query(
          'UPDATE items SET stock = stock + $1 WHERE id = $2',
          [item.quantity, itemResult.rows[0].id]
        );
      }
    }
    
    // Update transaction status
    await client.query(
      'UPDATE transactions SET status = $1, voided_at = NOW() WHERE id = $2',
      ['voided', req.params.id]
    );

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error voiding transaction:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Admin endpoints
app.get('/api/daily-report', async (req, res) => {
  try {
    const { date } = req.query;
    
    // Query for transactions on the selected date
    const result = await pool.query(`
      WITH daily_transactions AS (
        SELECT 
          t.*,
          CASE 
            WHEN t.status = 'voided' THEN 0
            ELSE t.total_amount
          END as effective_amount
        FROM transactions t
        WHERE DATE(t.transaction_date) = $1::date
      )
      SELECT 
        $1::date as date,
        COUNT(DISTINCT id) as total_transactions,
        COALESCE(SUM(effective_amount), 0) as total_sales,
        COALESCE(
          json_agg(
            json_build_object(
              'id', id,
              'transaction_date', transaction_date,
              'total_amount', total_amount::float,
              'status', status,
              'items', (
                SELECT json_agg(
                  json_build_object(
                    'item_name', ti.item_name,
                    'quantity', ti.quantity,
                    'price', ti.price::float
                  )
                )
                FROM transaction_items ti
                WHERE ti.transaction_id = dt.id
              )
            )
            ORDER BY transaction_date DESC
          ),
          '[]'
        ) as transactions
      FROM daily_transactions dt
      GROUP BY date
    `, [date]);

    const report = result.rows[0] || {
      date: date,
      total_transactions: 0,
      total_sales: 0,
      transactions: []
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

app.post('/api/items', async (req, res) => {
  try {
    console.log('POST /api/items:', req.body);
    const { name, price, stock } = req.body;
    const result = await pool.query(
      'INSERT INTO items (name, price, stock) VALUES ($1, $2, $3) RETURNING *',
      [name, price, stock]
    );
    console.log('Created item:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/items/:id', async (req, res) => {
  try {
    console.log('PUT /api/items:', req.params.id, req.body);
    const { name, price, stock } = req.body;
    const result = await pool.query(
      'UPDATE items SET name = $1, price = $2, stock = $3 WHERE id = $4 RETURNING *',
      [name, price, stock, req.params.id]
    );
    console.log('Updated item:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/items/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('DELETE /api/items:', req.params.id);
    
    // First delete from transaction_items
    await client.query('DELETE FROM transaction_items WHERE item_id = $1', [req.params.id]);
    
    // Then delete the item
    await client.query('DELETE FROM items WHERE id = $1', [req.params.id]);
    
    await client.query('COMMIT');
    console.log('Deleted item:', req.params.id);
    res.status(204).send();
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
