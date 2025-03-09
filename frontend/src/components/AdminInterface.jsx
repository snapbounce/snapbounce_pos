import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

export default function AdminInterface() {
  const [items, setItems] = useState([]);
  const [dailyReport, setDailyReport] = useState({ transactions: [], total_transactions: 0, total_sales: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', stock: '' });
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
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete item');
      }
      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message);
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

      <section className="daily-report">
        <h2>Daily Report</h2>
        
        <div className="date-picker">
          <label htmlFor="reportDate">Select Date: </label>
          <input 
            type="date" 
            id="reportDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
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
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReport.transactions.map(transaction => (
                      <tr 
                        key={`${transaction.id}-${transaction.event_type}`}
                        className={transaction.event_type === 'void' ? 'voided-transaction' : ''}
                      >
                        <td>#{transaction.id}</td>
                        <td>
                          {formatTime(transaction.event_time)}
                          {transaction.event_type === 'void' && (
                            <span className="voided-badge">VOIDED</span>
                          )}
                        </td>
                        <td>
                          {transaction.items?.map((item, index) => (
                            <div key={index}>
                              {item.item_name} × {item.quantity}
                            </div>
                          ))}
                        </td>
                        <td>
                          {transaction.event_type === 'void' ? (
                            `-$${formatPrice(transaction.total_amount)}`
                          ) : (
                            `$${formatPrice(transaction.total_amount)}`
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
