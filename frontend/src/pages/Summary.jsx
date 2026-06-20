import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

const QUICK_OPTIONS = [
  { label: 'Today',       key: 'today',     days: 0 },
  { label: 'Yesterday',   key: 'yesterday', days: 1 },
  { label: 'Last 3 days', key: 'last3',     days: 3 },
]

function sinceDate(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`
}

export default function Summary() {
  const [mode, setMode] = useState('custom')
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const quickMap = { today: 0, yesterday: 1, last3: 3 }

  function buildParams() {
    if (mode in quickMap) return `since=${sinceDate(quickMap[mode])}`
    return `count=${count}`
  }

  function buttonLabel() {
    if (mode === 'today')     return "Summarize today's emails"
    if (mode === 'yesterday') return "Summarize yesterday's emails"
    if (mode === 'last3')     return 'Summarize last 3 days'
    return `Summarize last ${count} emails`
  }

  async function handleSummarize() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.get(`/summary?${buildParams()}`)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const skeletonCount = mode === 'custom' ? Math.min(count, 5) : 5

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-white/30 hover:text-white/60 text-sm mb-8 flex items-center gap-1 transition-colors cursor-pointer">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">AI Inbox Summary</h1>
        <p className="text-white/40 text-sm mb-8">AI reads your emails and tells you what matters.</p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
          <label className="text-white/70 text-sm font-medium block mb-3">What to summarize</label>

          <div className="flex gap-2 mb-4 flex-wrap">
            {QUICK_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => { setMode(opt.key); setResult(null) }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  mode === opt.key
                    ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <button
              onClick={() => { setMode('custom'); setResult(null) }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                mode === 'custom'
                  ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
              }`}
            >
              Custom
            </button>
          </div>

          {mode === 'custom' && (
            <div className="flex items-center gap-4 pt-1">
              <input
                type="range"
                min={1}
                max={50}
                value={count}
                onChange={e => setCount(Number(e.target.value))}
                className="flex-1 accent-violet-500"
              />
              <span className="text-white font-mono w-8 text-center">{count}</span>
            </div>
          )}
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:text-violet-400/50 text-white font-medium py-3 rounded-xl transition-all mb-8 cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-violet-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Reading your emails with AI...
            </>
          ) : buttonLabel()}
        </button>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex gap-2 items-center">
                    <div className="h-3 w-28 bg-white/10 rounded" />
                    <div className="h-3 w-16 bg-white/5 rounded" />
                  </div>
                </div>
                <div className="h-3 w-48 bg-white/10 rounded mb-3" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/5 rounded" />
                  <div className="h-3 w-4/5 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {result && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-white/40 text-sm">{result.total} emails summarized</span>
              {result.needs_reply_count > 0 && (
                <span className="bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs px-3 py-1 rounded-full">
                  {result.needs_reply_count} need{result.needs_reply_count > 1 ? '' : 's'} reply
                </span>
              )}
            </div>
            <div className="space-y-3">
              {result.summaries.map((s, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-white/20 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-white text-sm font-medium">{s.from}</span>
                      <span className="text-white/30 text-xs ml-2">{s.date}</span>
                    </div>
                    {s.needs_reply && (
                      <span className="shrink-0 bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full">
                        Reply needed
                      </span>
                    )}
                  </div>
                  <p className="text-white/80 text-sm font-medium mb-1">{s.subject}</p>
                  <p className="text-white/50 text-sm leading-relaxed">{s.summary}</p>
                  {s.action_required && (
                    <p className="text-violet-300 text-xs mt-2">⟶ {s.action_required}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
