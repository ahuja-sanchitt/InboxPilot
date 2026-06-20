export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">

        {/* glow orb behind title */}
        <div className="absolute left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Inbox<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-300">Pilot</span>
          </h1>
          <p className="text-white/50 text-lg">Stop doing email manually.</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6 shadow-2xl shadow-black/40">
          <a
            href={`${import.meta.env.VITE_API_URL ?? ''}/auth/login`}
            className="inline-flex items-center gap-3 bg-white text-gray-800 font-semibold px-6 py-3 rounded-xl hover:bg-gray-100 transition-all w-full justify-center mb-8 shadow-lg shadow-black/20"
          >
            <GoogleIcon />
            Sign in with Google
          </a>

          <div className="space-y-3 text-left">
            {[
              { icon: '✦', text: 'Summarize your inbox with AI' },
              { icon: '◈', text: 'Create drafts for multiple people at once' },
              { icon: '⟶', text: 'Send the same email to everyone in seconds' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3 text-white/50 text-sm">
                <span className="text-violet-400 text-xs shrink-0">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/20 text-xs">Your emails never leave your session.</p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
    </svg>
  )
}
