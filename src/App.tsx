import { Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { AppLayout } from './components/layout/AppLayout'
import { CollaborationsPage } from './pages/CollaborationsPage'
import { DiscoverPage } from './pages/DiscoverPage'
import { LoginPage } from './pages/LoginPage'
import { MusicianProfilePage } from './pages/MusicianProfilePage'
import { OnboardingProfilePage } from './pages/OnboardingProfilePage'
import { ProfilePage } from './pages/ProfilePage'
import { SignupPage } from './pages/SignupPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route path="/onboarding/perfil" element={<OnboardingProfilePage />} />
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/descobrir" replace />} />
          <Route path="/descobrir" element={<DiscoverPage />} />
          <Route path="/musicos/:userId" element={<MusicianProfilePage />} />
          <Route path="/procurar" element={<Navigate to="/descobrir" replace />} />
          <Route path="/colaboracoes" element={<CollaborationsPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
