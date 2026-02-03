import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import { useAuth } from "../auth/AuthContext";
import { RiAccountCircleLine } from "react-icons/ri";
import "./scorecard.css";

export default function RoundScoreCard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const scorecardRef = useRef(null);

  const currentRound = location.state?.roundIndex ?? 0;
  const finalScore = location.state?.score || 0;
  const cumulativeScore = location.state?.cumulativeScore || 0;
  const correctWords = location.state?.correctWords || 0;
  const totalWords = location.state?.totalWords || 0;
  const allWordsCorrect = location.state?.allWordsCorrect || false;
  const timeRemaining = location.state?.timeRemaining || 0;
  const isAutoSubmit = location.state?.isAutoSubmit || false;
  const gridData = location.state?.gridData || {};
  
  const [showMessage, setShowMessage] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Load user profile
  useEffect(() => {
    const profile = localStorage.getItem('userProfile');
    if (profile) {
      setUserProfile(JSON.parse(profile));
    }
  }, []);

  // Calculate time bonus based on correct words
  const timeBonus = correctWords >= 6 ? timeRemaining * 0.1 : 0;
  const accuracyScore = correctWords;
  const overallScore = finalScore;

  const [displayedTime, setDisplayedTime] = useState(0);
  const [displayedAccuracy, setDisplayedAccuracy] = useState(0);
  const [displayedOverall, setDisplayedOverall] = useState(0);
  const [ringProgress, setRingProgress] = useState(0);

  useEffect(() => {
    const animate = (end, setter) => {
      let current = 0;
      const increment = end / 40;
      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          setter(end);
          clearInterval(timer);
        } else {
          setter(Math.floor(current));
        }
      }, 20);
    };

    animate(timeBonus, setDisplayedTime);
    animate(accuracyScore, setDisplayedAccuracy);
    animate(overallScore, setDisplayedOverall);
    
    // Animate ring progress from 0 to 100
    let progress = 0;
    const ringTimer = setInterval(() => {
      progress += 2;
      if (progress >= 100) {
        setRingProgress(100);
        clearInterval(ringTimer);
      } else {
        setRingProgress(progress);
      }
    }, 20);
    
    return () => clearInterval(ringTimer);
  }, [timeBonus, accuracyScore, overallScore]);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  useEffect(() => {
    setTimeout(() => setLoaded(true), 100);
  }, []);

  const handleNextRound = () => {
    if (correctWords < 6) {
      // Show custom message box
      setShowMessage(true);
      return;
    }
    navigate("/grid", { state: { roundIndex: currentRound + 1, cumulativeScore } });
  };
  
  const handleContinue = () => {
    setShowMessage(false);
    
    if (isAutoSubmit) {
      // Auto-submitted (time ran out) - restart with fresh grid and full time
      navigate("/grid", { 
        state: { 
          roundIndex: currentRound, 
          cumulativeScore: cumulativeScore - finalScore, 
          timeRemaining: 300 // Reset to 5 minutes
        } 
      });
    } else {
      // Manual submit - restore grid progress and remaining time
      navigate("/grid", { 
        state: { 
          roundIndex: currentRound, 
          cumulativeScore: cumulativeScore - finalScore,
          gridData: gridData,
          timeRemaining: timeRemaining // Continue with remaining time
        } 
      });
    }
  };

  const handleExit = async () => {
    await signOut();
    navigate("/login");
  };

  const handleShare = async () => {
    try {
      if (scorecardRef.current) {
        const canvas = await html2canvas(scorecardRef.current, {
          backgroundColor: '#f4f7ff',
          scale: 2,
          logging: false,
          useCORS: true
        });
        
        // Convert to blob and share/download
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `crossword-score-${Date.now()}.png`, { type: 'image/png' });
          
          // Try to use Web Share API if available
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'My Crossword Score',
                text: `I scored ${cumulativeScore} points in the crossword puzzle!`
              });
            } catch (err) {
              if (err.name !== 'AbortError') {
                // Fallback to download
                downloadImage(canvas);
              }
            }
          } else {
            // Fallback to download
            downloadImage(canvas);
          }
        });
      }
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      alert('Failed to capture screenshot. Please try again.');
    }
  };
  
  const downloadImage = (canvas) => {
    const link = document.createElement('a');
    link.download = `crossword-score-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    alert('Score card image downloaded successfully!');
  };

  // Pie chart math (same as design file)
  const total = timeBonus + accuracyScore || 1;
  const timeAngle = (timeBonus / total) * 360;

  const createSlice = (startAngle, endAngle, color) => {
    const radius = 80;
    const cx = 100;
    const cy = 100;
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return <path d={d} fill={color} />;
  };

  return (
    <div className={`scorecard-page ${loaded ? 'fade-in' : ''}`}>
      <div className="scorecard" ref={scorecardRef}>
        <div className="scorecard-header">
          <h1 className="heading">Score Card</h1>
          {userProfile && (
            <div className="account-wrapper">
              <div className="account-icon">
                <RiAccountCircleLine size={32} />
              </div>
              <div className="account-dropdown">
                <div className="account-email">{userProfile.email}</div>
                <button onClick={handleExit} className="dropdown-logout-btn">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="scores">
          <div className="score-item">
            <span className="label">Time Efficiency Bonus</span>
            <span className="value">{Math.round(displayedTime)}</span>
          </div>
          <div className="score-item">
            <span className="label">Accuracy Rating</span>
            <span className="value">{displayedAccuracy}</span>
          </div>
          <div className="score-item">
            <span className="label">Words Completed</span>
            <span className="value">{correctWords}/{totalWords}</span>
          </div>
          <div className="score-item overall">
            <span className="label">Round Score</span>
            <span className="value">{Math.round(displayedOverall)}</span>
          </div>
          <div className="score-item overall" style={{ background: "linear-gradient(135deg, #2659BF 0%, #99BBFF 100%)", color: "white" }}>
            <span className="label">Final Score</span>
            <span className="value">{Math.round(cumulativeScore)}</span>
          </div>
        </div>

        <div className="chart">
       <svg width="200" height="200" viewBox="0 0 200 200">
    {/* Gradient Definitions */}
    <defs>
      <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#3377FF", stopOpacity: 1 }} />
        <stop offset="70%" style={{ stopColor: "#5f95ff", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#b3d1ff", stopOpacity: 0.5 }} />
      </linearGradient>
    </defs>
    
    {/* Background ring */}
    <circle
      cx="100"
      cy="100"
      r="80"
      fill="none"
      stroke="#E6ECF5"
      strokeWidth="18"
    />

    {/* Score Progress Ring - Based on correct words out of 10 */}
    <circle
      cx="100"
      cy="100"
      r="80"
      fill="none"
      stroke="url(#scoreGradient)"
      strokeWidth="18"
      strokeDasharray={`${(ringProgress / 100) * (correctWords / 10) * 2 * Math.PI * 80} ${2 * Math.PI * 80}`}
      strokeLinecap="round"
      transform="rotate(-90 100 100)"
      style={{ transition: 'stroke-dasharray 0.3s ease' }}
    />

    {/* Center score */}
    <text x="100" y="95" textAnchor="middle" style={{ fontSize: "12px", fontWeight: "600", fill: "#666" }}>
      Total Score
    </text>
    <text x="100" y="130" textAnchor="middle" className="chart-score">
      {Math.round(displayedOverall)}
    </text>
  </svg>
</div>


        <div className="buttons">
          <button className="secondary" onClick={handleExit}>Exit</button>
          <button className="secondary" onClick={handleShare}>Share</button>
          <button className="primary" onClick={handleNextRound}>Next Round</button>
        </div>
        
        <div className="buttons secondary-actions">
          <button className="secondary" onClick={() => navigate("/leaderboard")}>Leaderboard</button>
          <button className="secondary" onClick={() => navigate("/analytics")}>Analytics</button>
        </div>
      </div>
      
      {/* Custom Message Box */}
      {showMessage && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #3377FF'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}></div>
            <h3 style={{
              color: '#333',
              marginBottom: '10px',
              fontSize: '20px'
            }}>Almost There!</h3>
            <p style={{
              color: '#666',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              You need at least <strong>6 correct words</strong> to move to the next round.
              <br/>
              You have <strong>{correctWords}/{totalWords}</strong> correct words.
            </p>
            <button
              onClick={handleContinue}
              style={{
                backgroundColor: '#3377FF',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3377FF'}
            >
              Continue Playing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
