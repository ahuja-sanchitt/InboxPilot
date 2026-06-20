import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../api'

function extractVariables(text) {
  const matches = text.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))]
}

const inputCls = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-violet-500/60 placeholder-white/20 transition-colors"

export default function BulkDraft() {
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [recipientsRaw, setRecipientsRaw] = useState('')
  const [variables, setVariables] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const navigate = useNavigate()

  async function handleGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setError('')
    try {
      const res = await api.post('/drafts/generate', { prompt: aiPrompt })
      const d = res.data
      if (d.subject) setSubject(d.subject)
      if (d.body) setBody(d.body)
      if (d.recipients?.length) setRecipientsRaw(d.recipients.join('\n'))
      if (d.variables) setVariables(d.variables)
    } catch (e) {
      setError(e.response?.data?.detail ?? 'AI generation failed.')
    } finally {
      setAiLoading(false)
    }
  }

  const detectedVars = extractVariables(subject + ' ' + body)
  const recipients = recipientsRaw.split('\n').map(e => e.trim()).filter(e => e.length > 0)

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
    <div className="min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-white/30 hover:text-white/60 text-sm mb-8 flex items-center gap-1 transition-colors cursor-pointer">
          ← Back
        </button>

        <h1 className="text-2xl font-bold text-white mb-1">Bulk Draft Creator</h1>
        <p className="text-white/40 text-sm mb-8">
          One message, many drafts. Use <code className="bg-white/10 text-violet-300 px-1.5 py-0.5 rounded">{'{{variable}}'}</code> for placeholders.
        </p>

        {/* AI prompt box */}
        <div className="bg-violet-500/5 backdrop-blur-sm border border-violet-500/20 rounded-2xl p-4 mb-6">
          <label className="text-violet-300 text-sm font-medium block mb-2">✦ Describe your email to AI</label>
          <div className="flex gap-2">
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleGenerate() } }}
              placeholder="e.g. Send a monthly report email to john@company.com — same body each time, just change the month"
              rows={2}
              className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/60 placeholder-white/20 resize-none"
            />
            <button
              onClick={handleGenerate}
              disabled={aiLoading || !aiPrompt.trim()}
              className="shrink-0 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/50 disabled:text-violet-400/30 text-white text-sm font-medium px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-violet-500/20"
            >
              {aiLoading ? '...' : 'Generate'}
            </button>
          </div>
          <p className="text-white/20 text-xs mt-2">AI fills in the fields below. Edit them freely after.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">Subject</label>
            <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="e.g. {{month}} Monthly Report" className={inputCls} />
          </div>

          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">Message Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              placeholder={"Hi {{name}},\n\nPlease find the {{month}} report attached..."}
              rows={6} className={`${inputCls} resize-none`} />
          </div>

          <div>
            <label className="text-white/60 text-sm font-medium block mb-2">
              Recipients <span className="text-white/25 font-normal">(one email per line)</span>
            </label>
            <textarea value={recipientsRaw} onChange={e => setRecipientsRaw(e.target.value)}
              placeholder={"alice@example.com\nbob@example.com\ncarol@example.com"}
              rows={4} className={`${inputCls} resize-none font-mono`} />
            {recipients.length > 0 && (
              <p className="text-white/25 text-xs mt-1">{recipients.length} recipient{recipients.length !== 1 ? 's' : ''}</p>
            )}
          </div>

          {detectedVars.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <p className="text-white/70 text-sm font-medium mb-1">Fill in variables</p>
              <p className="text-white/25 text-xs mb-3">Comma-separate values to create one draft per value — e.g. <span className="text-white/40">January, February, March</span></p>
              <div className="grid grid-cols-2 gap-3">
                {detectedVars.map(v => {
                  const ALL_MONTHS = 'January, February, March, April, May, June, July, August, September, October, November, December'
                  const isMonth = v.toLowerCase() === 'month'
                  const val = variables[v] ?? ''
                  const valueCount = val ? val.split(',').filter(x => x.trim()).length : 0
                  return (
                    <div key={v} className="col-span-2 sm:col-span-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-white/40 text-xs">{`{{${v}}}`}</label>
                        {isMonth && (
                          <button type="button"
                            onClick={() => setVariables(prev => ({ ...prev, [v]: ALL_MONTHS }))}
                            className="text-xs text-violet-400 hover:text-violet-300 transition-colors cursor-pointer">
                            📅 All 12 months
                          </button>
                        )}
                      </div>
                      <input type="text" value={val}
                        onChange={e => setVariables(prev => ({ ...prev, [v]: e.target.value }))}
                        placeholder={isMonth ? 'e.g. June  or  January, February, ...' : v}
                        className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-violet-500/60 placeholder-white/20" />
                      {valueCount > 1 && (
                        <p className="text-violet-400 text-xs mt-1">→ {valueCount} drafts will be created</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm mt-4">
            {error}
          </div>
        )}

        <button onClick={handleCreate} disabled={loading}
          className="w-full mt-6 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-900/50 disabled:text-violet-400/30 text-white font-medium py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20">
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-violet-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating drafts...
            </>
          ) : 'Create Drafts'}
        </button>

        {result && (
          <div className="mt-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto mb-3">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-emerald-400 font-semibold text-lg mb-1">{result.created} draft{result.created !== 1 ? 's' : ''} created!</p>
            <p className="text-white/40 text-sm mb-4">Check your Gmail Drafts folder.</p>
            <div className="text-left space-y-1.5 mb-5">
              {result.results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-white/5 rounded-lg px-3 py-2">
                  <span className="text-white/50 font-mono text-xs">{r.label || r.email}</span>
                  <span className={r.status === 'created' ? 'text-emerald-400 text-xs' : 'text-red-400 text-xs'}>
                    {r.status === 'created' ? '✓ saved' : `✗ ${r.error}`}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={() => { setResult(null); setSubject(''); setBody(''); setRecipientsRaw(''); setVariables({}) }}
              className="text-sm text-white/30 hover:text-white/60 transition-colors cursor-pointer">
              Create more drafts
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
