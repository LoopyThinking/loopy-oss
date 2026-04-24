import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Repeat2,
  Bot,
  BarChart2,
  BookOpen,
  Settings,
  ChevronDown,
  LogOut,
  User,
  Key,
  Building2,
  Menu,
  X,
} from 'lucide-react'
import { api, clearToken, clearCurrentOrgId, getCurrentOrgId, setCurrentOrgId, type Organization, type OrgRole } from '../lib/api'

interface LayoutProps {
  children: React.ReactNode
  /** Page title shown in breadcrumb / header */
  title?: string
  /** Optional breadcrumb segments: [{ label, href? }] */
  breadcrumbs?: Array<{ label: string; href?: string }>
  /** Current user's role in the org — controls Admin visibility */
  orgRole?: OrgRole
}

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/loops',     icon: Repeat2,         label: 'Loops' },
  { to: '/agents',    icon: Bot,             label: 'Agentes' },
  { to: '/framework', icon: BookOpen,        label: 'Framework' },
  { to: '/settings',  icon: Settings,        label: 'Ajustes' },
]

const adminItem = { to: '/admin', icon: BarChart2, label: 'Panel ejecutivo' }

export function Layout({ children, title, breadcrumbs, orgRole }: LayoutProps) {
  const [orgs, setOrgs]             = useState<Organization[]>([])
  const [currentOrgId, setCurrent]  = useState<string | null>(getCurrentOrgId())
  const [orgMenuOpen, setOrgMenu]   = useState(false)
  const [userMenuOpen, setUserMenu] = useState(false)
  const [sidebarOpen, setSidebar]   = useState(false)
  const navigate  = useNavigate()
  const location  = useLocation()

  const currentOrg = orgs.find(o => o.id === currentOrgId) ?? orgs[0] ?? null
  const isAdmin    = orgRole === 'admin' || orgRole === 'owner'

  // Load org list on mount
  useEffect(() => {
    api.orgs.list().then(list => {
      setOrgs(list)
      // Auto-select first org if nothing is stored
      if (!currentOrgId && list.length > 0) {
        setCurrentOrgId(list[0].id)
        setCurrent(list[0].id)
      }
    }).catch(() => {})
  }, [])

  function handleOrgSwitch(org: Organization) {
    setCurrentOrgId(org.id)
    setCurrent(org.id)
    setOrgMenu(false)
    // Reload the current route so data refreshes with the new org context
    navigate(0)
  }

  function handleSignOut() {
    clearToken()
    clearCurrentOrgId()
    navigate('/login')
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Element
      if (!target.closest('[data-dropdown]')) {
        setOrgMenu(false)
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const sidebarContent = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <span className="text-lg font-semibold text-gray-900 tracking-tight">Loopy OSS</span>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <Icon size={17} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}

        {/* Admin — only for admin/owner */}
        {isAdmin && (
          <NavLink
            to={adminItem.to}
            onClick={() => setSidebar(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`
            }
          >
            <adminItem.icon size={17} strokeWidth={1.75} />
            {adminItem.label}
          </NavLink>
        )}
      </div>

      {/* Version badge */}
      <div className="px-5 py-4 border-t border-gray-100">
        <span className="text-xs text-gray-400">v0.2.1</span>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* ── Sidebar — desktop ─────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* ── Sidebar — mobile overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50"
            onClick={() => setSidebar(false)}
          />
          <aside className="relative flex flex-col w-64 bg-white border-r border-gray-100 z-50">
            <button
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600"
              onClick={() => setSidebar(false)}
            >
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Main area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">

        {/* ── Top header ────────────────────────────────────────────────────── */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10">
          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 text-gray-500 hover:text-gray-800"
            onClick={() => setSidebar(true)}
          >
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
            {breadcrumbs && breadcrumbs.length > 0 ? (
              breadcrumbs.map((crumb, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="text-gray-300">›</span>}
                  {crumb.href ? (
                    <NavLink to={crumb.href} className="hover:text-gray-800 truncate">
                      {crumb.label}
                    </NavLink>
                  ) : (
                    <span className={i === breadcrumbs.length - 1 ? 'text-gray-800 font-medium truncate' : 'truncate'}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))
            ) : title ? (
              <span className="text-gray-800 font-medium truncate">{title}</span>
            ) : null}
          </div>

          {/* Org switcher */}
          {currentOrg && (
            <div className="relative" data-dropdown>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setOrgMenu(v => !v)}
              >
                <Building2 size={14} className="text-gray-400" />
                <span className="max-w-[120px] truncate">{currentOrg.name}</span>
                <ChevronDown size={13} className="text-gray-400" />
              </button>

              {orgMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                  <p className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Mis organizaciones
                  </p>
                  {orgs.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-between ${
                        org.id === currentOrgId ? 'text-indigo-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">{org.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          <div className="relative" data-dropdown>
            <button
              className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center hover:bg-indigo-200 transition-colors"
              onClick={() => setUserMenu(v => !v)}
            >
              <User size={15} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
                <NavLink
                  to="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setUserMenu(false)}
                >
                  <User size={14} className="text-gray-400" />
                  Mi perfil
                </NavLink>
                <NavLink
                  to="/settings/token"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  onClick={() => setUserMenu(false)}
                >
                  <Key size={14} className="text-gray-400" />
                  Mi token de agente
                </NavLink>
                <hr className="my-1 border-gray-100" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────────────────── */}
        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
