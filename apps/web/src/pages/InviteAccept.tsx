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
  viewer: 'Solo lectura',
  member: 'Miembro',
  admin:  'Administrador',
  owner:  'Propietario',
}

export function InviteAccept() {
  const { token }   = useParams<{ token: string }>()
  const navigate    = useNavigate()
  const [state, setState] = useState<InviteState>({ status: 'loading' })
  const isLoggedIn  = !!getToken()

  // 1. Fetch invite details on mount
  useEffect(() => {
    if (!token) {
      setState({ status: 'error', message: 'Token de invitación no encontrado en la URL.' })
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
          setState({ status: 'error', message: 'Esta invitación no existe o ya fue usada.' })
        } else {
          setState({ status: 'error', message: err.message ?? 'Error al cargar la invitación.' })
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
        setState({ status: 'error', message: err.message ?? 'Error al aceptar la invitación.' })
      })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / brand */}
        <div className="text-center mb-8">
          <span className="text-2xl font-semibold text-gray-900 tracking-tight">Loopy OSS</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-8">

          {/* Loading */}
          {state.status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-gray-500">Cargando invitación…</p>
            </div>
          )}

          {/* Ready — show invite details + CTA */}
          {state.status === 'ready' && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                  <Building2 size={26} className="text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Te invitaron a unirte a</p>
                  <h1 className="text-xl font-semibold text-gray-900">{state.orgName}</h1>
                  <span className="inline-flex mt-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    Rol: {ROLE_LABEL[state.role] ?? state.role}
                  </span>
                </div>
              </div>

              {!isLoggedIn && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 text-center">
                  Necesitas iniciar sesión antes de aceptar la invitación.
                </div>
              )}

              <button
                onClick={handleAccept}
                className="w-full py-2.5 px-4 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
              >
                {isLoggedIn ? `Unirme a ${state.orgName}` : 'Iniciar sesión para aceptar'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Expira el {new Date(state.expiresAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          )}

          {/* Joining spinner */}
          {state.status === 'joining' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 size={28} className="text-indigo-400 animate-spin" />
              <p className="text-sm text-gray-500">Uniéndote a la organización…</p>
            </div>
          )}

          {/* Done */}
          {state.status === 'done' && (
            <div className="flex flex-col items-center gap-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {state.alreadyMember ? 'Ya eres miembro' : '¡Bienvenido!'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {state.alreadyMember
                    ? `Ya pertenecías a ${state.orgName}.`
                    : `Ahora eres miembro de ${state.orgName}.`}
                </p>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 py-2.5 px-6 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
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
              <h2 className="text-lg font-semibold text-gray-900">Invitación expirada</h2>
              <p className="text-sm text-gray-500">
                Esta invitación ya venció o fue usada. Pide al administrador de la organización que genere una nueva.
              </p>
            </div>
          )}

          {/* Error */}
          {state.status === 'error' && (
            <div className="flex flex-col items-center gap-3 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertCircle size={28} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Algo salió mal</h2>
              <p className="text-sm text-gray-500">{state.message}</p>
              <button
                onClick={() => navigate('/dashboard')}
                className="mt-2 text-sm text-indigo-600 hover:underline"
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
