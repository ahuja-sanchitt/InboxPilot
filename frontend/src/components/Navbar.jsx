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
    <nav className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-white font-semibold text-lg tracking-tight">
        Inbox<span className="text-violet-400">Pilot</span>
      </Link>
      <div className="flex items-center gap-4">
        {user?.picture && (
          <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />
        )}
        <span className="text-gray-400 text-sm">{user?.email}</span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}
