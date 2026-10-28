import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Layout Components
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import JudgeAcceptInvite from './pages/auth/JudgeAcceptInvite';
import ChangePassword from './pages/auth/ChangePassword';

// Common / Universal Pages
import LandingPage from './pages/common/LandingPage';
import RightsCard from './pages/common/RightsCard';
import LegalAidDirectory from './pages/common/LegalAidDirectory';
import QuickCheck from './pages/common/QuickCheck';
import HelpPage from './pages/common/HelpPage';
import NotificationsPage from './pages/common/NotificationsPage';
import Profile from './pages/common/Profile';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import CaseWizard from './pages/citizen/CaseWizard';
import CaseDetail from './pages/citizen/CaseDetail';
import CitizenCalendar from './pages/citizen/CitizenCalendar';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import OffenceRules from './pages/admin/OffenceRules';
import ApplicationReview from './pages/admin/ApplicationReview';
import LegalAidAdmin from './pages/admin/LegalAidAdmin';
import AdminLegalAidRequests from './pages/admin/AdminLegalAidRequests';
import AdminDeadlines from './pages/admin/AdminDeadlines';
import AdminSureties from './pages/admin/AdminSureties';
import AdminHearings from './pages/admin/AdminHearings';
import AdminDelegations from './pages/admin/AdminDelegations';
import AdminCompliance from './pages/admin/AdminCompliance';
import AdminRadar from './pages/admin/AdminRadar';
import EmailLogs from './pages/admin/EmailLogs';
import AuditTrail from './pages/admin/AuditTrail';

// Judge Pages
import JudgeQueue from './pages/judge/JudgeQueue';
import JudgeCaseReview from './pages/judge/JudgeCaseReview';
import JudgeCalendar from './pages/judge/JudgeCalendar';
import JudgeRadar from './pages/judge/JudgeRadar';
import JudgeQuickCheck from './pages/judge/JudgeQuickCheck';

import { ROLES } from './config/constants';

// Internal App Layout
const AppLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Navbar />
      <div className="flex flex-1">
        {user && <Sidebar />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full ${!user ? 'py-8' : ''}`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export const App = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify-otp" element={<VerifyOtp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/judge-invite" element={<JudgeAcceptInvite />} />
              <Route path="/rights" element={<RightsCard />} />
              <Route path="/legal-aid" element={<LegalAidDirectory />} />
              <Route path="/quick-check" element={<QuickCheck />} />
              <Route path="/help" element={<HelpPage />} />

              {/* Shared Authenticated Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePassword />
                  </ProtectedRoute>
                }
              />

              {/* Citizen Portal Routes */}
              <Route
                path="/citizen/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/cases/new"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                    <CaseWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/cases/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                    <CaseDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/calendar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                    <CitizenCalendar />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal Routes */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/deadlines"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDeadlines />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <ApplicationReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/sureties"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminSureties />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/hearings"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminHearings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/delegations"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminDelegations />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/compliance"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminCompliance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/radar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminRadar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/legal-aid-requests"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AdminLegalAidRequests />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/legal-aid"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <LegalAidAdmin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/offences"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <OffenceRules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/email-logs"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <EmailLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit-trail"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                    <AuditTrail />
                  </ProtectedRoute>
                }
              />

              {/* Judge Portal Routes */}
              <Route
                path="/judge/queue"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
                    <JudgeQueue />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/cases/:id"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
                    <JudgeCaseReview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/calendar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
                    <JudgeCalendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/radar"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
                    <JudgeRadar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/judge/quick-check"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.JUDGE]}>
                    <JudgeQuickCheck />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AppLayout>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
