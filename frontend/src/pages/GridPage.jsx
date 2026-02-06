
import { useEffect, useState, useRef } from "react";
import "./GridPage.css";
import { useNavigate, useLocation } from "react-router-dom";
import { useDarkMode } from "../context/DarkModeContext";
import { GoPencil } from "react-icons/go";
import { RiAccountCircleLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import { IoSunnyOutline, IoMoonOutline } from "react-icons/io5";
import { CiWallet } from "react-icons/ci";
import Wallet from "./Wallet";


function GridPage() {
   const rounds = [101, 102, 103, 105, 106];
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const roundIndex = location.state?.roundIndex ?? 0;
  const puzzleId = rounds[roundIndex];
  const cumulativeScore = location.state?.cumulativeScore ?? 0;
  
  const [activeCell, setActiveCell] = useState(null);
  const [highlightCells, setHighlightCells] = useState([]);
  const [direction, setDirection] = useState('across'); // 'across' or 'down'
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState(location.state?.gridData || {});
  const [seconds, setSeconds] = useState(location.state?.timeRemaining ?? 300); // Restore timer or default to 5 min
  const [pencil, setPencil] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [hintsRemaining, setHintsRemaining] = useState(10);
  const isAutoSubmit = useRef(false);
  const [showResults, setShowResults] = useState(false);
  const [correctCells, setCorrectCells] = useState(new Set());
  const [wrongCells, setWrongCells] = useState(new Set());
  const [pencilCells, setPencilCells] = useState(new Set());
  const [unansweredCells, setUnansweredCells] = useState(new Set());
  const [resultData, setResultData] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [showContinuePopup, setShowContinuePopup] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showWallet, setShowWallet] = useState(false);
  const [showWalletTooltip, setShowWalletTooltip] = useState(false);
  const [walletBalance, setWalletBalance] = useState(100);

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

  // Reset result states when roundIndex changes (new round)
  useEffect(() => {
    setShowResults(false);
    setCorrectCells(new Set());
    setWrongCells(new Set());
    setPencilCells(new Set());
    setUnansweredCells(new Set());
    setResultData(null);
    setShowAnswers(false);
    setShowContinuePopup(false);
    setGrid({}); // Clear all filled cells
  }, [roundIndex]);

  // Trigger animation after puzzle loads
  useEffect(() => {
    if (puzzle) {
      document.body.style.overflowY = 'hidden';
      setTimeout(() => {
        setLoaded(true);
        document.body.classList.add('page-loaded');
        document.body.style.overflowY = '';
      }, 100);
    }
  }, [puzzle]);

  const handleHint = () => {
    if (hintsRemaining <= 0 || !puzzle || highlightCells.length === 0) return;

    // Check if user has enough coins
    if (walletBalance < 10) {
      alert('❌ Insufficient balance! You need 10 coins to use a hint.');
      setShowWallet(true);
      return;
    }

    // Find the first empty cell in the current highlighted word
    const emptyCellIndex = highlightCells.findIndex(cellId => !grid[cellId]?.value);
    
    if (emptyCellIndex === -1) return; // No empty cells in current word

    const hintCell = highlightCells[emptyCellIndex];
    
    // Find the correct answer for this cell
    let correctAnswer = '';
    
    if (direction === 'across') {
      const acrossHint = puzzle.acrossHints.find(h => {
        const wordCells = getAcrossWordCells(parseInt(h.cellID), parseInt(h.answerlength));
        return wordCells.includes(hintCell);
      });
      if (acrossHint) {
        const wordCells = getAcrossWordCells(parseInt(acrossHint.cellID), parseInt(acrossHint.answerlength));
        const cellIndex = wordCells.indexOf(hintCell);
        correctAnswer = acrossHint.answer[cellIndex];
      }
    } else {
      const downHint = puzzle.downHints.find(h => {
        const wordCells = getDownWordCells(parseInt(h.cellID), parseInt(h.answerlength));
        return wordCells.includes(hintCell);
      });
      if (downHint) {
        const wordCells = getDownWordCells(parseInt(downHint.cellID), parseInt(downHint.answerlength));
        const cellIndex = wordCells.indexOf(hintCell);
        correctAnswer = downHint.answer[cellIndex];
      }
    }

    if (correctAnswer) {
      setGrid(prev => ({
        ...prev,
        [hintCell]: {
          value: correctAnswer.toUpperCase(),
          isPencil: false
        }
      }));
      setHintsRemaining(prev => prev - 1);
      setWalletBalance(prev => prev - 10);
    }
  };

  const handleLogout = async () => {
    navigate("/home");
  };




  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/crossword/puzzle/${puzzleId}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        return res.json();
      })
      .then(data => setPuzzle(data))
      .catch(err => {
        console.error('Failed to fetch puzzle:', err);
        // For now, set mock data to prevent infinite loading
        setPuzzle({
          acrossHints: [],
          downHints: [],
          blackBoxArray: []
        });
      });
  }, [puzzleId]);


  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => {
        if (s > 0) return s - 1;
        return 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (seconds === 0 && puzzle && !showResults) {
      isAutoSubmit.current = true;
      handleSubmit();
    }
  }, [seconds, puzzle, showResults]);

