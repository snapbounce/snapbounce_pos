import React, { useState } from 'react';
import './PinDialog.css';

const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

const PinDialog = ({ onVerify, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        onVerify();
      } else {
        setError(data.error || 'Invalid PIN');
        setPin('');
      }
    } catch (err) {
      console.error('Error verifying PIN:', err);
      setError('Failed to verify PIN. Please try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 4) {
      setPin(value);
    }
  };

  return (
    <div className="pin-dialog-overlay">
      <div className="pin-dialog">
        <h2>Enter Admin PIN</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={pin}
            onChange={handlePinChange}
            placeholder="Enter PIN"
            maxLength={4}
            pattern="[0-9]*"
            inputMode="numeric"
            autoFocus
            disabled={isLoading}
            required
          />
          <div className="button-group">
            <button type="submit" disabled={isLoading || pin.length !== 4}>
              {isLoading ? 'Verifying...' : 'Submit'}
            </button>
            <button type="button" onClick={onCancel} disabled={isLoading}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PinDialog;
