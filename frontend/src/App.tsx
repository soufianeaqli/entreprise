import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { RHLayout } from '@/components/layout/RHLayout';
import { CandidateLayout } from '@/components/layout/CandidateLayout';
import NotificationsPage from '@/pages/NotificationsPage';
import AIAssistantPage from '@/pages/ai/AIAssistantPage';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import RHDashboardPage from '@/pages/rh/RHDashboardPage';
import RHManagementPage from '@/pages/rh/RHManagementPage';
import RHDetailPage from '@/pages/rh/RHDetailPage';
import RHEmployeesPage from '@/pages/rh/RHEmployeesPage';
import RHEmployeeDetailPage from '@/pages/rh/RHEmployeeDetailPage';
import RHRecruitmentPage from '@/pages/rh/RHRecruitmentPage';
import RHRecruitmentShowPage from '@/pages/rh/RHRecruitmentShowPage';
import RHCalendarPage from '@/pages/rh/RHCalendarPage';
import RHMeetingsPage from '@/pages/rh/RHMeetingsPage';
import RHContractsPage from '@/pages/rh/RHContractsPage';
import RHProfilePage from '@/pages/rh/RHProfilePage';
import DepartmentsPage from '@/pages/departments/DepartmentsPage';
import DepartmentDetailPage from '@/pages/departments/DepartmentDetailPage';
import ContractsPage from '@/pages/contracts/ContractsPage';
import AnalyticsPage from '@/pages/analytics/AnalyticsPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import MeetingsPage from '@/pages/meetings/MeetingsPage';
import MeetingDetailPage from '@/pages/meetings/MeetingDetailPage';
import FinancePage from '@/pages/finance/FinancePage';
import FinanceDetailPage from '@/pages/finance/FinanceDetailPage';
import RecruitmentPage from '@/pages/recruitment/RecruitmentPage';
import RecruitmentDetailPage from '@/pages/recruitment/RecruitmentDetailPage';
import CandidateLoginPage from '@/pages/candidate/CandidateLoginPage';
import CandidateRegisterPage from '@/pages/candidate/CandidateRegisterPage';
import CandidateDashboardPage from '@/pages/candidate/CandidateDashboardPage';
import CandidateProfilePage from '@/pages/candidate/CandidateProfilePage';
import CandidateAnnouncementsPage from '@/pages/candidate/CandidateAnnouncementsPage';
import CandidateAnnouncementDetailPage from '@/pages/candidate/CandidateAnnouncementDetailPage';
import CandidateApplicationsPage from '@/pages/candidate/CandidateApplicationsPage';
import CandidateHistoryPage from '@/pages/candidate/CandidateHistoryPage';
import CandidateDocumentsPage from '@/pages/candidate/CandidateDocumentsPage';
import CandidateCVPage from '@/pages/candidate/CandidateCVPage';
import CandidateCalendarPage from '@/pages/candidate/CandidateCalendarPage';
import { RefreshCw } from 'lucide-react';

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    if (user.role === 'rh') return <Navigate to="/rh-dashboard" replace />;
    if (user.role === 'candidate') return <Navigate to="/candidate/dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'super_admin') return <Navigate to="/rh-dashboard" replace />;
  return <>{children}</>;
}

function RhRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'rh') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function CandidateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/candidate/login" replace />;
  if (user.role !== 'candidate') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />

      <Route path="/candidate/login" element={<GuestRoute><CandidateLoginPage /></GuestRoute>} />
      <Route path="/candidate/register" element={<GuestRoute><CandidateRegisterPage /></GuestRoute>} />

      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/rh" element={<RHManagementPage />} />
        <Route path="/rh/:id" element={<RHDetailPage />} />
        <Route path="/departments" element={<DepartmentsPage />} />
        <Route path="/departments/:id" element={<DepartmentDetailPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/meetings" element={<MeetingsPage />} />
        <Route path="/meetings/:id" element={<MeetingDetailPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/finance/:id" element={<FinanceDetailPage />} />
        <Route path="/recruitments" element={<RecruitmentPage />} />
        <Route path="/recruitments/:id" element={<RecruitmentDetailPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<RhRoute><RHLayout /></RhRoute>}>
        <Route path="/rh-dashboard" element={<RHDashboardPage />} />
        <Route path="/rh/calendar" element={<RHCalendarPage />} />
        <Route path="/rh/employees" element={<RHEmployeesPage />} />
        <Route path="/rh/employees/:id" element={<RHEmployeeDetailPage />} />
        <Route path="/rh/recruitment" element={<RHRecruitmentPage />} />
        <Route path="/rh/recruitment/:id" element={<RHRecruitmentShowPage />} />
        <Route path="/rh/meetings" element={<RHMeetingsPage />} />
        <Route path="/rh/contracts" element={<RHContractsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/rh/profile" element={<RHProfilePage />} />
      </Route>

      <Route element={<CandidateRoute><CandidateLayout /></CandidateRoute>}>
        <Route path="/candidate/dashboard" element={<CandidateDashboardPage />} />
        <Route path="/candidate/profile" element={<CandidateProfilePage />} />
        <Route path="/candidate/announcements" element={<CandidateAnnouncementsPage />} />
        <Route path="/candidate/announcements/:id" element={<CandidateAnnouncementDetailPage />} />
        <Route path="/candidate/applications" element={<CandidateApplicationsPage />} />
        <Route path="/candidate/calendar" element={<CandidateCalendarPage />} />
        <Route path="/candidate/history" element={<CandidateHistoryPage />} />
        <Route path="/candidate/documents" element={<CandidateDocumentsPage />} />
        <Route path="/candidate/cv" element={<CandidateCVPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
