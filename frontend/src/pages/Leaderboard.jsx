import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useDarkMode } from "../context/DarkModeContext";
import "./leaderboard.css";
import { MdOutlineLeaderboard } from "react-icons/md";
import { LiaMedalSolid } from "react-icons/lia";
import { CgProfile } from "react-icons/cg";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { CiCalendar } from "react-icons/ci";
import { FaSearch } from "react-icons/fa";

export default function Leaderboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [userProfile, setUserProfile] = useState(null);
  const [filter, setFilter] = useState('overall'); // 'today' or 'overall'
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    // Fetch leaderboard data from API
    fetchLeaderboard();
    setTimeout(() => setLoaded(true), 100);
  }, [filter]);

  // Track window width for responsive design
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load user profile on mount
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const url = filter === 'today' 
        ? 'http://127.0.0.1:8000/api/crossword/leaderboard?filter=today'
        : 'http://127.0.0.1:8000/api/crossword/leaderboard';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      const data = await response.json();
      setLeaderboardData(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const url = filter === 'today'
        ? `http://127.0.0.1:8000/api/crossword/leaderboard/search?email=${encodeURIComponent(searchQuery)}&filter=today`
        : `http://127.0.0.1:8000/api/crossword/leaderboard/search?email=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Player not found');
      }
      const data = await response.json();
      setSearchResult(data);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResult({ error: 'Player not found' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return <LiaMedalSolid style={{ color: '#FFD700', fontSize: '24px' }} />;
    if (rank === 2) return <LiaMedalSolid style={{ color: '#C0C0C0', fontSize: '24px' }} />;
    if (rank === 3) return <LiaMedalSolid style={{ color: '#CD7F32', fontSize: '24px' }} />;
    return rank;
  };

  return (
    <div className="leaderboard-page" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Dark Mode Toggle - Top Left */}
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10000 }}>
        <button
          onClick={toggleDarkMode}
          style={{
            backgroundColor: darkMode ? '#2d2d2d' : '#f0f0f0',
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
          {darkMode ? <IoSunnyOutline size={20} /> : <IoMoonOutline size={20} />}
        </button>
      </div>

      {/* Profile Icon - Top Right */}
      <div 
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 10000 }}
        onMouseEnter={() => setShowProfileDropdown(true)}
        onMouseLeave={() => setShowProfileDropdown(false)}
      >
        <CgProfile 
          size={windowWidth <= 480 ? 24 : windowWidth <= 768 ? 28 : 36} 
          style={{ cursor: 'pointer', color: darkMode ? '#fff' : '#3377FF' }}
        />
        {showProfileDropdown && (
          <div style={{
            position: 'absolute',
            top: '50%',
            right: windowWidth <= 480 ? '30px' : windowWidth <= 768 ? '35px' : '40px',
            transform: 'translateY(-50%)',
            backgroundColor: darkMode ? '#2d2d2d' : 'white',
            color: darkMode ? '#fff' : '#333',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            borderRadius: windowWidth <= 480 ? '8px' : '12px',
            padding: windowWidth <= 480 ? '12px' : '16px',
            minWidth: windowWidth <= 480 ? '180px' : windowWidth <= 768 ? '200px' : '220px',
            zIndex: 10001,
            border: darkMode ? '1px solid #444' : '1px solid #e0e0e0'
          }}
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            <div style={{
              marginBottom: windowWidth <= 480 ? '10px' : '12px',
              paddingBottom: windowWidth <= 480 ? '10px' : '12px',
              borderBottom: '1px solid #f0f0f0'
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

      <div className={`leaderboard-container ${loaded ? 'slide-down' : ''}`}>
        <h1 className="leaderboard-heading"><u><MdOutlineLeaderboard />Leaderboard</u></h1>
        
        {/* Filter Button */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', position: 'relative' }}>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            style={{
              padding: windowWidth <= 480 ? '8px 16px' : '10px 20px',
              backgroundColor: darkMode ? '#3a3a3a' : '#f0f0f0',
              color: darkMode ? '#fff' : '#333',
              border: `2px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: windowWidth <= 480 ? '14px' : '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s'
            }}
          >
            📊 {filter === 'today' ? 'Today' : 'Overall'} ▼
          </button>
          
          {showFilterDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              marginTop: '5px',
              backgroundColor: darkMode ? '#2d2d2d' : 'white',
              border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              overflow: 'hidden',
              zIndex: 1000,
              minWidth: '150px'
            }}>
              <div
                onClick={() => { setFilter('overall'); setShowFilterDropdown(false); }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: filter === 'overall' ? (darkMode ? '#3377FF' : '#e3f2fd') : 'transparent',
                  color: filter === 'overall' ? (darkMode ? '#fff' : '#3377FF') : (darkMode ? '#fff' : '#333'),
                  fontWeight: filter === 'overall' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (filter !== 'overall') {
                    e.target.style.backgroundColor = darkMode ? '#3a3a3a' : '#f5f5f5';
                  }
                }}
                onMouseOut={(e) => {
                  if (filter !== 'overall') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                🏆 Overall
              </div>
              <div
                onClick={() => { setFilter('today'); setShowFilterDropdown(false); }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: filter === 'today' ? (darkMode ? '#3377FF' : '#e3f2fd') : 'transparent',
                  color: filter === 'today' ? (darkMode ? '#fff' : '#3377FF') : (darkMode ? '#fff' : '#333'),
                  fontWeight: filter === 'today' ? '600' : '400',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (filter !== 'today') {
                    e.target.style.backgroundColor = darkMode ? '#3a3a3a' : '#f5f5f5';
                  }
                }}
                onMouseOut={(e) => {
                  if (filter !== 'today') {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <CiCalendar /> Today
              </div>
            </div>
          )}
        </div>
        
        {/* Search Box */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{
              padding: windowWidth <= 480 ? '8px 12px' : '10px 16px',
              backgroundColor: darkMode ? '#3a3a3a' : 'white',
              color: darkMode ? '#fff' : '#333',
              border: `2px solid ${darkMode ? '#555' : '#ddd'}`,
              borderRadius: '8px',
              fontSize: windowWidth <= 480 ? '14px' : '16px',
              width: windowWidth <= 480 ? '200px' : '300px',
              outline: 'none'
            }}
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            style={{
              padding: windowWidth <= 480 ? '8px 16px' : '10px 20px',
              backgroundColor: darkMode ? '#3377FF' : '#3377FF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSearching ? 'not-allowed' : 'pointer',
              fontSize: windowWidth <= 480 ? '14px' : '16px',
              fontWeight: '600',
              opacity: isSearching ? 0.6 : 1
            }}
          >
            {isSearching ? <><FaSearch /> Searching...</> : <><FaSearch /> Search</>}
          </button>
        </div>

        {/* Search Result Display */}
        {searchResult && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: searchResult.error ? (darkMode ? '#5c1a1a' : '#fee') : (darkMode ? '#2d5016' : '#e8f5e9'),
            border: `2px solid ${searchResult.error ? (darkMode ? '#8b2c2c' : '#fcc') : (darkMode ? '#4CAF50' : '#81c784')}`,
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {searchResult.error ? (
              <p style={{ color: darkMode ? '#ffcdd2' : '#c62828', margin: 0 }}>
                ❌ {searchResult.error}
              </p>
            ) : (
              <div style={{ color: darkMode ? '#fff' : '#333' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '18px', fontWeight: '600' }}>
                  ✅ Player Found!
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '15px' }}>
                  <div><strong>Rank:</strong> #{searchResult.rank}</div>
                  <div><strong>Email:</strong> {searchResult.email}</div>
                  <div><strong>Rounds:</strong> {searchResult.roundsPlayed}</div>
                  <div><strong>Score:</strong> {searchResult.totalScore}</div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {loading ? (
          <div className="loading">Loading leaderboard...</div>
        ) : (
          <>
            <div className="leaderboard-table">
              <div className="table-header">
                <div className="col-rank">Rank</div>
                <div className="col-team">Email</div>
                <div className="col-rounds">Rounds</div>
                <div className="col-score">Score</div>
              </div>
              
              {leaderboardData.map((entry, index) => (
                <div 
                  key={entry.rank} 
                  className={`table-row ${entry.rank <= 3 ? 'top-three' : ''}`}
                >
                  <div className="col-rank rank-badge">
                    {getMedalEmoji(entry.rank)}
                  </div>
                  <div className="col-team">{entry.email}</div>
                  <div className="col-rounds">{entry.roundsPlayed}</div>
                  <div className="col-score score-value">{entry.totalScore}</div>
                </div>
              ))}
            </div>

            <div className="leaderboard-actions">
              <button className="btn-back" onClick={() => navigate(-1)}>
                Back
              </button>
              <button className="btn-home" onClick={() => navigate("/landing")}>
                Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
