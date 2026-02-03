


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDarkMode } from '../context/DarkModeContext';
import './CrosswordLanding.css';
import { IoGameControllerOutline, IoSunnyOutline, IoMoonOutline } from "react-icons/io5";



function CrosswordLanding() {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [loaded, setLoaded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
      document.body.classList.add('page-loaded');
    }, 100);
  }, []);

  const handleStartGame = () => {
    navigate('/grid');
  };

  return (
    <div className={`container ${loaded ? 'fade-in' : ''}`} data-theme={darkMode ? 'dark' : 'light'}>
      {/* GridOverlay removed as requested */}
      <div className="box1">
        <h1>Crossword</h1>
        <p>Classic crossword puzzle game</p>
        <div className='grid-wrapper'>
        <div className="puzzle">
  {/* <!-- ROW 1 --> */}
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>

  {/* <!-- ROW 2 --> */}
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>

  {/* <!-- ROW 3 --> */}
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>

  {/* <!-- ROW 4 --> */}
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  {/* <!-- ROW 5 --> */}
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div class="cell"></div>
  {/* <!-- ROW 6 --> */}
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
  <div className="cell black"></div>
  <div className="cell"></div>
  <div className="cell"></div>
</div>
</div>
<button className="button" onClick={handleStartGame}>
        <IoGameControllerOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Start Game
      </button>
      </div>
      <div className="box2">
        <h3>How To Play!</h3>
        <ul>
          <li>The crossword grid is displayed along with Across and Down clues.</li>
          <li>Click (or tap) on any empty cell to start entering a word.</li>
          <li>Use the Across clues to fill words horizontally (left to right).</li>
          <li>Use the Down clues to fill words vertically (top to bottom).</li>
          <li>Each clue corresponds to a numbered position in the grid.</li>
          <li>Type one letter per cell, letters must match both Across and Down words.</li>
          <li>You can move between cells using your keyboard or by clicking cells.</li>
          <li>If a word is incorrect, you can erase and re-enter letters anytime.</li>
          <li>Complete all the words to finish the crossword puzzle.</li>
          <li>Your score/time may be calculated based on accuracy and speed (if enabled).</li>
        </ul>
        <h3>Scoring</h3>
        <ul>
          <li>+1 point for each word correctly solved</li>
          <li>countdown timer starts at 5 mins</li>
          <li>+0.1 points for every second remaining on the clock upon successful completion of the entire grid</li>
          <li>when user guesses 6 correct answer, user can obtain time bonus points</li>
          <li>No negative marking</li>
        </ul>
      </div>
      {/* <button className="button" onClick={handleStartGame}>
        <IoGameControllerOutline style={{ marginRight: '8px', verticalAlign: 'middle' }} />
        Start Game
      </button> */}
    </div>
  );
}

export default CrosswordLanding;
