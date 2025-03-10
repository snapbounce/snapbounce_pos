import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

export default function AdminInterface() {
  const [items, setItems] = useState([]);
  const [dailyReport, setDailyReport] = useState({ transactions: [], total_transactions: 0, total_sales: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', stock: '' });
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [transactionToVoid, setTransactionToVoid] = useState(null);
  const [adminPin, setAdminPin] = useState(() => {
    return localStorage.getItem('adminPin') || '1234';
  });
  const [showPinSettings, setShowPinSettings] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    // Get today's date in YYYY-MM-DD format for Singapore timezone
    const now = new Date();
    const year = now.toLocaleString('en-US', { timeZone: 'Asia/Singapore', year: 'numeric' });
    const month = now.toLocaleString('en-US', { timeZone: 'Asia/Singapore', month: '2-digit' });
    const day = now.toLocaleString('en-US', { timeZone: 'Asia/Singapore', day: '2-digit' });
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchDailyReport(selectedDate);
    }
  }, [selectedDate]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/items');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch items');
      }
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReport = async (date) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/daily-report?date=${date}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch daily report');
      }
      const data = await response.json();
      setDailyReport(data || { transactions: [], total_transactions: 0, total_sales: 0 });
    } catch (error) {
      console.error('Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create item');
      }
      await fetchItems();
      setNewItem({ name: '', price: '', stock: '' });
    } catch (error) {
      console.error('Error creating item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/items/${editingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingItem),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update item');
      }
      await fetchItems();
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/items/${id}`, {
        method: 'DELETE',
      });
      console.log('Delete response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to delete item';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }
      
      await fetchItems();
      console.log('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVoidTransaction = (transactionId) => {
    setTransactionToVoid(transactionId);
    setPinModalOpen(true);
    setPin(''); // Clear any previous PIN
    setError(null);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/transactions/${transactionToVoid}/void`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to void transaction');
      }
      
      await fetchDailyReport(selectedDate);
      setPinModalOpen(false);
      setPin('');
      setTransactionToVoid(null);
    } catch (error) {
      console.error('Error voiding transaction:', error);
      setError(error.message);
      setPin(''); // Clear the incorrect PIN
    } finally {
      setLoading(false);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    
    try {
      // Basic validation
      if (!newPin || !confirmNewPin) {
        throw new Error('Please enter and confirm the PIN');
      }

      if (!/^\d{4}$/.test(newPin)) {
        throw new Error('PIN must be exactly 4 digits');
      }

      if (newPin !== confirmNewPin) {
        throw new Error('PINs do not match');
      }

      setLoading(true);
      setError(null);

      console.log('Sending PIN update request');
      const response = await fetch('http://localhost:3000/api/admin/update-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pin: newPin,
          confirmPin: confirmNewPin
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update PIN');
      }

      // Update local storage and state
      localStorage.setItem('adminPin', newPin);
      setNewPin('');
      setConfirmNewPin('');
      setShowPinSettings(false);
      setError(null);
      alert(data.message || 'PIN updated successfully');
    } catch (error) {
      console.error('Error in handleChangePin:', error);
      setError(error.message || 'Failed to update PIN');
      setNewPin('');
      setConfirmNewPin('');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Singapore'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Invalid time';
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const formatPrice = (price) => {
    return Number(price || 0).toFixed(2);
  };

  // Get current date in YYYY-MM-DD format for max date
  const maxDate = new Date().toISOString().split('T')[0];

  const PinModal = () => {
    if (!pinModalOpen) return null;
    
    return (
      <div className="modal-overlay">
        <div className="modal">
          <h3>Enter Admin PIN</h3>
          <form onSubmit={handlePinSubmit}>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              required
              autoFocus
            />
            <div className="modal-buttons">
              <button type="button" onClick={() => {
                setPinModalOpen(false);
                setPin('');
                setTransactionToVoid(null);
                setError(null);
              }}>Cancel</button>
              <button type="submit">Confirm</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-interface">
      <h1>Admin Dashboard</h1>

      {error && (
        <div className="error-message">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12" y2="16"></line>
          </svg>
          {error}
        </div>
      )}

      <section className="settings-section">
        <h2>Settings</h2>
        <div className="pin-settings">
          <button onClick={() => setShowPinSettings(!showPinSettings)}>
            {showPinSettings ? 'Hide PIN Settings' : 'Change Admin PIN'}
          </button>
          
          {showPinSettings && (
            <form onSubmit={handleChangePin} className="change-pin-form">
              <div className="form-group">
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="New PIN"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  value={confirmNewPin}
                  onChange={(e) => setConfirmNewPin(e.target.value)}
                  placeholder="Confirm New PIN"
                  maxLength={4}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                />
              </div>
              <button type="submit">Save New PIN</button>
            </form>
          )}
        </div>
      </section>

      <section className="daily-report">
        <h2>Daily Report</h2>
        
        <div className="date-picker">
          <label htmlFor="reportDate">Select Date: </label>
          <input 
            type="date" 
            id="reportDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={maxDate}
          />
        </div>

        {loading ? (
          <div className="loading">Loading report...</div>
        ) : error ? (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12" y2="16"></line>
            </svg>
            {error}
          </div>
        ) : (
          <>
            <div className="report-summary">
              <div className="summary-item">
                <label>Total Transactions:</label>
                <span>{dailyReport.total_transactions}</span>
              </div>
              <div className="summary-item">
                <label>Total Sales:</label>
                <span>${formatPrice(dailyReport.total_sales)}</span>
              </div>
            </div>

            <div className="transactions-table">
              <h3>Transactions for {formatDate(selectedDate)}</h3>
              {dailyReport.transactions?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReport.transactions.map(transaction => (
                      <tr key={`transaction-${transaction.id}`} className={transaction.status === 'voided' ? 'voided-transaction' : ''}>
                        <td>#{transaction.id}</td>
                        <td>{formatTime(transaction.transaction_date)}</td>
                        <td>
                          {transaction.items?.map((item, index) => (
                            <div key={`item-${transaction.id}-${index}`}>
                              {item.item_name} × {item.quantity}
                            </div>
                          ))}
                        </td>
                        <td>${formatPrice(transaction.total_amount)}</td>
                        <td>
                          {transaction.status !== 'voided' && (
                            <button 
                              onClick={() => handleVoidTransaction(transaction.id)}
                              className="void-button"
                            >
                              Void
                            </button>
                          )}
                          {transaction.status === 'voided' && (
                            <span className="voided-badge">VOIDED</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-transactions">No transactions found for this date</div>
              )}
            </div>
          </>
        )}
        <PinModal />
      </section>

      <section className="inventory-management">
        <h2>Inventory Management</h2>
        
        <form onSubmit={handleCreateItem} className="item-form">
          <h3>Add New Item</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newItem.name}
              onChange={e => setNewItem({ ...newItem, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Price:</label>
            <input
              type="number"
              step="0.01"
              value={newItem.price}
              onChange={e => setNewItem({ ...newItem, price: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Stock:</label>
            <input
              type="number"
              value={newItem.stock}
              onChange={e => setNewItem({ ...newItem, stock: e.target.value })}
              required
            />
          </div>
          <button type="submit" disabled={loading}>Add Item</button>
        </form>

        <div className="items-list">
          <h3>Current Inventory</h3>
          {loading ? (
            <div className="loading">Loading items...</div>
          ) : items.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    {editingItem?.id === item.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            step="0.01"
                            value={editingItem.price}
                            onChange={e => setEditingItem({ ...editingItem, price: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editingItem.stock}
                            onChange={e => setEditingItem({ ...editingItem, stock: e.target.value })}
                          />
                        </td>
                        <td>
                          <button onClick={handleUpdateItem}>Save</button>
                          <button onClick={() => setEditingItem(null)}>Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{item.name}</td>
                        <td>${formatPrice(item.price)}</td>
                        <td>{item.stock}</td>
                        <td>
                          <button onClick={() => setEditingItem(item)}>Edit</button>
                          <button onClick={() => handleDeleteItem(item.id)}>Delete</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No items in inventory</p>
          )}
        </div>
      </section>
    </div>
  );
}
