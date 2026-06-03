import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

export default function Summary() {
  const [count, setCount] = useState(10)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSummarize() {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.get(`/summary?count=${count}`)
      setResult(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-300 text-sm mb-8 flex items-center gap-1 transition-colors cursor-pointer">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">AI Inbox Summary</h1>
        <p className="text-gray-400 text-sm mb-8">Claude reads your emails and tells you what matters.</p>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
          <label className="text-gray-300 text-sm font-medium block mb-3">
            How many emails to summarize?
          </label>
          <div className="flex items-center gap-4">
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
        </div>

        <button
          onClick={handleSummarize}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:text-violet-400 text-white font-medium py-3 rounded-lg transition-colors mb-8 cursor-pointer"
        >
          {loading ? 'Summarizing...' : `Summarize last ${count} emails`}
        </button>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mb-6">
            {error}
          </div>
        )}

        {result && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{result.total} emails summarized</span>
              {result.needs_reply_count > 0 && (
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full">
                  {result.needs_reply_count} need{result.needs_reply_count > 1 ? '' : 's'} reply
                </span>
              )}
            </div>
            <div className="space-y-3">
              {result.summaries.map((s, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-white text-sm font-medium">{s.from}</span>
                      <span className="text-gray-500 text-xs ml-2">{s.date}</span>
                    </div>
                    {s.needs_reply && (
                      <span className="shrink-0 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2 py-0.5 rounded-full">
                        Reply needed
                      </span>
                    )}
                  </div>
                  <p className="text-gray-300 text-sm font-medium mb-1">{s.subject}</p>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.summary}</p>
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
