import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

const inputCls = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 placeholder-white/20 transition-colors"

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
  const recipients = recipientsRaw.split('\n').map(e => e.trim()).filter(e => e.length > 0)
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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-white/30 hover:text-white/60 text-sm mb-8 flex items-center gap-1 transition-colors cursor-pointer">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">Bulk Send</h1>
        <p className="text-white/40 text-sm mb-8">Send one email to many people. Preview first, then send.</p>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">Subject</label>
            <input type="text" value={subject}
              onChange={e => { setSubject(e.target.value); setPreview(null) }}
              placeholder="e.g. {{month}} Update" className={inputCls} />
          </div>

          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">Message Body</label>
            <textarea value={body}
              onChange={e => { setBody(e.target.value); setPreview(null) }}
              placeholder={"Hi {{name}},\n\nJust wanted to share..."}
              rows={6} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">
              Recipients <span className="text-white/25 font-normal">(one email per line)</span>
            </label>
            <textarea value={recipientsRaw}
              onChange={e => { setRecipientsRaw(e.target.value); setPreview(null) }}
              placeholder={"alice@example.com\nbob@example.com"}
              rows={4} className={`${inputCls} resize-none font-mono`} />
            {recipients.length > 0 && (
              <p className="text-white/25 text-xs mt-1">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {detectedVars.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <p className="text-white/70 text-sm font-medium mb-3">Fill in variables</p>
              <div className="grid grid-cols-2 gap-3">
                {detectedVars.map(v => (
                  <div key={v}>
                    <label className="text-white/40 text-xs mb-1 block">{`{{${v}}}`}</label>
                    <input type="text" value={variables[v] ?? ''}
                      onChange={e => { setVariables(prev => ({ ...prev, [v]: e.target.value })); setPreview(null) }}
                      placeholder={v}
                      className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60 placeholder-white/20" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm mt-4">
            {error}
          </div>
        )}

        {!preview && !result && (
          <button onClick={handlePreview} disabled={loading}
            className="w-full mt-6 bg-white/10 hover:bg-white/15 disabled:opacity-50 border border-white/10 text-white font-medium py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2">
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Building preview...
              </>
            ) : 'Preview Send'}
          </button>
        )}

        {preview && !result && (
          <div className="mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
            <p className="text-white/70 font-medium mb-1">Preview</p>
            <p className="text-white/25 text-xs mb-4">This is exactly what will be sent.</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm"><span className="text-white/30">Subject: </span><span className="text-white">{preview.subject}</span></div>
              <div className="text-sm"><span className="text-white/30">Body preview: </span><span className="text-white/60">{preview.body_preview}</span></div>
              <div className="text-sm"><span className="text-white/30">Recipients: </span><span className="text-white/60">{preview.recipients.join(', ')}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setPreview(null)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 font-medium py-2.5 rounded-xl transition-all text-sm cursor-pointer">
                Edit
              </button>
              <button onClick={handleSend} disabled={sending}
                className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/50 disabled:text-violet-400/30 text-white font-medium py-2.5 rounded-xl transition-all text-sm cursor-pointer shadow-lg shadow-violet-500/20">
                {sending ? 'Sending...' : `Send to ${preview.recipient_count} people`}
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold text-lg mb-4">
              {result.sent} sent{result.failed > 0 ? `, ${result.failed} failed` : ''}
            </p>
            <div className="space-y-1.5 text-left mb-5">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/50 font-mono text-xs">{r.email}</span>
                  <span className={r.status === 'sent' ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                    {r.status === 'sent' ? '✓ sent' : `✗ ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => { setResult(null); setSubject(''); setBody(''); setRecipientsRaw(''); setVariables({}) }}
              className="text-sm text-white/30 hover:text-white/60 transition-colors cursor-pointer">
              Send another
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
