import React, { useState, useEffect } from 'react';
import './AdminInterface.css';

export default function AdminInterface() {
  const [items, setItems] = useState([]);
  const [dailyReport, setDailyReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', stock: '' });

  useEffect(() => {
    fetchItems();
    fetchDailyReport();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/items');
      if (!response.ok) {
        throw new Error('Failed to fetch items');
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

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/daily-report');
      if (!response.ok) {
        throw new Error('Failed to fetch daily report');
      }
      const data = await response.json();
      setDailyReport(data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
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
        throw new Error('Failed to create item');
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
        throw new Error('Failed to update item');
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
        throw new Error('Failed to delete item');
      }
      await fetchItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    const number = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(number) ? '0.00' : number.toFixed(2);
  };

  return (
    <div className="admin-interface">
      <h1>Admin Dashboard</h1>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <section className="daily-report">
        <h2>Daily Report</h2>
        {loading ? (
          <div className="loading">Loading report...</div>
        ) : dailyReport ? (
          <div className="report-content">
            <div className="report-summary">
              <div className="summary-item">
                <label>Date:</label>
                <span>{new Date(dailyReport.date).toLocaleDateString()}</span>
              </div>
              <div className="summary-item">
                <label>Total Transactions:</label>
                <span>{dailyReport.total_transactions}</span>
              </div>
              <div className="summary-item">
                <label>Total Sales:</label>
                <span>${formatPrice(dailyReport.total_sales || 0)}</span>
              </div>
            </div>
            <div className="report-transactions">
              <h3>Today's Transactions</h3>
              {dailyReport.transactions?.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyReport.transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.transaction_date).toLocaleTimeString()}</td>
                        <td>
                          <ul>
                            {transaction.items.map((item, index) => (
                              <li key={index}>
                                {item.item_name} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>${formatPrice(transaction.total_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No transactions today</p>
              )}
            </div>
          </div>
        ) : (
          <div>No report available</div>
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
