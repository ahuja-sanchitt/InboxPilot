export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Inbox<span className="text-violet-400">Pilot</span>
        </h1>
        <p className="text-gray-400 mb-10 text-lg">
          Stop doing email manually.
        </p>

        <a
          href="/auth/login"
          className="inline-flex items-center gap-3 bg-white text-gray-800 font-medium px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors w-full justify-center mb-10"
        >
          <GoogleIcon />
          Sign in with Google
        </a>

        <div className="grid grid-cols-1 gap-3 text-left">
          {[
            { icon: '✦', text: 'Summarize your inbox with AI' },
            { icon: '✦', text: 'Create drafts for multiple people at once' },
            { icon: '✦', text: 'Send the same email to everyone in seconds' },
          ].map(item => (
            <div key={item.text} className="flex items-center gap-3 text-gray-400 text-sm">
              <span className="text-violet-400 text-xs">{item.icon}</span>
              {item.text}
            </div>
          ))}
        </div>
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
