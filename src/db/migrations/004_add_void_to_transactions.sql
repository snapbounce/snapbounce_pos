-- Add status and voided_at columns to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed',
ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
