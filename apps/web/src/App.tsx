import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LoopDetail } from './pages/LoopDetail'
import { NewLoop } from './pages/NewLoop'
import { Loops } from './pages/Loops'
import { Admin } from './pages/Admin'
import { Framework } from './pages/Framework'
import { InviteAccept } from './pages/InviteAccept'
import { Settings } from './pages/Settings'
import { Agents } from './pages/Agents'
import { AgentDetail } from './pages/AgentDetail'
import { RegistryDetail } from './pages/RegistryDetail'
import { Team } from './pages/Team'
import { Analytics } from './pages/Analytics'
import { AnalyticsResult } from './pages/AnalyticsResult'
import { Artifacts } from './pages/Artifacts'
import { OnboardingWizard } from './components/OnboardingWizard'
import { api, getToken } from './lib/api'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [showWizard, setShowWizard] = useState(false)
  const [checking, setChecking] = useState(true)
  const location = useLocation()

  useEffect(() => {
    if (!getToken()) { setChecking(false); return }
    // Check if user has completed onboarding
    api.me.get()
      .then(prof => {
        if (!prof.onboarded_at) setShowWizard(true)
      })
      .catch(() => {})
      .finally(() => setChecking(false))
  }, [location.pathname])

  if (checking) return null

  return (
    <>
      {children}
      {showWizard && <OnboardingWizard onComplete={() => setShowWizard(false)} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"                     element={<Login />} />
        <Route path="/invites/accept/:token"     element={<InviteAccept />} />

        {/* Authenticated */}
        <Route path="/dashboard"         element={<RequireAuth><AuthGate><Dashboard /></AuthGate></RequireAuth>} />
        <Route path="/loops"             element={<RequireAuth><Loops /></RequireAuth>} />
        <Route path="/loops/new"         element={<RequireAuth><NewLoop /></RequireAuth>} />
        <Route path="/loops/:id"         element={<RequireAuth><LoopDetail /></RequireAuth>} />
        <Route path="/artifacts"         element={<RequireAuth><Artifacts /></RequireAuth>} />
        <Route path="/agents"            element={<RequireAuth><Agents /></RequireAuth>} />
        <Route path="/agents/:id"        element={<RequireAuth><AgentDetail /></RequireAuth>} />
        <Route path="/registry/:agentKey" element={<RequireAuth><RegistryDetail /></RequireAuth>} />
        <Route path="/admin"             element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/admin/team"        element={<RequireAuth><Team /></RequireAuth>} />
        <Route path="/analytics"         element={<RequireAuth><Analytics /></RequireAuth>} />
        <Route path="/analytics/runs/:id" element={<RequireAuth><AnalyticsResult /></RequireAuth>} />
        <Route path="/framework"         element={<RequireAuth><Framework /></RequireAuth>} />
        <Route path="/settings"          element={<RequireAuth><Settings /></RequireAuth>} />
        {/* /settings/token → redirect a /settings (token visible en esa misma página) */}
        <Route path="/settings/token"    element={<Navigate to="/settings" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
