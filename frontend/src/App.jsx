import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import api from './api'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Summary from './pages/Summary'
import BulkDraft from './pages/BulkDraft'
import BulkSend from './pages/BulkSend'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )
  return user ? children : <Navigate to="/" replace />
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={!loading && user ? <Navigate to="/dashboard" replace /> : <Landing />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/summary" element={<RequireAuth><Summary /></RequireAuth>} />
          <Route path="/bulk-draft" element={<RequireAuth><BulkDraft /></RequireAuth>} />
          <Route path="/bulk-send" element={<RequireAuth><BulkSend /></RequireAuth>} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  )
}
