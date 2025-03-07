import { useState, useEffect } from 'react';

export default function POSInterface() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [showTransactionsModal, setShowTransactionsModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const handleAddToCart = (item) => {
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

  const handleRemoveFromCart = (index) => {
    setCart(cart.filter((item, i) => i !== index));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setShowConfirmModal(true);
  };

  const handleConfirmTransaction = async () => {
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
      setShowConfirmModal(false);
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

  const handleViewTransactions = () => {
    setShowTransactionsModal(true);
  };

  const handleViewTransactionDetails = (transaction) => {
    setSelectedTransaction(transaction);
  };

  return (
    <div className="pos-container">
      <header className="pos-header">
        <h1>SnapBounce POS</h1>
        <button className="view-transactions-btn" onClick={handleViewTransactions}>
          View Transactions
        </button>
      </header>
      
      <div className="pos-content">
        <div className="items-panel">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading items...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>
            </div>
          ) : (
            <div className="items-grid">
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className="item-card"
                  onClick={() => handleAddToCart(item)}
                >
                  <h3>{item.name}</h3>
                  <p>${item.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-panel">
          <div className="cart-header">
            <h2>Current Transaction</h2>
          </div>
          <div className="cart-content">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span>Cart is empty</span>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item, index) => (
                    <div key={index} className="cart-item">
                      <div className="cart-item-info">
                        <span className="cart-item-name">{item.name}</span>
                        <span className="cart-item-price">${item.price.toFixed(2)}</span>
                      </div>
                      <div className="cart-item-quantity">
                        <span>x{item.quantity}</span>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveFromCart(index)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="cart-footer">
                  <div className="cart-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">${formatPrice(calculateTotal())}</span>
                  </div>
                  <button 
                    className="checkout-button"
                    onClick={handleCheckout}
                  >
                    Complete Transaction
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Confirm Transaction</h2>
              <button className="close-button" onClick={() => setShowConfirmModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="transaction-items">
                <h3>Order Summary</h3>
                {cart.map((item, index) => (
                  <div key={index} className="transaction-item">
                    <div className="item-details">
                      <span className="item-name">{item.name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="transaction-total">
                  <span>Total</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>

              <div className="terms-section">
                <h3>Terms and Conditions</h3>
                <ul>
                  <li>All sales are final</li>
                  <li>Items cannot be refunded once purchased</li>
                  <li>Check your items before completing the transaction</li>
                </ul>
              </div>

              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowConfirmModal(false)}>
                  Cancel
                </button>
                <button className="confirm-btn" onClick={handleConfirmTransaction}>
                  Confirm Transaction
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal transaction-details">
            <div className="modal-header">
              <button 
                className="back-button" 
                onClick={() => {
                  setSelectedTransaction(null);
                  setShowTransactionsModal(true);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                <span>Back</span>
              </button>
              <div className="transaction-meta">
                <span className={`transaction-status ${selectedTransaction.status.toLowerCase()}`}>
                  {selectedTransaction.status}
                </span>
              </div>
            </div>
            
            <div className="modal-content">
              <div className="transaction-items">
                <h3>Items</h3>
                {selectedTransaction.items.map((item, index) => (
                  <div key={index} className="transaction-item">
                    <div className="item-details">
                      <span className="item-name">{item.item_name}</span>
                      <span className="item-quantity">× {item.quantity}</span>
                    </div>
                    <span className="item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="transaction-total">
                  <span>Total</span>
                  <span>${selectedTransaction.total_amount.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="modal-actions transaction-actions">
                <button 
                  className="close-btn secondary-btn" 
                  onClick={() => setSelectedTransaction(null)}
                >
                  Close
                </button>
                {selectedTransaction.status !== 'VOIDED' && (
                  <button 
                    className="void-btn danger-btn" 
                    onClick={() => voidTransaction(selectedTransaction.id)}
                  >
                    Void Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showTransactionsModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Transaction History</h2>
              <button className="close-button" onClick={() => setShowTransactionsModal(false)}>×</button>
            </div>
            <div className="modal-content">
              <div className="transactions-list">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-card">
                    <div className="transaction-info">
                      <div className="transaction-header">
                        <span className="transaction-date">
                          {new Date(transaction.transaction_date).toLocaleString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span className={`transaction-status ${transaction.status.toLowerCase()}`}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className="transaction-items-summary">
                        {transaction.items.map((item, idx) => (
                          <div key={idx} className="transaction-item-brief">
                            {item.item_name} × {item.quantity} ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        ))}
                      </div>
                      <div className="transaction-total">
                        <span>Total:</span>
                        <span>${transaction.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="transaction-actions">
                      {transaction.status !== 'VOIDED' && (
                        <button
                          className="void-btn danger-btn"
                          onClick={() => voidTransaction(transaction.id)}
                        >
                          Void Transaction
                        </button>
                      )}
                      <button
                        className="view-details-btn secondary-btn"
                        onClick={() => {
                          setSelectedTransaction(transaction);
                          setShowTransactionsModal(false);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
