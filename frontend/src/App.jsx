import { Navigate, Route, Routes } from 'react-router-dom'
import CrosswordLanding from './pages/CrosswordLanding.jsx'
import GridPage from './pages/GridPage.jsx'
import RoundScoreCard from './pages/RoundScoreCard.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Wallet from './pages/Wallet.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<CrosswordLanding />} />
      <Route path="/grid" element={<GridPage />} />
      <Route path="/score" element={<RoundScoreCard />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  )
}

export default App
