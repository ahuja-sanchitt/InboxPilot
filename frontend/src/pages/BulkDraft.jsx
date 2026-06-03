import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

export default function BulkDraft() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [variables, setVariables] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const detectedVars = extractVariables(subject + ' ' + body)

  const recipients = recipientsRaw
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0)

  async function handleCreate() {
    if (!subject || !body || recipients.length === 0) {
      setError('Subject, body, and at least one recipient are required.')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await api.post('/drafts/', { subject, body, recipients, variables })
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

        <h1 className="text-2xl font-bold text-white mb-1">Bulk Draft Creator</h1>
        <p className="text-gray-400 text-sm mb-8">
          One message, many drafts. Use <code className="bg-gray-800 text-violet-300 px-1 rounded">{'{{variable}}'}</code> for placeholders.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. {{month}} Monthly Report"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Message Body</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={"Hi {{name}},\n\nPlease find the {{month}} report attached..."}
              rows={6}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-600 resize-none"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">
              Recipients <span className="text-gray-500 font-normal">(one email per line)</span>
            </label>
            <textarea
              value={recipientsRaw}
              onChange={e => setRecipientsRaw(e.target.value)}
              placeholder={"alice@example.com\nbob@example.com\ncarol@example.com"}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-600 resize-none font-mono"
            />
            {recipients.length > 0 && (
              <p className="text-gray-500 text-xs mt-1">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {detectedVars.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-300 text-sm font-medium mb-3">Fill in variables</p>
              <div className="grid grid-cols-2 gap-3">
                {detectedVars.map(v => (
                  <div key={v}>
                    <label className="text-gray-400 text-xs mb-1 block">{`{{${v}}}`}</label>
                    <input
                      type="text"
                      value={variables[v] ?? ''}
                      onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                      placeholder={v}
                      className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-600"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-300 rounded-lg px-4 py-3 text-sm mt-4">
            {error}
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full mt-6 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:text-violet-400 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
        >
          {loading ? 'Creating drafts...' : `Create ${recipients.length > 0 ? recipients.length : ''} Draft${recipients.length !== 1 ? 's' : ''}`}
        </button>

        {result && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-emerald-400 font-medium mb-3">
              ✓ {result.created} draft{result.created !== 1 ? 's' : ''} created in your Gmail
            </p>
            <div className="space-y-2">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-mono">{r.email}</span>
                  <span className={r.status === 'created' ? 'text-emerald-400' : 'text-red-400'}>
                    {r.status === 'created' ? '✓ created' : `✗ ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
