import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import { 
  IoGameControllerOutline, 
  IoTrophyOutline, 
  IoCloseCircleOutline,
  IoStatsChartOutline,
  IoBarChartOutline,
  IoPieChartOutline,
  IoTrendingUpOutline,
  IoSpeedometerOutline,
  IoTimeOutline,
  IoFlashOutline,
  IoMoonOutline,
  IoSunnyOutline
} from "react-icons/io5";
import { MdLeaderboard, MdLogout } from "react-icons/md";
import { RiAccountCircleLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import "./analytics.css";

export default function Analytics() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [loaded, setLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [gameHistory, setGameHistory] = useState([]);
  const [stats, setStats] = useState({
    totalGames: 0,
    totalWins: 0,
    totalLosses: 0,
    bestScore: 0,
    averageScore: 0,
    winRate: 0
  });

  useEffect(() => {
    // Load user profile
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }

    // Fetch analytics data from API
    fetchAnalytics();
    setTimeout(() => setLoaded(true), 100);
  }, []);

  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail') || 'anonymous@example.com';
      const response = await fetch(`http://127.0.0.1:8000/api/crossword/analytics?email=${userEmail}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
      // Set mock data if API fails
      setStats({
        totalGames: 1,
        totalWins: 1,
        totalLosses: 0,
        bestScore: 14.00,
        averageScore: 14.00,
        winRate: 100
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const fetchGameHistory = async () => {
    try {
      const userEmail = localStorage.getItem('userEmail') || 'anonymous@example.com';
      const response = await fetch(`http://127.0.0.1:8000/api/crossword/game-history?email=${userEmail}`);
      
      if (response.ok) {
        const data = await response.json();
        setGameHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch game history:", error);
    }
  };

  const openModal = async (type) => {
    setModalType(type);
    setShowModal(true);
    
    // Fetch game history if needed for detailed views
    if (type === 'attempts' || type === 'progression' || type === 'timeSeries') {
      await fetchGameHistory();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalType('');
  };

  const renderModalContent = () => {
    switch(modalType) {
      case 'attempts':
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Game Attempts</h2>
            {gameHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', fontWeight: 'normal', fontSize: '22px', lineHeight: '33px' }}>No game history found</p>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {gameHistory.map((game, index) => (
                  <div key={index} style={{
                    padding: '15px',
                    marginBottom: '10px',
                    backgroundColor: game.status === 1 ? '#e8f5e9' : '#ffebee',
                    borderRadius: '8px',
                    border: `1px solid ${game.status === 1 ? '#4caf50' : '#f44336'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <strong>Puzzle #{game.puzzleId}</strong>
                      <span style={{ color: game.status === 1 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                        {game.status === 1 ? '✓ Win' : '✗ Loss'}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#666' }}>
                      Score: {game.score} | Duration: {game.duration}s | {new Date(game.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      
      case 'winloss':
        const winPercentage = stats.totalGames > 0 ? (stats.totalWins / stats.totalGames * 100).toFixed(1) : 0;
        const lossPercentage = stats.totalGames > 0 ? (stats.totalLosses / stats.totalGames * 100).toFixed(1) : 0;
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Win/Loss Breakdown</h2>
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
              <div style={{
                flex: 1,
                padding: '30px',
                backgroundColor: '#e8f5e9',
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #4caf50'
              }}>
                <IoTrophyOutline size={48} style={{ color: '#4caf50', marginBottom: '10px' }} />
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4caf50' }}>{stats.totalWins}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Wins ({winPercentage}%)</div>
              </div>
              <div style={{
                flex: 1,
                padding: '30px',
                backgroundColor: '#ffebee',
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #f44336'
              }}>
                <IoCloseCircleOutline size={48} style={{ color: '#f44336', marginBottom: '10px' }} />
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#f44336' }}>{stats.totalLosses}</div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>Losses ({lossPercentage}%)</div>
              </div>
            </div>
            <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              <div style={{ fontSize: '18px', color: '#333', marginBottom: '10px' }}>
                <strong>Overall Win Rate: {stats.winRate}%</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Total Games Played: {stats.totalGames}
              </div>
            </div>
          </div>
        );
      
      case 'progression':
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Score Progression</h2>
            {gameHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', fontWeight: 'normal', fontSize: '22px', lineHeight: '33px' }}>No game history to show progression</p>
            ) : (
              <div>
                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3377FF' }}>
                        {gameHistory[0]?.score || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>First Game</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                        {gameHistory[gameHistory.length - 1]?.score || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Latest Game</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                        {stats.bestScore.toFixed(2)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>Best Score</div>
                    </div>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '15px', color: '#666' }}>Recent Games Timeline</h4>
                  {gameHistory.slice().reverse().map((game, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ fontSize: '14px', color: '#666' }}>
                        {new Date(game.date).toLocaleDateString()}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3377FF' }}>
                        {game.score}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      case 'distribution':
        const scoreRanges = {
          '0-5': 0,
          '6-10': 0,
          '11-15': 0,
          '16-20': 0,
          '20+': 0
        };
        gameHistory.forEach(game => {
          const score = parseFloat(game.score);
          if (score <= 5) scoreRanges['0-5']++;
          else if (score <= 10) scoreRanges['6-10']++;
          else if (score <= 15) scoreRanges['11-15']++;
          else if (score <= 20) scoreRanges['16-20']++;
          else scoreRanges['20+']++;
        });
        
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Score Distribution</h2>
            <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
              {Object.entries(scoreRanges).map(([range, count]) => {
                const percentage = gameHistory.length > 0 ? (count / gameHistory.length * 100).toFixed(1) : 0;
                return (
                  <div key={range} style={{ marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '500' }}>Score Range: {range}</span>
                      <span style={{ fontSize: '14px', color: '#666' }}>{count} games ({percentage}%)</span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '20px', 
                      backgroundColor: '#ddd', 
                      borderRadius: '10px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: '#3377FF',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      
      case 'performance':
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Performance Metrics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={{ padding: '20px', backgroundColor: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
                <IoTrophyOutline size={32} style={{ color: '#2196f3', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>
                  {stats.averageScore.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Average Score</div>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
                <IoFlashOutline size={32} style={{ color: '#ff9800', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                  {stats.bestScore.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Best Score</div>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
                <IoStatsChartOutline size={32} style={{ color: '#4caf50', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                  {stats.winRate}%
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Win Rate</div>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#f3e5f5', borderRadius: '8px', textAlign: 'center' }}>
                <IoGameControllerOutline size={32} style={{ color: '#9c27b0', marginBottom: '10px' }} />
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9c27b0' }}>
                  {stats.totalGames}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>Total Games</div>
              </div>
            </div>
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              backgroundColor: '#fff8e1', 
              borderRadius: '8px',
              border: '1px solid #ffc107'
            }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '5px' }}>
                <strong>Performance Rating:</strong>
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ff9800' }}>
                {stats.winRate >= 70 ? 'Excellent' : stats.winRate >= 50 ? 'Good' : stats.winRate >= 30 ? 'Average' : 'Needs Improvement'}
              </div>
            </div>
          </div>
        );
      
      case 'timeSeries':
        return (
          <div>
            <h2 style={{ marginBottom: '20px', color: '#333', fontWeight: 'bold', fontSize: '36px', lineHeight: '46.8px' }}>Time Series Analysis</h2>
            {gameHistory.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666', fontWeight: 'normal', fontSize: '22px', lineHeight: '33px' }}>No game history to analyze</p>
            ) : (
              <div>
                <div style={{ padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '15px', color: '#666' }}>Games Played Over Time</h4>
                  <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>First Game:</span>
                      <strong>{new Date(gameHistory[0]?.date).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>Latest Game:</span>
                      <strong>{new Date(gameHistory[gameHistory.length - 1]?.date).toLocaleDateString()}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <span>Total Games:</span>
                      <strong>{gameHistory.length}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <h4 style={{ marginBottom: '15px', color: '#666' }}>Chronological History</h4>
                  {gameHistory.map((game, index) => (
                    <div key={index} style={{
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '6px',
                      border: '1px solid #ddd'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                            Game #{index + 1}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            {new Date(game.date).toLocaleString()}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3377FF' }}>
                            {game.score}
                          </div>
                          <div style={{ fontSize: '12px', color: game.status === 1 ? '#4caf50' : '#f44336' }}>
                            {game.status === 1 ? 'Win' : 'Loss'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>No content available</div>;
    }
  };

  return (
    <div className={`analytics-page ${loaded ? 'fade-in' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Profile Icon - Top Right */}
      <div 
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}
        onMouseEnter={() => setShowProfileDropdown(true)}
        onMouseLeave={() => setShowProfileDropdown(false)}
      >
        <CgProfile 
          size={windowWidth <= 480 ? 24 : windowWidth <= 768 ? 28 : 36} 
          style={{ cursor: 'pointer', color: darkMode ? '#fff' : '#ffffff' }}
        />
        {showProfileDropdown && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: windowWidth <= 480 ? '30px' : windowWidth <= 768 ? '35px' : '40px',
            transform: 'translateY(-50%)',
            backgroundColor: darkMode ? '#2d2d2d' : 'white',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderRadius: windowWidth <= 480 ? '8px' : '12px',
            padding: windowWidth <= 480 ? '12px' : '16px',
            minWidth: windowWidth <= 480 ? '180px' : windowWidth <= 768 ? '200px' : '220px',
            zIndex: 10001,
            border: `1px solid ${darkMode ? '#444' : '#e0e0e0'}`
          }}
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
                <div style={{
                  marginBottom: windowWidth <= 480 ? '10px' : '12px',
                  paddingBottom: windowWidth <= 480 ? '10px' : '12px',
                  borderBottom: `1px solid ${darkMode ? '#444' : '#f0f0f0'}`
                }}>
                  <div style={{
                    fontSize: windowWidth <= 480 ? '10px' : '12px',
                    color: darkMode ? '#aaa' : '#999',
                    marginBottom: '4px',
                    fontWeight: '500'
                  }}>
                    Email
                  </div>
                  <div style={{
                    fontSize: windowWidth <= 480 ? '12px' : '14px',
                    color: darkMode ? '#fff' : '#333',
                    wordBreak: 'break-word'
                  }}>
                    {userProfile?.email || localStorage.getItem('userEmail') || 'user@example.com'}
                  </div>
                </div>
                <button 
                  onClick={handleLogout} 
                  style={{
                    width: '100%',
                    padding: windowWidth <= 480 ? '8px 12px' : '10px 16px',
                    backgroundColor: '#3377FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: windowWidth <= 480 ? '6px' : '8px',
                    cursor: 'pointer',
                    fontSize: windowWidth <= 480 ? '12px' : '14px',
                    fontWeight: '600',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#3377FF'}
                >
                  Logout
                </button>
          </div>
        )}
      </div>

      {/* Dark Mode Toggle - Top Left */}
      <div 
        style={{ 
          position: 'fixed', 
          top: '20px', 
          left: '20px', 
          zIndex: 10000 
        }}
      >
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
            color: darkMode ? '#f1f1f1' : '#ffffff'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          {darkMode ? <IoSunnyOutline size={20} /> : <IoMoonOutline size={20} />}
        </button>
      </div>

      <div className="analytics-container" style={{
        backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
        color: darkMode ? '#fff' : '#333',
        transition: 'all 0.3s'
      }}>
        {/* Header */}
        <div className="analytics-header" style={{
          backgroundColor: darkMode ? '#2d2d2d' : undefined,
          color: darkMode ? '#fff' : undefined
        }}>
          <div className="header-content">
            <IoStatsChartOutline className="header-icon" style={{ color: darkMode ? '#fff' : undefined }} />
            <h1>Performance Analytics</h1>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <IoGameControllerOutline className="stat-icon" />
            <div className="stat-label">TOTAL GAMES</div>
            <div className="stat-value">{stats.totalGames}</div>
          </div>

          <div className="stat-card">
            <IoTrophyOutline className="stat-icon green" />
            <div className="stat-label">TOTAL WINS</div>
            <div className="stat-value">{stats.totalWins}</div>
          </div>

          <div className="stat-card">
            <IoCloseCircleOutline className="stat-icon red" />
            <div className="stat-label">TOTAL LOSSES</div>
            <div className="stat-value">{stats.totalLosses}</div>
          </div>

          <div className="stat-card highlight">
            <IoTrophyOutline className="stat-icon gold" />
            <div className="stat-label">BEST SCORE</div>
            <div className="stat-value">{stats.bestScore.toFixed(2)}</div>
          </div>

          <div className="stat-card">
            <IoBarChartOutline className="stat-icon" />
            <div className="stat-label">AVERAGE SCORE</div>
            <div className="stat-value">{stats.averageScore.toFixed(2)}</div>
          </div>

          <div className="stat-card">
            <IoFlashOutline className="stat-icon blue" />
            <div className="stat-label">WIN RATE</div>
            <div className="stat-value">{stats.winRate}%</div>
          </div>
        </div>

        {/* Analytics Buttons */}
        <div className="analytics-buttons">
          <button className="analytics-btn" onClick={() => openModal('attempts')}>
            <IoStatsChartOutline /> Attempts
          </button>
          <button className="analytics-btn" onClick={() => openModal('winloss')}>
            <IoPieChartOutline /> Win/Loss
          </button>
          <button className="analytics-btn" onClick={() => openModal('progression')}>
            <IoTrendingUpOutline /> Progression
          </button>
          <button className="analytics-btn" onClick={() => openModal('distribution')}>
            <IoBarChartOutline /> Distribution
          </button>
          <button className="analytics-btn" onClick={() => openModal('performance')}>
            <IoSpeedometerOutline /> Performance
          </button>
          <button className="analytics-btn" onClick={() => openModal('timeSeries')}>
            <IoTimeOutline /> Time Series
          </button>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn green" onClick={() => navigate("/leaderboard")}>
            <MdLeaderboard /> Leaderboard
          </button>
          <button className="action-btn blue" onClick={() => navigate("/crossword-landing")}>
            <IoGameControllerOutline /> Play New Game
          </button>
          <button className="action-btn red" onClick={handleLogout}>
            <MdLogout /> Exit to Login
          </button>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }} onClick={closeModal}>
          <div style={{
            backgroundColor: darkMode ? '#2d2d2d' : 'white',
            color: darkMode ? '#fff' : '#333',
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '700px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
            position: 'relative',
            border: darkMode ? '1px solid #444' : 'none'
          }} onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeModal}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '28px',
                cursor: 'pointer',
                color: '#999',
                lineHeight: '1',
                padding: '0',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f5f5f5';
                e.target.style.color = '#333';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#999';
              }}
            >
              ×
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
}
