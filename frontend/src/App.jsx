import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import DashboardLayout from './layouts/DashboardLayout'
import DashboardHome from './pages/dashboard/DashboardHome'
import Inbox from './pages/dashboard/Inbox'
import AiAgent from './pages/dashboard/AiAgent'
import Contacts from './pages/dashboard/Contacts'
import Broadcast from './pages/dashboard/Broadcast'
import Templates from './pages/dashboard/Templates'
import Analytics from './pages/dashboard/Analytics'
import Wallet from './pages/dashboard/Wallet'
import DeveloperHub from './pages/dashboard/DeveloperHub'
import Settings from './pages/dashboard/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<DashboardHome />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="ai-agent" element={<AiAgent />} />
        <Route path="contacts" element={<Contacts />} />

        <Route path="templates" element={<Templates />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="wallet" element={<Wallet />} />
        <Route path="developer" element={<DeveloperHub />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
