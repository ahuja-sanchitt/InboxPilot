import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

export default function BulkSend() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [variables, setVariables] = useState({})
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const detectedVars = extractVariables(subject + ' ' + body)

  const recipients = recipientsRaw
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0)

  const payload = { subject, body, recipients, variables }

  async function handlePreview() {
    if (!subject || !body || recipients.length === 0) {
      setError('Subject, body, and at least one recipient are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await api.post('/send/preview', payload)
      setPreview(res.data)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    setSending(true)
    setError('')
    try {
      const res = await api.post('/send/', payload)
      setResult(res.data)
      setPreview(null)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'Something went wrong.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-300 text-sm mb-8 flex items-center gap-1 transition-colors cursor-pointer">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">Bulk Send</h1>
        <p className="text-gray-400 text-sm mb-8">
          Send one email to many people. Preview first, then send.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => { setSubject(e.target.value); setPreview(null) }}
              placeholder="e.g. {{month}} Update"
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-violet-500 placeholder-gray-600"
            />
          </div>

          <div>
            <label className="text-gray-300 text-sm font-medium block mb-2">Message Body</label>
            <textarea
              value={body}
              onChange={e => { setBody(e.target.value); setPreview(null) }}
              placeholder={"Hi {{name}},\n\nJust wanted to share..."}
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
              onChange={e => { setRecipientsRaw(e.target.value); setPreview(null) }}
              placeholder={"alice@example.com\nbob@example.com"}
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
                      onChange={e => { setVariables(prev => ({ ...prev, [v]: e.target.value })); setPreview(null) }}
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

        {!preview && !result && (
          <button
            onClick={handlePreview}
            disabled={loading}
            className="w-full mt-6 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white font-medium py-3 rounded-lg transition-colors cursor-pointer"
          >
            {loading ? 'Building preview...' : 'Preview Send'}
          </button>
        )}

        {preview && !result && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-300 font-medium mb-1">Preview</p>
            <p className="text-gray-500 text-xs mb-4">This is exactly what will be sent.</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Subject: </span>
                <span className="text-white">{preview.subject}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Body preview: </span>
                <span className="text-gray-300">{preview.body_preview}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Recipients: </span>
                <span className="text-gray-300">{preview.recipients.join(', ')}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setPreview(null)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
              >
                Edit
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900 disabled:text-violet-400 text-white font-medium py-2.5 rounded-lg transition-colors text-sm cursor-pointer"
              >
                {sending ? 'Sending...' : `Send to ${preview.recipient_count} people`}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-emerald-400 font-medium mb-3">
              ✓ {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ''}
            </p>
            <div className="space-y-2">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 font-mono">{r.email}</span>
                  <span className={r.status === 'sent' ? 'text-emerald-400' : 'text-red-400'}>
                    {r.status === 'sent' ? '✓ sent' : `✗ ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setResult(null); setSubject(''); setBody(''); setRecipientsRaw(''); setVariables({}) }}
              className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
            >
              Send another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
