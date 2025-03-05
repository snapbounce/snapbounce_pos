import { useState, useEffect } from 'react';

function POSInterface() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);
  const [showCheckout, setShowCheckout] = useState(false);
  const [terms, setTerms] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [showTransactions, setShowTransactions] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchTerms();
  }, []);

  useEffect(() => {
    if (showTransactions) {
      fetchTransactions();
    }
  }, [showTransactions]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/items');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTerms = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/terms');
      if (!response.ok) throw new Error('Failed to fetch terms');
      const data = await response.json();
      setTerms(data.content || '');
    } catch (error) {
      console.error('Error fetching terms:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Fetching transactions for:', today);
      const response = await fetch(`http://localhost:3000/api/transactions/daily-report?date=${today}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      console.log('Transactions data:', data);
      setTransactions(data.transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      alert('Failed to load transactions');
    }
  };

  const voidTransaction = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/transactions/${id}/void`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to void transaction');
      await fetchTransactions(); // Refresh transactions list
    } catch (error) {
      console.error('Error voiding transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const openQuantityModal = (item) => {
    setSelectedItem(item);
    setQuantityInput(1);
  };

  const addToCart = () => {
    if (!selectedItem || quantityInput < 1) return;

    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.id === selectedItem.id);
      if (existingItem) {
        return prevCart.map(cartItem =>
          cartItem.id === selectedItem.id
            ? { ...cartItem, quantity: cartItem.quantity + quantityInput }
            : cartItem
        );
      }
      return [...prevCart, { ...selectedItem, quantity: quantityInput }];
    });

    setSelectedItem(null);
    setQuantityInput(1);
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      alert('Cart is empty');
      return null;
    }

    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process transaction');
      }

      const data = await response.json();
      setCart([]);
      await fetchItems(); // Refresh items to get updated stock
      alert('Transaction completed successfully!');
      return data;
    } catch (error) {
      console.error('Transaction error:', error);
      alert(error.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    const result = await processTransaction();
    if (result) {
      setShowCheckout(false);
      await fetchTransactions(); // Refresh transactions list if it's open
    }
  };

  const renderTransactions = () => (
    <div className="modal-overlay">
      <div className="modal transactions-modal">
        <h2>Today's Transactions</h2>
        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="no-transactions">
              <p>No transactions found for today</p>
            </div>
          ) : (
            transactions.map(transaction => (
              <div key={transaction.id} className="transaction-item">
                <div className="transaction-header">
                  <span>Transaction #{transaction.id}</span>
                  <span>${Number(transaction.total_amount).toFixed(2)}</span>
                </div>
                <div className="transaction-items">
                  {transaction.items && transaction.items.map((item, index) => (
                    <div key={index} className="transaction-item-detail">
                      <span>{item.item_name} × {item.quantity}</span>
                      <span>${(Number(item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="transaction-footer">
                  <span>{new Date(transaction.transaction_date).toLocaleString()}</span>
                  {transaction.status === 'voided' ? (
                    <span className="voided-label">VOIDED</span>
                  ) : (
                    <button
                      className="void-btn"
                      onClick={() => voidTransaction(transaction.id)}
                      disabled={loading}
                    >
                      {loading ? 'Voiding...' : 'Void Transaction'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="modal-actions">
          <button className="cancel-btn" onClick={() => setShowTransactions(false)}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pos-interface">
      <section className="items-display">
        <h2>Available Items</h2>
        {loading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        <div className="items-grid">
          {items.map(item => (
            <div key={item.id} className="item-card" onClick={() => openQuantityModal(item)}>
              <h3>{item.name}</h3>
              <p className="price">${parseFloat(item.price).toFixed(2)}</p>
              <p className="stock">In Stock: {item.stock}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cart-section">
        <h2>Current Transaction</h2>
        <button className="view-transactions-btn" onClick={() => setShowTransactions(true)}>
          View Transactions
        </button>
        <div className="cart">
          {cart.length === 0 ? (
            <p className="empty-cart">No items in cart</p>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-quantity">Qty: {item.quantity}</span>
                  </div>
                  <div className="item-actions">
                    <button 
                      className="action-btn decrease"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      −
                    </button>
                    <button 
                      className="action-btn increase"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => removeFromCart(item.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="cart-summary">
          <h3>Total: ${calculateTotal().toFixed(2)}</h3>
          {cart.length > 0 && (
            <button 
              className="checkout-btn"
              onClick={() => setShowCheckout(true)}
            >
              Proceed to Checkout
            </button>
          )}
        </div>
      </section>

      {selectedItem && (
        <div className="modal-overlay">
          <div className="quantity-modal">
            <h3>Add {selectedItem.name}</h3>
            <p className="modal-price">${parseFloat(selectedItem.price).toFixed(2)} each</p>
            <div className="quantity-input">
              <label>Quantity:</label>
              <div className="quantity-controls">
                <button 
                  onClick={() => setQuantityInput(prev => Math.max(1, prev - 1))}
                  className="quantity-btn"
                >
                  -
                </button>
                <input 
                  type="number" 
                  min="1"
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button 
                  onClick={() => setQuantityInput(prev => prev + 1)}
                  className="quantity-btn"
                >
                  +
                </button>
              </div>
            </div>
            <div className="modal-total">
              Total: ${(selectedItem.price * quantityInput).toFixed(2)}
            </div>
            <div className="modal-actions">
              <button onClick={addToCart} className="add-btn">
                Add to Cart
              </button>
              <button onClick={() => setSelectedItem(null)} className="cancel-btn">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Checkout</h2>
            
            <div className="checkout-summary">
              <h3>Order Summary</h3>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="checkout-item">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="total">
                <strong>Total:</strong> ${calculateTotal().toFixed(2)}
              </div>
            </div>

            {terms && (
              <div className="terms-section">
                <h3>Terms & Conditions</h3>
                <div className="terms-content">
                  {terms}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowCheckout(false);
                }}
              >
                Cancel
              </button>
              <button 
                className="confirm-btn"
                disabled={loading}
                onClick={handleCheckout}
              >
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTransactions && renderTransactions()}
    </div>
  );
}

export default POSInterface;
