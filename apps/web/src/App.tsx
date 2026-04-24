import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { LoopDetail } from './pages/LoopDetail'
import { NewLoop } from './pages/NewLoop'
import { Admin } from './pages/Admin'
import { Framework } from './pages/Framework'
import { getToken } from './lib/api'

function RequireAuth({ children }: { children: React.ReactNode }) {
  return getToken() ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={<RequireAuth><Dashboard /></RequireAuth>}
        />
        <Route
          path="/loops/new"
          element={<RequireAuth><NewLoop /></RequireAuth>}
        />
        <Route
          path="/loops/:id"
          element={<RequireAuth><LoopDetail /></RequireAuth>}
        />
        {/* v0.2.1 — multi-org + panel ejecutivo + framework */}
        <Route
          path="/admin"
          element={<RequireAuth><Admin /></RequireAuth>}
        />
        <Route
          path="/framework"
          element={<RequireAuth><Framework /></RequireAuth>}
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
