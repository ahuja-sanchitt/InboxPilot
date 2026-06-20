import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import api from '../api'

export default function Navbar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await api.get('/auth/logout')
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link to="/dashboard" className="text-white font-bold text-lg tracking-tight">
        Inbox<span className="text-violet-400">Pilot</span>
      </Link>
      <div className="flex items-center gap-4">
        {user?.picture && (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full ring-2 ring-violet-500/30" />
        )}
        <span className="text-white/50 text-sm hidden sm:block">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-white/40 hover:text-white/80 transition-colors cursor-pointer border border-white/10 px-3 py-1.5 rounded-lg hover:border-white/20 hover:bg-white/5"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
