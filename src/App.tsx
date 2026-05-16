import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { CollaborationsPage } from './pages/CollaborationsPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/descobrir" replace />} />
          <Route path="/descobrir" element={<DiscoverPage />} />
          <Route path="/procurar" element={<Navigate to="/descobrir" replace />} />
          <Route path="/colaboracoes" element={<CollaborationsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
