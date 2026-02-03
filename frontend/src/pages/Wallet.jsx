import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import "./wallet.css";
import { CiWallet } from "react-icons/ci";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { FaCoins, FaHistory } from "react-icons/fa";
import { BiPurchaseTag } from "react-icons/bi";

export default function Wallet({ onClose, isModal, walletBalance: propWalletBalance, setWalletBalance: propSetWalletBalance, hintsRemaining, setHintsRemaining }) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [loaded, setLoaded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // Use prop balance if in modal mode, otherwise use local state
  const [localWalletBalance, setLocalWalletBalance] = useState(100);
  const walletBalance = isModal ? propWalletBalance : localWalletBalance;
  const setWalletBalance = isModal ? propSetWalletBalance : setLocalWalletBalance;
  const [transactions, setTransactions] = useState([
    { id: 1, type: 'credit', amount: 100, description: 'Welcome Bonus', date: '2026-02-02' },
    { id: 2, type: 'debit', amount: 10, description: 'Purchased 1 Hint', date: '2026-02-02' }
  ]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePurchaseHints = (amount, coins) => {
    if (walletBalance >= coins) {
      setWalletBalance(walletBalance - coins);
      if (isModal && setHintsRemaining) {
        setHintsRemaining(prev => prev + amount);
      }
      const newTransaction = {
        id: transactions.length + 1,
        type: 'debit',
        amount: coins,
        description: `Purchased ${amount} Hint${amount > 1 ? 's' : ''}`,
        date: new Date().toISOString().split('T')[0]
      };
      setTransactions([newTransaction, ...transactions]);
      alert(`✅ Successfully purchased ${amount} hint${amount > 1 ? 's' : ''}!`);
    } else {
      alert('❌ Insufficient balance!');
    }
  };

  const handleAddCoins = (coins) => {
    setWalletBalance(walletBalance + coins);
    const newTransaction = {
      id: transactions.length + 1,
      type: 'credit',
      amount: coins,
      description: `Added ${coins} Coins`,
      date: new Date().toISOString().split('T')[0]
    };
    setTransactions([newTransaction, ...transactions]);
  };

  return (
    <div className={isModal ? "wallet-container-modal" : "wallet-page"} data-theme={darkMode ? 'dark' : 'light'} style={isModal ? {position: 'relative'} : {}}>
      {/* Dark Mode Toggle - Top Left */}
      {!isModal && (
        <div style={{ position: 'fixed', top: windowWidth <= 480 ? '10px' : '20px', left: windowWidth <= 480 ? '10px' : '20px', zIndex: 10000 }}>
          <button
            onClick={toggleDarkMode}
            style={{
              backgroundColor: darkMode ? 'transparent' : 'transparent',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              borderRadius: '50%',
              width: windowWidth <= 480 ? '36px' : '40px',
              height: windowWidth <= 480 ? '36px' : '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              color: darkMode ? '#ffd700' : '#ff9800'
            }}
            onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
          >
            {darkMode ? <IoSunnyOutline size={windowWidth <= 480 ? 18 : windowWidth <= 768 ? 20 : 22} /> : <IoMoonOutline size={windowWidth <= 480 ? 18 : windowWidth <= 768 ? 20 : 22} />}
          </button>
        </div>
      )}

      <div className={`wallet-container ${loaded ? 'slide-down' : ''}`}>
        <h1 className="wallet-heading">
          <CiWallet /> My Wallet
        </h1>

        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-icon">
            <FaCoins />
          </div>
          <div className="balance-info">
            <p className="balance-label">Current Balance</p>
            <h2 className="balance-amount">{walletBalance} Coins</h2>
          </div>
        </div>

        {/* Add Coins Section */}
        <div className="section-card">
          <h3 className="section-title">
            <BiPurchaseTag /> Add Coins
          </h3>
          <div className="coin-options">
            <button className="coin-btn" onClick={() => handleAddCoins(50)}>
              <span className="coin-amount">50 Coins</span>
              <span className="coin-price">$5.00</span>
            </button>
            <button className="coin-btn" onClick={() => handleAddCoins(100)}>
              <span className="coin-amount">100 Coins</span>
              <span className="coin-price">$9.00</span>
            </button>
            <button className="coin-btn popular" onClick={() => handleAddCoins(250)}>
              <span className="popular-badge">Popular</span>
              <span className="coin-amount">250 Coins</span>
              <span className="coin-price">$20.00</span>
            </button>
            <button className="coin-btn" onClick={() => handleAddCoins(500)}>
              <span className="coin-amount">500 Coins</span>
              <span className="coin-price">$35.00</span>
            </button>
          </div>
        </div>

        {/* Purchase Hints Section */}
        <div className="section-card">
          <h3 className="section-title">
            💡 Purchase Hints
          </h3>
          <div className="hint-options">
            <button className="hint-btn" onClick={() => handlePurchaseHints(1, 10)}>
              <span className="hint-amount">1 Hint</span>
              <span className="hint-cost">10 Coins</span>
            </button>
            <button className="hint-btn" onClick={() => handlePurchaseHints(5, 45)}>
              <span className="hint-amount">5 Hints</span>
              <span className="hint-cost">45 Coins</span>
              <span className="hint-save">Save 5 coins!</span>
            </button>
            <button className="hint-btn" onClick={() => handlePurchaseHints(10, 80)}>
              <span className="hint-amount">10 Hints</span>
              <span className="hint-cost">80 Coins</span>
              <span className="hint-save">Save 20 coins!</span>
            </button>
          </div>
        </div>

        {/* Transaction History */}
        <div className="section-card">
          <h3 className="section-title">
            <FaHistory /> Transaction History
          </h3>
          <div className="transactions-list">
            {transactions.length === 0 ? (
              <p className="no-transactions">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-info">
                    <span className="transaction-desc">{transaction.description}</span>
                    <span className="transaction-date">{transaction.date}</span>
                  </div>
                  <span className={`transaction-amount ${transaction.type}`}>
                    {transaction.type === 'credit' ? '+' : '-'}{transaction.amount} coins
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="wallet-actions">
          {isModal ? (
            <button className="btn-back" onClick={onClose} style={{width: '100%'}}>
              Close
            </button>
          ) : (
            <>
              <button className="btn-back" onClick={() => navigate(-1)}>
                Back
              </button>
              <button className="btn-home" onClick={() => navigate("/landing")}>
                Home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
