import { useState, useEffect } from 'react';
import './DailyReports.css';

function DailyReports() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState({
    summary: {
      total_sales: 0,
      total_transactions: 0,
      average_transaction: 0,
      voided_transactions: 0
    },
    transactions: []
  });
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    fetchDailyReport();
  }, [reportDate]);

  const fetchDailyReport = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/daily-report?date=${reportDate}`);
      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching daily report:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div className="reports-interface">
      <section className="daily-report">
        <div className="report-header">
          <h2>Daily Sales Report</h2>
          <div className="report-actions">
            <div className="date-selector">
              <input 
                type="date" 
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
              />
            </div>
            <button 
              className="print-btn"
              onClick={handlePrint}
              disabled={isPrinting}
            >
              {isPrinting ? 'Preparing Print...' : 'Print Report'}
            </button>
          </div>
        </div>
        <div id="daily-report-content">
          <div className="report-date">
            <h3>Date: {reportDate}</h3>
          </div>
          <div className="report-summary">
            <div className="summary-card">
              <h3>Total Sales</h3>
              <p className="amount">{formatCurrency(reportData.summary.total_sales)}</p>
            </div>
            <div className="summary-card">
              <h3>Total Transactions</h3>
              <p className="count">{reportData.summary.total_transactions || 0}</p>
            </div>
            <div className="summary-card">
              <h3>Average Transaction</h3>
              <p className="amount">
                {formatCurrency(
                  reportData.summary.total_transactions > 0
                    ? reportData.summary.total_sales / reportData.summary.total_transactions
                    : 0
                )}
              </p>
            </div>
            <div className="summary-card">
              <h3>Voided Transactions</h3>
              <p className="count voided">{reportData.summary.voided_transactions || 0}</p>
            </div>
          </div>
          <div className="transactions-list">
            <h3>Transaction Details</h3>
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {(reportData.transactions || []).map(transaction => (
                  <tr key={transaction.id} className={transaction.status === 'voided' ? 'voided-row' : ''}>
                    <td>
                      {new Date(transaction.transaction_date).toLocaleTimeString()}
                      {transaction.voided_at && (
                        <div className="void-time">
                          Voided: {new Date(transaction.voided_at).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <ul className="transaction-items">
                        {(transaction.items || []).map((item, index) => (
                          <li key={index}>
                            {item.item_name} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <span className={`status-badge ${transaction.status}`}>
                        {transaction.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="transaction-total">
                      {formatCurrency(transaction.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DailyReports;
