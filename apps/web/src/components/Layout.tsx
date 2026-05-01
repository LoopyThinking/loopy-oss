import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Repeat2, Bot, BarChart2, BookOpen,
  Settings, ChevronDown, LogOut, User, Key, Building2, Menu, X, Users,
  TrendingUp, Sun, Moon,
} from 'lucide-react'
import {
  api, clearToken, clearCurrentOrgId,
  getCurrentOrgId, setCurrentOrgId,
  type Organization,
} from '../lib/api'
import { useTheme } from '../context/ThemeContext'

interface LayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
}

const ROLE_RANK: Record<string, number> = {
  viewer: 0, member: 1, admin: 2, owner: 3,
}

function hasMinRole(userRole: string | null, minRole: string | null): boolean {
  if (!minRole) return true
  return (ROLE_RANK[userRole ?? ''] ?? -1) >= (ROLE_RANK[minRole] ?? 99)
}

const navItems = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard',       minRole: null },
  { to: '/loops',      icon: Repeat2,         label: 'Loops',           minRole: null },
  { to: '/agents',     icon: Bot,             label: 'Agents',          minRole: null },
  { to: '/admin',      icon: BarChart2,       label: 'Executive Panel', minRole: 'admin' },
  { to: '/analytics',  icon: TrendingUp,      label: 'Analytics',       minRole: 'admin' },
  { to: '/admin/team', icon: Users,           label: 'Team',            minRole: 'admin' },
  { to: '/settings',   icon: Settings,        label: 'Settings',        minRole: null },
]

export function Layout({ children, title, breadcrumbs }: LayoutProps) {
  const [orgs, setOrgs]            = useState<Organization[]>([])
  const [currentOrgId, setCurrent] = useState<string | null>(getCurrentOrgId())
  const [orgMenuOpen, setOrgMenu]  = useState(false)
  const [userMenuOpen, setUserMenu]= useState(false)
  const [sidebarOpen, setSidebar]  = useState(false)
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // Derive current org and role from loaded orgs
  const currentOrg = orgs.find(o => o.id === currentOrgId) ?? orgs[0] ?? null
  const currentRole = currentOrg?.role ?? null

  useEffect(() => {
    api.orgs.list()
      .then(list => {
        setOrgs(list)
        if (!getCurrentOrgId() && list.length > 0) {
          setCurrentOrgId(list[0].id)
          setCurrent(list[0].id)
        }
      })
      .catch(() => {})
  }, [])

  function handleOrgSwitch(org: Organization) {
    setCurrentOrgId(org.id)
    setCurrent(org.id)
    setOrgMenu(false)
    // Re-render with new org context without full reload
    window.location.reload()
  }

  function handleSignOut() {
    clearToken()
    clearCurrentOrgId()
    navigate('/login')
  }

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
      <div className="px-5 py-5 border-b border-edge">
        <span className="text-lg font-ui text-primary tracking-tight">Loopy OSS</span>
      </div>
      <div className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems
          .filter(item => hasMinRole(currentRole, item.minRole))
          .map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={() => setSidebar(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-accent-light text-accent font-ui'
                    : 'text-secondary hover:text-primary hover:bg-hover font-medium'
                }`
              }
            >
              <Icon size={17} strokeWidth={1.75} />
              {label}
            </NavLink>
          ))}
      </div>
      {/*
       * Footer: version label first, then Framework icon and theme toggle
       * at the very bottom of the sidebar.
       */}
      <div className="px-5 py-3 border-t border-edge">
        <span className="text-xs text-subtle">v0.6.0</span>
      </div>
      <div className="border-t border-edge px-4 py-3 flex items-center gap-2">
        <NavLink
          to="/framework"
          title="Framework"
          className="p-1.5 text-subtle hover:text-accent hover:bg-accent-light rounded transition-colors"
        >
          <BookOpen size={16} />
        </NavLink>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          className="p-1.5 text-subtle hover:text-secondary hover:bg-hover rounded transition-colors"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-panel border-r border-edge fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebar(false)} />
          <aside className="relative flex flex-col w-64 bg-panel border-r border-edge z-50">
            <button className="absolute top-3 right-3 p-1.5 text-subtle hover:text-secondary" onClick={() => setSidebar(false)}>
              <X size={18} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Header */}
        <header className="h-14 bg-panel border-b border-edge flex items-center px-4 md:px-6 gap-4 sticky top-0 z-10">
          <button className="md:hidden p-1.5 text-muted hover:text-primary" onClick={() => setSidebar(true)}>
            <Menu size={20} />
          </button>

          {/* Breadcrumbs */}
          <div className="flex-1 flex items-center gap-1.5 text-sm text-muted min-w-0">
            {breadcrumbs && breadcrumbs.length > 0
              ? breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <span className="text-subtle">›</span>}
                    {crumb.href
                      ? <NavLink to={crumb.href} className="hover:text-primary truncate">{crumb.label}</NavLink>
                      : <span className={i === breadcrumbs.length - 1 ? 'text-primary font-medium truncate' : 'truncate'}>{crumb.label}</span>
                    }
                  </span>
                ))
              : title
                ? <span className="text-primary font-medium truncate">{title}</span>
                : null
            }
          </div>

          {/* Org switcher */}
          {currentOrg && (
            <div className="relative" data-dropdown>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary bg-surface border border-edge rounded-lg hover:bg-hover transition-colors"
                onClick={() => setOrgMenu(v => !v)}
              >
                <Building2 size={14} className="text-subtle" />
                <span className="max-w-[120px] truncate">{currentOrg.name}</span>
                {orgs.length > 1 && <ChevronDown size={13} className="text-subtle" />}
              </button>
              {orgMenuOpen && orgs.length > 1 && (
                <div className="absolute right-0 mt-1 w-56 bg-card border border-edge rounded-xl shadow-lg py-1 z-50">
                  <p className="px-3 py-1.5 text-xs text-subtle font-medium uppercase tracking-wide">My organizations</p>
                  {orgs.map(org => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSwitch(org)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-hover flex items-center justify-between ${
                        org.id === currentOrgId ? 'text-accent font-medium' : 'text-secondary'
                      }`}
                    >
                      <span className="truncate">{org.name}</span>
                      <span className="text-xs text-subtle ml-2 shrink-0">{org.role}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User menu */}
          <div className="relative" data-dropdown>
            <button
              className="w-8 h-8 rounded-full bg-accent-light text-accent flex items-center justify-center hover:bg-hover transition-colors"
              onClick={() => setUserMenu(v => !v)}
            >
              <User size={15} />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-card border border-edge rounded-xl shadow-lg py-1 z-50">
                <NavLink to="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-secondary hover:bg-hover" onClick={() => setUserMenu(false)}>
                  <User size={14} className="text-subtle" /> My profile
                </NavLink>
                <NavLink to="/settings" className="flex items-center gap-2.5 px-3 py-2 text-sm text-secondary hover:bg-hover" onClick={() => setUserMenu(false)}>
                  <Key size={14} className="text-subtle" /> My agent token
                </NavLink>
                <hr className="my-1 border-edge" />
                <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red hover:bg-red-light/50">
                  <LogOut size={14} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6">
          {children}
        </main>
      </div>
    </div>
  )
}
