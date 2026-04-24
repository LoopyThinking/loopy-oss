import { useNavigate } from 'react-router-dom'
import { CreateLoopForm } from '../components/CreateLoopForm'

export function NewLoop() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-slate-700 transition text-lg leading-none"
            aria-label="Back"
          >
            ←
          </button>
          <span className="font-semibold text-slate-900">New Loop</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-1">Create a loop</h1>
          <p className="text-sm text-slate-500 mb-7">
            A loop tracks a hypothesis toward a decision or outcome.
          </p>
          <CreateLoopForm />
        </div>
      </main>
    </div>
  )
}
