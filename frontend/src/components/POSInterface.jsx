import { useState, useEffect } from 'react';

export default function POSInterface() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (showTransactions) {
      fetchTransactions();
    }
  }, [showTransactions]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching items...');
      const response = await fetch('http://localhost:3000/api/items');
      console.log('Response:', response);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      const data = await response.json();
      console.log('Fetched items:', data);
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError(error.message);
      // Fallback to static items if API fails
      setItems([
        { id: 1, name: 'bouncy castle 1', price: 1.00, stock: 111110 },
        { id: 2, name: 'bouncy castle', price: 1.00, stock: 1000 },
        { id: 3, name: 'haji belonn', price: 1.00, stock: 100 },
        { id: 4, name: 'err', price: 11.00, stock: 0 },
        { id: 5, name: 'ewe', price: 20111.00, stock: 0 },
        { id: 6, name: 'sfas', price: 20000.00, stock: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/transactions');
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      console.log('Fetched transactions:', data);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item) => {
    if (item.stock <= 0) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      if (existingItem.quantity >= item.stock) return;
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        const maxQuantity = items.find(i => i.id === itemId)?.stock || 0;
        if (newQuantity <= 0) return null;
        if (newQuantity > maxQuantity) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setShowConfirmation(true);
  };

  const confirmTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Sending transaction:', { items: cart });
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create transaction');
      }

      // Update local items stock
      setItems(items.map(item => {
        const cartItem = cart.find(ci => ci.id === item.id);
        if (cartItem) {
          return { ...item, stock: item.stock - cartItem.quantity };
        }
        return item;
      }));

      setCart([]);
      await fetchTransactions();
      setShowConfirmation(false);
    } catch (error) {
      console.error('Error creating transaction:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const voidTransaction = async (transactionId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`http://localhost:3000/api/transactions/${transactionId}/void`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to void transaction');
      }

      await fetchTransactions();
    } catch (error) {
      console.error('Error voiding transaction:', error);
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
    <div className="main-content">
      <section className="items-section">
        <h2 className="section-header">Available Items</h2>
        {loading ? (
          <div className="loading">Loading items...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="items-grid">
            {items.map(item => (
              <div 
                key={item.id} 
                className="item-card"
                onClick={() => addToCart(item)}
              >
                <h3 className="item-name">{item.name}</h3>
                <p className="item-price">${formatPrice(item.price)}</p>
                <p className={`item-stock ${item.stock === 0 ? 'out-of-stock' : ''}`}>
                  {item.stock > 0 ? `In Stock: ${item.stock}` : 'Out of Stock'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="transaction-panel">
        <div className="transaction-header">
          <h2 className="transaction-title">Current Transaction</h2>
          <button 
            className="view-transactions"
            onClick={() => setShowTransactions(true)}
          >
            View Transactions
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {cart.length > 0 ? (
          <>
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <p className="cart-item-name">{item.name}</p>
                    <p className="cart-item-price">${formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="cart-item-actions">
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, -1)}
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      className="quantity-btn"
                      onClick={() => updateQuantity(item.id, 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="cart-summary">
              <div className="cart-total">
                <span>Total:</span>
                <span>${formatPrice(getCartTotal())}</span>
              </div>
              <button 
                className="checkout-btn"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Transaction'}
              </button>
            </div>
          </>
        ) : (
          <div className="empty-cart">
            No items in cart
          </div>
        )}
      </section>

      {showConfirmation && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Confirm Transaction</h2>
              <button 
                className="close-btn"
                onClick={() => setShowConfirmation(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="confirmation-items">
                <h3>Items:</h3>
                {cart.map(item => (
                  <div key={item.id} className="confirmation-item">
                    <span>{item.name}</span>
                    <span>× {item.quantity}</span>
                    <span>${formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="confirmation-total">
                  <span>Total:</span>
                  <span>${formatPrice(getCartTotal())}</span>
                </div>
              </div>
              <div className="terms-and-conditions">
                <h3>Terms and Conditions:</h3>
                <ul>
                  <li>All sales are final</li>
                  <li>Items cannot be refunded once purchased</li>
                  <li>Check your items before completing the transaction</li>
                </ul>
              </div>
              <div className="confirmation-actions">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowConfirmation(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn"
                  onClick={confirmTransaction}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransactions && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Recent Transactions</h2>
              <button 
                className="close-btn"
                onClick={() => setShowTransactions(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading">Loading transactions...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : transactions.length === 0 ? (
                <div className="no-transactions">No transactions found</div>
              ) : (
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td>{new Date(transaction.transaction_date).toLocaleString()}</td>
                        <td>
                          <ul className="transaction-items">
                            {transaction.items.map((item, index) => (
                              <li key={index}>
                                {item.item_name} × {item.quantity}
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td>${formatPrice(transaction.total_amount)}</td>
                        <td>
                          <span className={`status-badge ${transaction.status}`}>
                            {transaction.status.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {transaction.status === 'completed' && (
                            <button
                              className="void-btn"
                              onClick={() => voidTransaction(transaction.id)}
                              disabled={loading}
                            >
                              Void
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
