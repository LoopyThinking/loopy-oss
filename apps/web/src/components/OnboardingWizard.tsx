import { useState } from 'react'
import { Bot, User, Building2, Key, Check, Loader2 } from 'lucide-react'
import { api } from '../lib/api'

// ── Props ─────────────────────────────────────────────────────────────────────

interface WizardProps {
  onComplete: () => void
}

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { icon: Bot,       title: 'Welcome' },
  { icon: User,      title: 'Profile' },
  { icon: Building2, title: 'Organization' },
  { icon: Key,       title: 'Agent Token' },
  { icon: Check,     title: 'Done' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingWizard({ onComplete }: WizardProps) {
  const [step, setStep] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentToken, setAgentToken] = useState<string | null>(null)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleNext() {
    setError(null)

    if (step === 1) {
      // Save display name
      if (!displayName.trim()) { setError('Please enter a name.'); return }
      setLoading(true)
      try {
        await api.me.update({ display_name: displayName.trim() })
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error saving name')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    if (step === 2 && orgName.trim()) {
      // Create org (optional)
      setLoading(true)
      try {
        const org = await api.orgs.create({ name: orgName.trim() })
        // Set as current org
        const { setCurrentOrgId } = await import('../lib/api')
        setCurrentOrgId(org.id)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Error creating organization')
        setLoading(false)
        return
      }
      setLoading(false)
    }

    if (step === 3) {
      // Generate agent token
      setLoading(true)
      try {
        const res = await api.me.agentToken()
        if (res.token) setAgentToken(res.token)
      } catch {}
      setLoading(false)
    }

    if (step === 4) {
      // Mark onboarding as complete
      setLoading(true)
      try {
        await api.me.update({ onboarded: true })
        onComplete()
      } catch {
        // Even if the API call fails, complete the wizard
        onComplete()
      }
      return
    }

    setStep(s => Math.min(s + 1, 4))
  }

  function skip() {
    // Mark onboarded and close
    api.me.update({ onboarded: true }).catch(() => {})
    onComplete()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border border-edge shadow-2xl w-full max-w-lg mx-4 overflow-hidden">

        {/* Progress bar */}
        <div className="flex gap-1 px-6 pt-6 pb-2">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? 'bg-accent' : 'bg-edge'
              }`}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 px-6 pt-2 pb-1">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div
                key={i}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  i === step ? 'text-accent' : i < step ? 'text-green-600' : 'text-subtle'
                }`}
              >
                <Icon size={12} />
                <span className="hidden sm:inline">{s.title}</span>
              </div>
            )
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center">
              <Bot size={40} className="mx-auto text-accent mb-4" />
              <h2 className="text-lg font-bold text-primary mb-2">Welcome to Loopy!</h2>
              <p className="text-sm text-muted leading-relaxed">
                Loopy helps you track decisions, signals, and insights across your team.
                Let&apos;s get you set up in a few quick steps.
              </p>
            </div>
          )}

          {/* Step 1: Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-1">Your profile</h2>
              <p className="text-sm text-muted mb-4">How should we call you?</p>
              <label className="block text-xs font-medium text-secondary mb-1">Display name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                maxLength={120}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          )}

          {/* Step 2: Organization */}
          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-1">Create an organization</h2>
              <p className="text-sm text-muted mb-4">
                Organizations group your team members and loops. You can skip this and create one later.
              </p>
              <label className="block text-xs font-medium text-secondary mb-1">Organization name (optional)</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                placeholder="My Team"
                maxLength={120}
                autoFocus
                className="w-full px-3 py-2 text-sm border border-edge rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          )}

          {/* Step 3: Agent token */}
          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold text-primary mb-1">Agent token</h2>
              <p className="text-sm text-muted mb-4">
                Agent tokens let scripts and AI assistants authenticate against the API.
              </p>

              {agentToken ? (
                <div className="bg-card border border-indigo-100 rounded-xl p-4">
                  <p className="text-xs font-medium text-accent mb-2">
                    Copy this token now. You won&apos;t be able to see it again.
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <code className="flex-1 text-xs bg-surface border border-edge rounded px-2 py-1.5 font-mono break-all text-secondary">
                      {agentToken}
                    </code>
                    <button
                      onClick={() => { navigator.clipboard.writeText(agentToken); setTokenCopied(true) }}
                      className="px-2 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-hover"
                    >
                      {tokenCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-subtle">Click next to generate a token, or skip this step.</p>
              )}
            </div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check size={24} className="text-green-600" />
              </div>
              <h2 className="text-lg font-bold text-primary mb-2">You&apos;re all set!</h2>
              <p className="text-sm text-muted leading-relaxed">
                Start creating loops, tracking signals, and collaborating with your team.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-edge flex items-center justify-between">
          <button
            onClick={skip}
            className="text-xs text-subtle hover:text-secondary transition-colors"
          >
            Skip tutorial
          </button>
          <button
            onClick={handleNext}
            disabled={loading}
            className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : null}
            {step === 4 ? 'Get started' : loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
