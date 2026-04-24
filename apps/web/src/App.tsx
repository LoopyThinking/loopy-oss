import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LoopDetail } from './pages/LoopDetail'
import { NewLoop } from './pages/NewLoop'
import { Admin } from './pages/Admin'
import { Framework } from './pages/Framework'
import { InviteAccept } from './pages/InviteAccept'
import { Settings } from './pages/Settings'
import { Agents } from './pages/Agents'
import { getToken } from './lib/api'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"                     element={<Login />} />
        <Route path="/invites/accept/:token"     element={<InviteAccept />} />

        {/* Authenticated */}
        <Route path="/dashboard"   element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/loops/new"   element={<RequireAuth><NewLoop /></RequireAuth>} />
        <Route path="/loops/:id"   element={<RequireAuth><LoopDetail /></RequireAuth>} />
        <Route path="/agents"      element={<RequireAuth><Agents /></RequireAuth>} />
        <Route path="/admin"       element={<RequireAuth><Admin /></RequireAuth>} />
        <Route path="/framework"   element={<RequireAuth><Framework /></RequireAuth>} />
        <Route path="/settings"    element={<RequireAuth><Settings /></RequireAuth>} />
        {/* /settings/token → redirect a /settings (token visible en esa misma página) */}
        <Route path="/settings/token" element={<Navigate to="/settings" replace />} />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
