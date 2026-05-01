import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Building2, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { api, getToken, setCurrentOrgId, type OrgRole } from '../lib/api'

type InviteState =
  | { status: 'loading' }
  | { status: 'ready';    orgName: string; orgId: string; role: OrgRole; expiresAt: string }
  | { status: 'joining' }
  | { status: 'done';     orgName: string; alreadyMember: boolean }
  | { status: 'error';    message: string }
  | { status: 'expired' }

const ROLE_LABEL: Record<string, string> = {
  viewer: 'Read-only',
  member: 'Member',
  admin:  'Admin',
  owner:  'Owner',
}

export function InviteAccept() {
  const { token }   = useParams<{ token: string }>()
  const navigate    = useNavigate()
  const [state, setState] = useState<InviteState>({ status: 'loading' })
  const isLoggedIn  = !!getToken()

  // 1. Fetch invite details on mount
  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Invite token not found in URL.' })
      return
    }

    api.invites.get(token)
      .then(inv => {
        setState({
          status:    'ready',
          orgName:   inv.org_name,
          orgId:     inv.org_id,
          role:      inv.role,
          expiresAt: inv.expires_at,
        })
      })
      .catch(err => {
        if (err.status === 410) {
          setState({ status: 'expired' })
        } else if (err.status === 404) {
          setState({ status: 'error', message: 'This invitation does not exist or was already used.' })
        } else {
          setState({ status: 'error', message: err.message ?? 'Error loading invitation.' })
        }
      })
  }, [token])

  function handleAccept() {
    if (!token) return

    if (!isLoggedIn) {
      // Redirect to login, preserve invite URL for after auth
      navigate(`/login?redirect=/invites/accept/${token}`)
      return
    }

    setState({ status: 'joining' })
    api.invites.accept(token)
      .then(result => {
        setCurrentOrgId(result.org_id)
        setState({ status: 'done', orgName: result.org_name, alreadyMember: result.already_member })
      })
      .catch(err => {
        setState({ status: 'error', message: err.message ?? 'Error accepting invitation.' })
      })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <span className="text-2xl font-semibold text-primary tracking-tight">Loopy OSS</span>
        </div>

        <div className="bg-card border border-edge rounded-2xl shadow-sm p-8">

          {/* Loading */}
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="text-accent/60 animate-spin" />
              <p className="text-sm text-muted">Loading invitation…</p>
            </div>
          )}

          {/* Ready — show invite details + CTA */}
          {state.status === 'ready' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-accent-light flex items-center justify-center">
                  <Building2 size={26} className="text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted mb-1">You've been invited to join</p>
                  <h1 className="text-xl font-semibold text-primary">{state.orgName}</h1>
                  <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent-light text-accent">
                    Rol: {ROLE_LABEL[state.role] ?? state.role}
                  </span>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 text-center">
                  You need to log in before accepting this invitation.
                </div>
              )}

              <button
                onClick={handleAccept}
                className="w-full py-2.5 px-4 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover transition-colors"
              >
                {isLoggedIn ? `Join ${state.orgName}` : 'Log in to accept'}
              </button>

              <p className="text-xs text-subtle text-center">
                Expires {new Date(state.expiresAt).toLocaleDateString('en', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Joining spinner */}
          {state.status === 'joining' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="text-accent/60 animate-spin" />
              <p className="text-sm text-muted">Joining organization…</p>
            </div>
          )}

          {/* Done */}
          {state.status === 'done' && (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-primary">
                  {state.alreadyMember ? 'Already a member' : 'Welcome!'}
                </h2>
                <p className="text-sm text-muted mt-1">
                  {state.alreadyMember
                    ? `Ya pertenecías a ${state.orgName}.`
                    : `Ahora eres miembro de ${state.orgName}.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 py-2.5 px-6 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover transition-colors"
              >
                Ir al dashboard
              </button>
            </div>
          )}

          {/* Expired */}
          {state.status === 'expired' && (
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-primary">Expired invitation</h2>
              <p className="text-sm text-muted">
                This invitation has expired or was already used. Ask the organization admin to generate a new one.
              </p>
            </div>
          )}

          {/* Error */}
          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-primary">Algo salió mal</h2>
              <p className="text-sm text-muted">{state.message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 text-sm text-accent hover:underline"
              >
                Volver al dashboard
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
