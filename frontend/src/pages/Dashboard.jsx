import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { useAuth } from '../App'

const features = [
  {
    path: '/summary',
    title: 'AI Summary',
    description: 'Summarize your last N emails instantly. Claude reads your inbox and tells you what matters.',
    icon: '✦',
    color: 'violet',
  },
  {
    path: '/bulk-draft',
    title: 'Bulk Draft',
    description: 'Write one message, add multiple recipients — drafts appear in your Gmail for each person.',
    icon: '◈',
    color: 'blue',
  },
  {
    path: '/bulk-send',
    title: 'Bulk Send',
    description: 'Send the same email to many people at once. Preview before it goes out.',
    icon: '⟶',
    color: 'emerald',
  },
]

const colorMap = {
  violet: 'text-violet-400 bg-violet-400/10 border-violet-400/20',
  blue: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const firstName = user?.name?.split(' ')[0] ?? 'there'

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-white mb-2">
            Hey, {firstName} 👋
          </h1>
          <p className="text-gray-400">What do you want to do with your inbox today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map(f => (
            <button
              key={f.path}
              onClick={() => navigate(f.path)}
              className="text-left bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 hover:bg-gray-800/50 transition-all group cursor-pointer"
            >
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg border text-lg mb-4 ${colorMap[f.color]}`}>
                {f.icon}
              </div>
              <h2 className="text-white font-semibold mb-2 group-hover:text-violet-300 transition-colors">
                {f.title}
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
