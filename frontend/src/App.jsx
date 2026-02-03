import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage.jsx'
import RequireAuth from './auth/RequireAuth.jsx'
import CrosswordLanding from './pages/CrosswordLanding.jsx'
import GridPage from './pages/GridPage.jsx'
import RoundScoreCard from './pages/RoundScoreCard.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Analytics from './pages/Analytics.jsx'
import Wallet from './pages/Wallet.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route path="/auth" element={<LoginPage />} />
      <Route
        path="/home"
        element={
          <RequireAuth>
            <CrosswordLanding />
          </RequireAuth>
        }
      />
      <Route
        path="/grid"
        element={
          <RequireAuth>
            <GridPage />
          </RequireAuth>
        }
      />
      <Route
        path="/score"
        element={
          <RequireAuth>
            <RoundScoreCard />
          </RequireAuth>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <RequireAuth>
            <Leaderboard />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <Analytics />
          </RequireAuth>
        }
      />
      <Route
        path="/wallet"
        element={
          <RequireAuth>
            <Wallet />
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  )
}

export default App
