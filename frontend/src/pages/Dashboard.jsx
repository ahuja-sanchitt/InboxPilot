import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../App'
import api from '../api'

const categoryStyle = {
  Important: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  Promo:     'bg-purple-500/10 text-purple-300 border-purple-500/20',
  Social:    'bg-blue-500/10 text-blue-300 border-blue-500/20',
  Update:    'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  Forum:     'bg-orange-500/10 text-orange-300 border-orange-500/20',
  Inbox:     'bg-white/5 text-white/40 border-white/10',
}

function formatDate(raw) {
  try {
    const d = new Date(raw)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  } catch { return raw }
}

function senderName(from) {
  const match = from.match(/^([^<]+)</)
  return match ? match[1].trim() : from.replace(/<.*>/, '').trim()
}

const actions = [
  { path: '/summary',    icon: '✦', label: 'AI Summary',  desc: 'Summarize with AI',          color: 'violet' },
  { path: '/bulk-draft', icon: '◈', label: 'Bulk Draft',  desc: 'Draft for many recipients',  color: 'blue'   },
  { path: '/bulk-send',  icon: '⟶', label: 'Bulk Send',   desc: 'Send to many at once',       color: 'emerald'},
]

const actionColor = {
  violet:  'border-violet-500/20 hover:border-violet-400/40 hover:bg-violet-500/5',
  blue:    'border-blue-500/20 hover:border-blue-400/40 hover:bg-blue-500/5',
  emerald: 'border-emerald-500/20 hover:border-emerald-400/40 hover:bg-emerald-500/5',
}

const actionIcon = {
  violet:  'text-violet-400 bg-violet-500/10',
  blue:    'text-blue-400 bg-blue-500/10',
  emerald: 'text-emerald-400 bg-emerald-500/10',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [emails, setEmails] = useState([])
  const [loadingEmails, setLoadingEmails] = useState(true)

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  useEffect(() => {
    api.get('/emails/?count=10')
      .then(res => setEmails(res.data.emails))
      .catch(() => {})
      .finally(() => setLoadingEmails(false))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Hey, {firstName} 👋</h1>
          <p className="text-white/40 text-sm">Here's what's in your inbox.</p>
        </div>

        <div className="flex gap-6 items-start">

          {/* Email list */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm font-medium">Latest emails</span>
              {!loadingEmails && <span className="text-white/20 text-xs">{emails.length} shown</span>}
            </div>

            {loadingEmails ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-3 w-32 bg-white/10 rounded" />
                      <div className="h-3 w-16 bg-white/5 rounded" />
                    </div>
                    <div className="h-3 w-48 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {emails.map(email => (
                  <div
                    key={email.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 min-w-0 flex-wrap">
                        <span className="text-white text-sm font-medium truncate">
                          {senderName(email.from)}
                        </span>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full border ${categoryStyle[email.category.label] ?? categoryStyle.Inbox}`}>
                          {email.category.label}
                        </span>
                        {email.needs_reply && (
                          <span className="shrink-0 text-xs px-2 py-0.5 rounded-full border bg-red-500/10 text-red-300 border-red-500/20">
                            Reply needed
                          </span>
                        )}
                      </div>
                      <span className="shrink-0 text-white/25 text-xs">{formatDate(email.date)}</span>
                    </div>
                    <p className="text-white/70 text-sm font-medium mb-1 truncate">{email.subject}</p>
                    <p className="text-white/30 text-xs leading-relaxed line-clamp-2">{email.snippet}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="w-52 shrink-0">
            <span className="text-white/50 text-sm font-medium block mb-3">Actions</span>
            <div className="space-y-2">
              {actions.map(a => (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  className={`w-full text-left bg-white/5 backdrop-blur-sm border rounded-xl p-4 transition-all cursor-pointer ${actionColor[a.color]}`}
                >
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm mb-2 ${actionIcon[a.color]}`}>
                    {a.icon}
                  </span>
                  <span className="text-white text-sm font-medium block">{a.label}</span>
                  <span className="text-white/30 text-xs leading-snug">{a.desc}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