const handleChange = (cell, value) => {
  if (!/^[A-Za-z]?$/.test(value)) return;

  setGrid(prev => ({
    ...prev,
    [cell]: {
      value: value.toUpperCase(),
      isPencil: pencil   // 👈 if pencil ON → true, else false
    }
  }));
  
  // Auto-move to next cell after typing a letter
  if (value && highlightCells.length > 0) {
    const currentIndex = highlightCells.indexOf(cell);
    if (currentIndex >= 0 && currentIndex < highlightCells.length - 1) {
      const nextCell = highlightCells[currentIndex + 1];
      setActiveCell(nextCell);
      // Focus the next input
      setTimeout(() => {
        const nextInput = document.querySelector(`.cell-box:nth-child(${nextCell}) input`);
        if (nextInput) nextInput.focus();
      }, 0);
    }
  }
};

const handleKeyDown = (cell, e) => {
  const blackCells = puzzle?.blackBoxArray || [];
  
  const moveToCell = (targetCell) => {
    if (targetCell >= 1 && targetCell <= 81 && !blackCells.includes(targetCell)) {
      setActiveCell(targetCell);
      handleCellClick(targetCell);
      setTimeout(() => {
        const targetInput = document.querySelector(`.cell-box:nth-child(${targetCell}) input`);
        if (targetInput) targetInput.focus();
      }, 0);
    }
  };
  
  switch(e.key) {
    case 'ArrowUp':
      e.preventDefault();
      moveToCell(cell - 9);
      break;
    case 'ArrowDown':
      e.preventDefault();
      moveToCell(cell + 9);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      moveToCell(cell - 1);
      break;
    case 'ArrowRight':
      e.preventDefault();
      moveToCell(cell + 1);
      break;
    case 'Backspace':
      if (!grid[cell]?.value) {
        e.preventDefault();
        // Move to previous cell in highlighted word if exists
        if (highlightCells.length > 0) {
          const currentIndex = highlightCells.indexOf(cell);
          if (currentIndex > 0) {
            const prevCell = highlightCells[currentIndex - 1];
            moveToCell(prevCell);
          }
        }
      }
      break;
    default:
      break;
  }
};

  const getAcrossWordCells = (startCell, length) => {
  return Array.from({ length }, (_, i) => startCell + i);
};

const getDownWordCells = (startCell, length) => {
  return Array.from({ length }, (_, i) => startCell + (i * 9));
};

