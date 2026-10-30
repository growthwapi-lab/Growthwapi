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
import AdminDashboard from './pages/dashboard/AdminDashboard'
import AffiliateProgram from './pages/dashboard/AffiliateProgram'
import AffiliateLanding from './pages/AffiliateLanding'
import TeamMembers from './pages/dashboard/TeamMembers'
import SetupGuide from './pages/dashboard/SetupGuide'
import GettingStarted from './pages/dashboard/GettingStarted'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/partner" element={<AffiliateLanding />} />
      <Route path="/earn" element={<AffiliateLanding />} />
      <Route path="/affiliate-program" element={<AffiliateLanding />} />
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
        <Route path="affiliate" element={<AffiliateProgram />} />
        <Route path="team" element={<TeamMembers />} />
        <Route path="setup-guide" element={<SetupGuide />} />
        <Route path="overview" element={<GettingStarted />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<AdminDashboard />} />
      </Route>
    </Routes>
  )
}

export default App
