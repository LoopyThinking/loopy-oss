import { useState, useEffect, useCallback } from 'react'
import {
  Users, UserPlus, Link2, Loader2, AlertTriangle,
  Shield, Trash2, Copy, Check, ChevronDown, X,
} from 'lucide-react'
import { Layout } from '../components/Layout'
import {
  api, getCurrentOrgId, type OrgRole, type OrgInvite,
} from '../lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Member {
  user_id: string
  email: string
  display_name: string | null
  role: OrgRole
  joined_at: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { day: '2-digit', month: 'short', year: 'numeric' })
}

function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000))
}

function RoleBadge({ role }: { role: OrgRole }) {
  const map: Record<OrgRole, string> = {
    owner:  'bg-indigo-100 text-indigo-700',
    admin:  'bg-purple-50 text-purple-700',
    member: 'bg-gray-100 text-gray-600',
    viewer: 'bg-gray-50 text-gray-500',
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[role]}`}>{role}</span>
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500) })
  }
  return (
    <button onClick={copy} className="flex items-center gap-1 text-xs text-accent hover:text-accent px-2 py-1 rounded hover:bg-accent-light transition-colors" title="Copy link">
      {copied ? <><Check size={12} className="text-green-500" /> Copied</> : <><Copy size={12} /> Copy</>}
    </button>
  )
}

const VALID_ROLES: OrgRole[] = ['viewer', 'member', 'admin']

// ── Main page ─────────────────────────────────────────────────────────────────

export function Team() {
  const orgId = getCurrentOrgId()

  const [members, setMembers]   = useState<Member[]>([])
  const [invites, setInvites]   = useState<OrgInvite[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  // Invite form state
  const [showForm, setShowForm]         = useState(false)
  const [inviteRole, setInviteRole]     = useState<OrgRole>('member')
  const [inviteDays, setInviteDays]     = useState(7)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviting, setInviting]         = useState(false)
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null)
  const [newInviteExp, setNewInviteExp] = useState<string | null>(null)
  const [inviteSent, setInviteSent]     = useState(false)
  const [inviteEmailError, setInviteEmailError] = useState<string | null>(null)

  const baseUrl = (import.meta.env.VITE_APP_BASE_URL as string | undefined) ?? window.location.origin

  const load = useCallback(async () => {
    if (!orgId) { setError('No organization selected'); setLoading(false); return }
    setLoading(true)
    try {
      const [memberList, inviteList] = await Promise.all([
        api.orgs.members(orgId),
        api.orgs.listInvites(orgId),
      ])
      setMembers(memberList as Member[])
      setInvites(inviteList)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error loading team')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  async function handleRoleChange(userId: string, newRole: OrgRole) {
    if (!orgId) return
    try {
      await api.orgs.updateMember(orgId, userId, newRole)
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error updating role')
    }
  }

  async function handleRemoveMember(userId: string, email: string) {
    if (!orgId) return
    if (!confirm(`Remove ${email} from the organization?`)) return
    try {
      await api.orgs.removeMember(orgId, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error eliminando miembro')
    }
  }

  async function handleCreateInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setInviting(true)
    setNewInviteUrl(null)
    setInviteSent(false)
    setInviteEmailError(null)
    try {
      const res = await api.orgs.createInvite(orgId, {
        role: inviteRole,
        expires_in_days: inviteDays,
        email: inviteEmail.trim() || undefined,
      })
      const url = `${baseUrl}/invites/accept/${res.invite_token}`
      if (res.email_sent) {
        setInviteSent(true)
      } else {
        setNewInviteUrl(url)
        setNewInviteExp(res.expires_at)
      }
      await load() // refresh invite list
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error creating invite'
      if (msg.includes('501') || msg.includes('Not Implemented') || msg.includes('Email provider')) {
        setInviteEmailError('Email sending is not configured on this instance. Copy the link manually.')
        // Still show the URL even if email fails
        try {
          const res2 = await api.orgs.createInvite(orgId, { role: inviteRole, expires_in_days: inviteDays })
          setNewInviteUrl(`${baseUrl}/invites/accept/${res2.invite_token}`)
          setNewInviteExp(res2.expires_at)
        } catch { /* ignore */ }
      } else {
        alert(msg)
      }
    } finally {
      setInviting(false)
    }
  }

  async function handleRevokeInvite(inviteId: string) {
    if (!orgId) return
    if (!confirm('Revoke this invite? It won\'t be usable.')) return
    try {
      await api.orgs.revokeInvite(orgId, inviteId)
      setInvites(prev => prev.filter(i => i.id !== inviteId))
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Error revoking invite')
    }
  }

  return (
    <Layout
      title="Team"
      breadcrumbs={[{ label: 'Executive Panel', href: '/admin' }, { label: 'Team' }]}
    >
      <div className="max-w-3xl space-y-8">

        {loading && (
          <div className="flex items-center gap-2 text-subtle text-sm py-12">
            <Loader2 size={16} className="animate-spin" /> Loading team…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* ── Active members ─────────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-subtle" />
                  <h2 className="text-base font-semibold text-primary">Active members</h2>
                  <span className="text-xs bg-elevated text-muted px-2 py-0.5 rounded-full">{members.length}</span>
                </div>
              </div>
              <div className="bg-card border border-edge rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-edge-subtle text-xs font-medium text-subtle uppercase tracking-wide">
                      <th className="text-left px-4 py-3">User</th>
                      <th className="text-left px-4 py-3">Role</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge-subtle">
                    {members.map(m => (
                      <tr key={m.user_id}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-primary">{m.display_name ?? m.email}</p>
                          {m.display_name && <p className="text-xs text-subtle">{m.email}</p>}
                        </td>
                        <td className="px-4 py-3">
                          {m.role === 'owner' ? (
                            <RoleBadge role={m.role} />
                          ) : (
                            <RoleDropdown
                              current={m.role}
                              onChange={role => handleRoleChange(m.user_id, role)}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-subtle text-xs hidden md:table-cell">{fmtDate(m.joined_at)}</td>
                        <td className="px-4 py-3 text-right">
                          {m.role !== 'owner' && (
                            <button
                              onClick={() => handleRemoveMember(m.user_id, m.email)}
                              className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-light rounded transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* ── Invitaciones pendientes ──────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Link2 size={16} className="text-subtle" />
                  <h2 className="text-base font-semibold text-primary">Pending invites</h2>
                  {invites.length > 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{invites.length}</span>
                  )}
                </div>
                <button
                  onClick={() => { setShowForm(v => !v); setNewInviteUrl(null) }}
                  className="flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent transition-colors"
                >
                  <UserPlus size={14} /> Generate invite
                </button>
              </div>

              {/* New invite form */}
              {showForm && (
                <form onSubmit={handleCreateInvite} className="bg-accent-light border border-indigo-100 rounded-xl p-4 mb-4">
                  <div className="flex flex-wrap gap-4 items-end">
                    <div>
                      <label className="block text-xs font-medium text-accent mb-1">Role</label>
                      <select
                        value={inviteRole}
                        onChange={e => setInviteRole(e.target.value as OrgRole)}
                        className="px-3 py-2 text-sm bg-card border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                      >
                        {VALID_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-accent mb-1">Email (optional)</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        placeholder="colleague@company.com"
                        className="w-52 px-3 py-2 text-sm bg-card border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-accent mb-1">Expires (days)</label>
                      <input
                        type="number" min={1} max={30}
                        value={inviteDays}
                        onChange={e => setInviteDays(Number(e.target.value))}
                        className="w-20 px-3 py-2 text-sm bg-card border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={inviting}
                      className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {inviting ? <Loader2 size={13} className="animate-spin" /> : <UserPlus size={13} />}
                      Send invite
                    </button>
                    <button type="button" onClick={() => setShowForm(false)} className="p-2 text-subtle hover:text-secondary">
                      <X size={15} />
                    </button>
                  </div>

                  {/* Email error */}
                  {inviteEmailError && (
                    <div className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 text-sm text-amber-700">
                      {inviteEmailError}
                    </div>
                  )}

                  {/* Success — email sent */}
                  {inviteSent && (
                    <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-green-700">
                        ✅ Invitation sent by email.{' '}
                        {newInviteExp && `Expires ${fmtDate(newInviteExp)}.`}
                      </p>
                    </div>
                  )}

                  {/* Success — URL to copy */}
                  {newInviteUrl && (
                    <div className="mt-4 bg-card border border-indigo-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-accent mb-2">
                        ✅ Link generated — share it with your teammate.{' '}
                        {newInviteExp && `Expires ${fmtDate(newInviteExp)}.`}
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-surface border border-edge rounded px-2 py-1.5 font-mono break-all text-secondary">
                          {newInviteUrl}
                        </code>
                        <CopyButton text={newInviteUrl} />
                      </div>
                    </div>
                  )}
                </form>
              )}

              {invites.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-edge rounded-xl">
                  <Link2 size={24} className="mx-auto text-subtle mb-2" />
                  <p className="text-sm text-subtle">No pending invites.</p>
                </div>
              ) : (
                <div className="bg-card border border-edge rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-edge-subtle text-xs font-medium text-subtle uppercase tracking-wide">
                        <th className="text-left px-4 py-3">Role</th>
                        <th className="text-left px-4 py-3">Expires in</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Created</th>
                        <th className="px-4 py-3 text-right">Link / Revoke</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-edge-subtle">
                      {invites.map(inv => {
                        const days = daysUntil(inv.expires_at)
                        const inviteUrl = `${baseUrl}/invites/accept/${(inv as any).token ?? ''}`
                        return (
                          <tr key={inv.id}>
                            <td className="px-4 py-3"><RoleBadge role={inv.role} /></td>
                            <td className="px-4 py-3">
                              <span className={`text-sm ${days <= 1 ? 'text-amber-600 font-medium' : 'text-secondary'}`}>
                                {days === 0 ? 'Today' : `${days}d`}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-subtle text-xs hidden md:table-cell">{fmtDate(inv.created_at)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <CopyButton text={inviteUrl} />
                                <button
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  className="p-1.5 text-subtle hover:text-red-500 hover:bg-red-light rounded transition-colors"
                                  title="Revoke"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  )
}

// ── RoleDropdown ──────────────────────────────────────────────────────────────

function RoleDropdown({ current, onChange }: { current: OrgRole; onChange: (r: OrgRole) => void }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-block" data-dropdown>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-elevated text-secondary hover:bg-hover transition-colors"
      >
        {current}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute left-0 mt-1 w-28 bg-card border border-edge rounded-lg shadow-md py-1 z-20">
          {VALID_ROLES.filter(r => r !== current).map(r => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-xs text-secondary hover:bg-hover flex items-center gap-1.5"
            >
              <Shield size={10} className="text-subtle" /> {r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