const handleCellClick = (cell) => {
  setActiveCell(cell);

  // Don't process if puzzle isn't loaded yet
  if (!puzzle || !puzzle.acrossHints) {
    setHighlightCells([cell]);
    return;
  }

  // Find across clue that contains this cell
  let acrossFound = null;
  for (const clue of puzzle.acrossHints) {
    const start = parseInt(clue.cellID);
    const len = parseInt(clue.answerlength);
    const cells = getAcrossWordCells(start, len);
    if (cells.includes(cell)) {
      acrossFound = cells;
      break;
    }
  }

  // Find down clue that contains this cell
  let downFound = null;
  for (const clue of puzzle.downHints || []) {
    const start = parseInt(clue.cellID);
    const len = parseInt(clue.answerlength);
    const cells = getDownWordCells(start, len);
    if (cells.includes(cell)) {
      downFound = cells;
      break;
    }
  }

  // If clicking the same cell, toggle direction
  if (cell === activeCell && acrossFound && downFound) {
    setDirection(prev => prev === 'across' ? 'down' : 'across');
    setHighlightCells(direction === 'across' ? downFound : acrossFound);
  } else {
    // New cell - prioritize based on current direction
    if (direction === 'down' && downFound) {
      setHighlightCells(downFound);
    } else if (direction === 'across' && acrossFound) {
      setHighlightCells(acrossFound);
    } else if (acrossFound) {
      setDirection('across');
      setHighlightCells(acrossFound);
    } else if (downFound) {
      setDirection('down');
      setHighlightCells(downFound);
    } else {
      setHighlightCells([cell]);
    }
  }
};


  const handleSubmit = async () => {
    // Generate or retrieve sessionID from localStorage
    let sessionID = localStorage.getItem('sessionID');
    if (!sessionID) {
      sessionID = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sessionID', sessionID);
    }

    // Get email from userProfile first, then localStorage, then default
    const userEmail = userProfile?.email || localStorage.getItem('userEmail') || 'anonymous@example.com';
    
    // Get team name from localStorage or use default
    const teamName = localStorage.getItem('teamName') || 'team26';

    const res = await fetch("http://127.0.0.1:8000/api/crossword/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        puzzleID: puzzle.puzzleID,
        teamName: teamName,
        sessionID: sessionID,
        email: userEmail,
        // submittedPuzzle: grid,
        submittedPuzzle: Object.fromEntries(
  Object.entries(grid)
    .filter(([_, cell]) => !cell.isPencil)   // remove pencil letters
    .map(([key, cell]) => [key, cell.value]) // keep only final values
),

        timeRemaining: seconds
      })
    });

      const data = await res.json();
      
      // Calculate new cumulative score
      const newCumulativeScore = cumulativeScore + data.score;

      // Process correct/wrong answers
      const correct = new Set();
      const wrong = new Set();
      const pencil = new Set();
      const unanswered = new Set();

      // Get all correct answers from puzzle
      const correctAnswers = {};
      puzzle.acrossHints.forEach(hint => {
        const startCell = parseInt(hint.cellID);
        const answer = hint.answer.toUpperCase();
        for (let i = 0; i < answer.length; i++) {
          correctAnswers[startCell + i] = answer[i];
        }
      });
      puzzle.downHints.forEach(hint => {
        const startCell = parseInt(hint.cellID);
        const answer = hint.answer.toUpperCase();
        for (let i = 0; i < answer.length; i++) {
          correctAnswers[startCell + (i * 9)] = answer[i];
        }
      });

      // Check each filled cell
      Object.keys(grid).forEach(cellId => {
        const cell = grid[cellId];
        if (cell.value) {
          const cellNum = parseInt(cellId);
          if (cell.isPencil) {
            pencil.add(cellNum);
          } else if (correctAnswers[cellNum] === cell.value.toUpperCase()) {
            correct.add(cellNum);
          } else {
            wrong.add(cellNum);
          }
        }
      });

      // Check for unanswered cells (cells that should have answers but don't)
      Object.keys(correctAnswers).forEach(cellId => {
        const cellNum = parseInt(cellId);
        if (!grid[cellNum] || !grid[cellNum].value) {
          unanswered.add(cellNum);
        }
      });

      setCorrectCells(correct);
      setWrongCells(wrong);
      setPencilCells(pencil);
      setUnansweredCells(unanswered);
      setResultData({
        score: data.score,
        cumulativeScore: newCumulativeScore,
        correctWords: data.correctWords,
        totalWords: data.totalWords,
        allWordsCorrect: data.allWordsCorrect,
        timeRemaining: seconds,
        roundIndex: roundIndex,
        isAutoSubmit: isAutoSubmit.current
      });

      // Show results with animation
      setShowResults(true);
  };

  const handleNextRound = () => {
    if (!resultData) return;
    
    if (resultData.correctWords < 6) {
      // Show message that they need more correct words
      return;
    }
    navigate("/grid", { 
      state: { 
        roundIndex: roundIndex + 1, 
        cumulativeScore: resultData.cumulativeScore,
        // Don't pass gridData - new round should start fresh
        timeRemaining: 300 // Reset to 5 minutes for new round
      } 
    });
  };

  const handleContinuePlaying = () => {
    if (!resultData) return;
    
    // Show confirmation popup
    setShowContinuePopup(true);
  };

  const handleContinueYes = () => {
    if (!resultData) return;
    
    setShowContinuePopup(false);
    
    // Reset the results view and continue playing with current progress
    setTimeout(() => {
      // Hide results and reset states
      setShowResults(false);
      setShowAnswers(false);
      setCorrectCells(new Set());
      setWrongCells(new Set());
      setPencilCells(new Set());
      setUnansweredCells(new Set());
      
      // Restart timer with remaining time or give new time if timer was at 0
      if (seconds === 0) {
        setSeconds(300); // Give 5 minutes if time ran out
      }
      
      // Restore cumulative score (subtract the current round score)
      // Grid and seconds remain as they are
    }, 200);
  };

  const handleContinueNo = () => {
    setShowContinuePopup(false);
  };

  const handleExit = () => {
    navigate("/crossword-landing");
  };

  const handleViewAnswers = () => {
    setShowAnswers(!showAnswers);
  };

  // Helper function to get correct answer for a cell
  const getCorrectAnswerForCell = (cellNum) => {
    if (!puzzle) return '';
    
    // Check across hints
    for (const hint of puzzle.acrossHints) {
      const startCell = parseInt(hint.cellID);
      const answer = hint.answer.toUpperCase();
      for (let i = 0; i < answer.length; i++) {
        if (startCell + i === cellNum) {
          return answer[i];
        }
      }
    }
    
    // Check down hints
    for (const hint of puzzle.downHints) {
      const startCell = parseInt(hint.cellID);
      const answer = hint.answer.toUpperCase();
      for (let i = 0; i < answer.length; i++) {
        if (startCell + (i * 9) === cellNum) {
          return answer[i];
        }
      }
    }
    
    return '';
  };

  if (!puzzle) return (
    <div className="loading-container">
      <p className="loading-text">Loading...</p>
    </div>
  );

  const blackCells = puzzle.blackBoxArray || [];

  const clueNumbers = new Set([
    ...(puzzle.acrossHints || []).map(c => parseInt(c.cellID)),
    ...(puzzle.downHints || []).map(c => parseInt(c.cellID)),
  ]);

  return (
    <div className={`grid-page ${loaded ? 'fade-in' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* Dark Mode Toggle - Top Left */}
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
            color: darkMode ? '#ffd700' : '#ffffff'
          }}
          onMouseOver={(e) => e.target.style.transform = 'scale(1.1)'}
          onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
        >
          {darkMode ? <IoSunnyOutline size={windowWidth <= 480 ? 18 : windowWidth <= 768 ? 20 : 22} /> : <IoMoonOutline size={windowWidth <= 480 ? 18 : windowWidth <= 768 ? 20 : 22} />}
        </button>
      </div>

      {/* Profile and Wallet - Top Right */}
      <div style={{ position: 'fixed', top: windowWidth <= 480 ? '10px' : '20px', right: windowWidth <= 480 ? '10px' : '20px', zIndex: 10000, display: 'flex', alignItems: 'center', gap: windowWidth <= 480 ? '8px' : '12px' }}>
        <div
          onMouseEnter={() => setShowProfileDropdown(true)}
          onMouseLeave={() => setShowProfileDropdown(false)}
          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
        >
          <CgProfile 
            size={windowWidth <= 480 ? 24 : windowWidth <= 768 ? 28 : 36} 
            style={{ cursor: 'pointer', color: darkMode ? '#fff' : '#fbfcff' }}
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
              zIndex: 9999,
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
        <div 
          style={{ position: 'relative' }}
          onMouseEnter={() => setShowWalletTooltip(true)}
          onMouseLeave={() => setShowWalletTooltip(false)}
        >
          <CiWallet 
            size={windowWidth <= 480 ? 24 : windowWidth <= 768 ? 28 : 36} 
            style={{ cursor: 'pointer', color: darkMode ? '#fff' : '#ffffff' }}
            onClick={() => setShowWallet(true)}
          />
          {showWalletTooltip && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                backgroundColor: darkMode ? '#2d2d2d' : '#ffffff',
                color: darkMode ? '#fff' : '#333',
                padding: '8px 12px',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                fontSize: '14px',
                fontWeight: '600',
                whiteSpace: 'nowrap',
                zIndex: 1000,
                border: `1px solid ${darkMode ? '#444' : '#ddd'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ color: '#FFB84D', fontSize: '16px' }}>💰</span>
              {walletBalance} Coins
            </div>
          )}
        </div>
      </div>

      <main className={`grid-main ${loaded ? 'slide-down' : ''}`}>
        <div className="grid-header-wrapper">
          <div className="heading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <h1>Cross-Word Puzzle Game!</h1>
              <p>Get Ready To Challenge Your Mind And Have Fun Solving Puzzles!!</p>
            </div>
          </div>
          {userProfile && (
            <div className="profile-wrapper">
              <div className="profile-container">
                <div className="profile-avatar">
                  {userProfile.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-info">
                  <div className="profile-email">
                    {userProfile.email}
                  </div>
                  <div className="profile-stats">
                    Round {roundIndex + 1} | Score: {Math.floor(cumulativeScore)}
                  </div>
                </div>
              </div>
              <div className="profile-dropdown">
                <button onClick={handleLogout} className="logout-btn">
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <div className="boxes-wrapper">
        {/* GRID SIDE */}
        <div className={`grid-container large ${loaded ? 'slide-left' : ''}`}>
          <div className="grid-box">
            <div className="grid-header">
              <h5>Enjoy Solving, Best of Luck!</h5>
            </div>

            <div className="crossword-grid">
              {Array.from({ length: 81 }, (_, i) => {
                const cell = i + 1;
                const isBlack = blackCells.includes(cell);
                const showNumber = clueNumbers.has(cell);

                return (
                 <div
                key={cell}
              onClick={() => !showResults && handleCellClick(cell)}
                 className={`cell-box 
                ${isBlack ? "black" : ""} 
                ${highlightCells.includes(cell) && !showResults ? "highlight" : ""}
                ${showResults && correctCells.has(cell) ? "correct-cell" : ""}
                ${showResults && wrongCells.has(cell) ? "wrong-cell" : ""}
                ${showResults && pencilCells.has(cell) ? "pencil-cell" : ""}
                ${showResults && unansweredCells.has(cell) ? "unanswered-cell" : ""}
                ${showResults ? "flip-cell" : ""}
  `             }
             >

                    {!isBlack && (
                      <>
                        {showNumber && (
                          <span className="cell-number">{cell}</span>
                        )}
                        <input
                          maxLength={1}
                          value={showAnswers ? getCorrectAnswerForCell(cell) : (grid[cell]?.value || "")}
                          onChange={(e) => handleChange(cell, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(cell, e)}
                          className={grid[cell]?.isPencil ? "pencil" : ""}
                          disabled={showResults}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
             <div className="button-controls">
               {!showResults ? (
                 <button onClick={handleSubmit}>Submit</button>
               ) : (
                 <>
                   <button className="secondary-btn" onClick={handleExit}>Exit</button>
                   {resultData && resultData.correctWords >= 6 ? (
                     <button className="primary-btn" onClick={handleNextRound}>Next Round</button>
                   ) : (
                     <button className="primary-btn" onClick={handleContinuePlaying}>Continue Playing</button>
                   )}
                 </>
               )}
             </div>
          </div>
        </div>

        {/* CLUE SIDE */}
        <div className={`grid-container small ${loaded ? 'slide-right' : ''} ${showResults ? 'flip-container' : ''}`}>
          {!showResults ? (
            <div className="clue-box">
              <h5>Clues Here!</h5>

              <div className="clue-controls">
                <div className={`timer ${seconds <= 60 && seconds > 0 ? 'timer-warning' : ''}`}>
                  ⏱ <span>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}</span>
                </div>
                <button 
                  onClick={() => setPencil(!pencil)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: pencil ? "#3377FF" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "14px"
                  }}
                >
                  <GoPencil />{pencil ? "ON" : "OFF"}
                </button>
                <button 
                  onClick={handleHint}
                  disabled={hintsRemaining <= 0 || highlightCells.length === 0}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: hintsRemaining > 0 ? "#FFB84D" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: hintsRemaining > 0 ? "pointer" : "not-allowed",
                    fontSize: "14px",
                    opacity: hintsRemaining <= 0 ? 0.5 : 1
                  }}
                >
                   Hint ({hintsRemaining})
                </button>
              </div>

              <div className="clues">
                <div className="clues-section">
                  <h4>Across</h4>
                  {(puzzle.acrossHints || []).map((c, i) => (
                    <div key={i} className="clue-item">{c.cellID}. {c.hint}</div>
                  ))}
                </div>

                <div className="clues-section">
                  <h4>Down</h4>
                  {(puzzle.downHints || []).map((c, i) => (
                    <div key={i} className="clue-item">{c.cellID}. {c.hint}</div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="result-scorecard">
              <div className="scorecard-header">
                <h1 className="heading">Score Card</h1>
              </div>

              <div className="scores">
                <div className="score-item">
                  <span className="label">Time Bonus</span>
                  <span className="value">+{resultData ? Math.round((resultData.correctWords >= 6 ? resultData.timeRemaining * 0.1 : 0)) : 0}</span>
                </div>
                <div className="score-item">
                  <span className="label">Accuracy Rating</span>
                  <span className="value">{resultData && resultData.totalWords > 0 ? Math.round((resultData.correctWords / resultData.totalWords) * 100) : 0}%</span>
                </div>
                <div className="score-item">
                  <span className="label">Words Completed</span>
                  <span className="value">{resultData?.correctWords || 0}/{resultData?.totalWords || 0}</span>
                </div>
                <div className="score-item overall">
                  <span className="label">Round Score</span>
                  <span className="value">{resultData ? Math.round(resultData.score) : 0}</span>
                </div>
                <div className="score-item overall" style={{ background: "linear-gradient(135deg, #2659BF 0%, #99BBFF 100%)", color: "white" }}>
                  <span className="label">Final Score</span>
                  <span className="value">{resultData ? Math.round(resultData.cumulativeScore) : 0}</span>
                </div>
              </div>

              <div className="result-buttons">
                <button className="secondary-btn" onClick={handleViewAnswers}>
                  {showAnswers ? "Hide Answers" : "View Answers"}
                </button>
                <button className="secondary-btn" onClick={() => navigate("/leaderboard")}>Leaderboard</button>
                <button className="secondary-btn" onClick={() => navigate("/analytics")}>Analytics</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Continue Playing Confirmation Popup */}
      {showContinuePopup && (
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
            maxWidth: '450px',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid #3377FF'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '15px'
            }}>🎯</div>
            <h3 style={{
              color: '#333',
              marginBottom: '10px',
              fontSize: '20px'
            }}>Continue Playing?</h3>
            <p style={{
              color: '#666',
              marginBottom: '20px',
              lineHeight: '1.5'
            }}>
              You have entered <strong style={{ color: '#3377FF' }}>{resultData?.correctWords || 0}</strong> correct answers out of <strong style={{ color: '#3377FF' }}>{resultData?.totalWords || 0}</strong>.
              <br/><br/>
              You need at least <strong style={{ color: '#3377FF' }}>6 correct answers</strong> to proceed to the next round.
              <br/><br/>
              Would you like to continue playing with the remaining time to improve your score?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleContinueNo}
                style={{
                  backgroundColor: 'transparent',
                  color: '#666',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  padding: '12px 32px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                  e.target.style.borderColor = '#999';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderColor = '#ddd';
                }}
              >
                No
              </button>
              <button
                onClick={handleContinueYes}
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
                Yes, Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* <div className="button-controls">
        <button onClick={handleSubmit}>Submit
        </button>
      </div> */}

      {/* Wallet Modal */}
      {showWallet && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            zIndex: 10001,
            overflow: 'auto',
            padding: '20px'
          }}
          onClick={() => setShowWallet(false)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '850px',
              marginTop: '20px',
              marginBottom: '40px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Wallet 
              onClose={() => setShowWallet(false)} 
              isModal={true} 
              walletBalance={walletBalance}
              setWalletBalance={setWalletBalance}
              hintsRemaining={hintsRemaining}
              setHintsRemaining={setHintsRemaining}
            />
          </div>
        </div>
      )}

    </div>
  );
}

export default GridPage;
