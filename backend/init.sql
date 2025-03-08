CREATE TABLE IF NOT EXISTS items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  transaction_date TIMESTAMP NOT NULL DEFAULT NOW(),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  voided_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transaction_items (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER REFERENCES transactions(id),
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL
);

-- Insert sample items
INSERT INTO items (name, price, stock) VALUES
  ('bouncy castle 1', 1.00, 111110),
  ('bouncy castle', 1.00, 1000),
  ('haji belonn', 1.00, 100),
  ('err', 11.00, 0),
  ('ewe', 20111.00, 0),
  ('sfas', 20000.00, 0)
ON CONFLICT DO NOTHING;
