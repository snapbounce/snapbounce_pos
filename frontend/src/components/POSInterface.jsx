import { useState, useEffect } from 'react';

export default function POSInterface() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (showTransactionsModal) {
      console.log('Modal opened, fetching transactions...');
      fetchTransactions();
    }
  }, [showTransactionsModal]);

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
      console.log('Starting to fetch transactions...');
      setLoading(true);
      setError(null);
      const response = await fetch('http://localhost:3000/api/transactions');
      console.log('API Response:', response);
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      const data = await response.json();
      console.log('Fetched transactions:', data);
      setTransactions(data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      console.log('Setting mock data...');
      // Fallback to mock transactions if API fails
      const mockTransactions = [
        {
          id: 1,
          transaction_date: '2025-03-07T06:17:00',
          items: [
            { item_name: 'bouncy castle 1', quantity: 2, price: 1.00 },
            { item_name: 'haji belonn', quantity: 1, price: 1.00 }
          ],
          total_amount: 3.00,
          status: 'completed'
        },
        {
          id: 2,
          transaction_date: '2025-03-06T09:36:00',
          items: [
            { item_name: 'bouncy castle', quantity: 3, price: 1.00 }
          ],
          total_amount: 3.00,
          status: 'voided'
        },
        {
          id: 3,
          transaction_date: '2025-03-06T09:33:00',
          items: [
            { item_name: 'bouncy castle 1', quantity: 1, price: 1.00 },
            { item_name: 'err', quantity: 1, price: 11.00 }
          ],
          total_amount: 12.00,
          status: 'completed'
        }
      ];
      console.log('Mock transactions:', mockTransactions);
      setTransactions(mockTransactions);
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

  const updateQuantity = (index, delta) => {
    setCart(cart.map((item, i) => {
      if (i === index) {
        const newQuantity = item.quantity + delta;
        const maxQuantity = items.find(i => i.id === item.id)?.stock || 0;
        if (newQuantity <= 0) return null;
        if (newQuantity > maxQuantity) return item;
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(Boolean));
  };

  const calculateTotal = () => {
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
    <div className="pos-interface">
      <div className="pos-container">
        <div className="main-content">
          <div className="items-section">
            <div className="section-header">
              <h2>Available Items</h2>
            </div>
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="cart-section">
            <div className="section-header">
              <h2>Current Transaction</h2>
              <button 
                className="view-transactions-btn"
                onClick={() => setShowTransactionsModal(true)}
              >
                View Transactions
              </button>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>No items in cart</p>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">
                          ${formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                      <div className="cart-item-quantity">
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(index, -1)}
                        >
                          -
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          className="quantity-btn"
                          onClick={() => updateQuantity(index, 1)}
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
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total:</span>
                    <span>${formatPrice(calculateTotal())}</span>
                  </div>
                  <button 
                    className="checkout-btn"
                    onClick={handleCheckout}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Checkout'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showConfirmation && (
        <div className="modal-overlay">
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
                    <div className="item-details">
                      <span className="item-name">
                        {item.name}
                      </span>
                      <span className="item-quantity">
                        × {item.quantity}
                      </span>
                    </div>
                    <span className="item-price">
                      ${formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="confirmation-total">
                  <span>Total:</span>
                  <span>${formatPrice(calculateTotal())}</span>
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

      {showTransactionsModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Recent Transactions</h2>
              <button onClick={() => setShowTransactionsModal(false)} className="close-btn">×</button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading">Loading transactions...</div>
              ) : error ? (
                <div className="error-message">{error}</div>
              ) : transactions.length === 0 ? (
                <div className="no-transactions">
                  <p>No transactions found</p>
                </div>
              ) : (
                <div className="transactions-list">
                  {transactions.map(transaction => {
                    console.log('Rendering transaction:', transaction);
                    return (
                      <div key={transaction.id} className="transaction-card">
                        <div className="transaction-header">
                          <div className="transaction-date">
                            {new Date(transaction.transaction_date).toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="transaction-status">
                            <span className={`status-badge ${transaction.status}`}>
                              {transaction.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="transaction-items">
                          {transaction.items && transaction.items.map((item, index) => (
                            <div key={index} className="item-row">
                              <span>{item.item_name} × {item.quantity}</span>
                              <span>${formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="transaction-total">
                          <span>Total</span>
                          <span>${formatPrice(transaction.total_amount)}</span>
                        </div>

                        {transaction.status === 'completed' && (
                          <div className="transaction-actions">
                            <button
                              className="void-btn"
                              onClick={() => voidTransaction(transaction.id)}
                              disabled={loading}
                            >
                              Void Transaction
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
