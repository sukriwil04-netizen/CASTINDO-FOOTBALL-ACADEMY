import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { DataProvider } from './context/DataContext.tsx';
import { Sidebar, NavTab } from './components/navigation/Sidebar.tsx';
import { Header } from './components/navigation/Header.tsx';
import { LandingPageView } from './views/public/LandingPageView.tsx';
import { LoginView } from './views/public/LoginView.tsx';
import { ParentRegistrationView } from './views/public/ParentRegistrationView.tsx';
import { TermsPrivacyModal } from './views/public/TermsPrivacyModal.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { PlayersView } from './views/PlayersView.tsx';
import { AttendanceView } from './views/AttendanceView.tsx';
import { TrainingLoadView } from './views/TrainingLoadView.tsx';
import { SessionsView } from './views/SessionsView.tsx';
import { EvaluationsView } from './views/EvaluationsView.tsx';
import { MotorTestsView } from './views/MotorTestsView.tsx';
import { LtadGoalsView } from './views/LtadGoalsView.tsx';
import { PromotionReviewView } from './views/PromotionReviewView.tsx';
import { ReportsView } from './views/ReportsView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import { PlayerVerificationView } from './views/PlayerVerificationView.tsx';
import { PlayerRegistrationView } from './views/PlayerRegistrationView.tsx';
import { ParentDashboardView } from './views/parent/ParentDashboardView.tsx';
import { ParentManagementView } from './views/parent/ParentManagementView.tsx';
import { PlayerFormModal } from './components/players/PlayerFormModal.tsx';
import { SessionFormModal } from './components/sessions/SessionFormModal.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.tsx';

function MainLayout() {
  const { currentUser, isParent, isAdmin } = useAuth();

  // Public views state: 'landing' | 'login' | 'register'
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'register'>('landing');
  const [loginRoleHint, setLoginRoleHint] = useState<'parent' | 'coach' | 'admin'>('parent');
  const [isPrivacyTermsOpen, setIsPrivacyTermsOpen] = useState(false);

  // Authenticated tab state
  const [currentTab, setCurrentTab] = useState<NavTab>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('mode');
      if (tabParam === 'registration' || tabParam === 'register') return 'registration';
      if (tabParam === 'verification') return 'verification';
    }
    if (currentUser?.role === 'parent') {
      return 'parent-dashboard';
    }
    return 'dashboard';
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Cross-navigation states
  const [attendanceSessionId, setAttendanceSessionId] = useState<string | null>(null);
  const [trainingLoadSessionId, setTrainingLoadSessionId] = useState<string | null>(null);
  const [selectedPlayerIdForDetail, setSelectedPlayerIdForDetail] = useState<string | null>(null);

  // Quick action modals
  const [isQuickPlayerOpen, setIsQuickPlayerOpen] = useState(false);
  const [isQuickSessionOpen, setIsQuickSessionOpen] = useState(false);

  // Role-based protection: if parent attempts to access coach/admin tabs, reset to parent-dashboard
  useEffect(() => {
    if (isParent) {
      const allowedParentTabs: NavTab[] = ['parent-dashboard', 'settings'];
      if (!allowedParentTabs.includes(currentTab)) {
        setCurrentTab('parent-dashboard');
      }
    }
  }, [isParent, currentTab]);

  // When user logs in, set appropriate default tab
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'parent') {
        setCurrentTab('parent-dashboard');
      } else if (currentTab === 'parent-dashboard') {
        setCurrentTab('dashboard');
      }
    }
  }, [currentUser]);

  // ==========================================
  // 1. PUBLIC VISITOR INTERFACE (NO AUTHENTICATION)
  // ==========================================
  if (!currentUser) {
    if (publicView === 'login') {
      return (
        <>
          <LoginView
            initialRole={loginRoleHint}
            onBackToHome={() => setPublicView('landing')}
            onGoToRegister={() => setPublicView('register')}
            onLoginSuccess={() => {
              // Handled automatically via AuthContext currentUser state change
            }}
          />
          <TermsPrivacyModal
            isOpen={isPrivacyTermsOpen}
            onClose={() => setIsPrivacyTermsOpen(false)}
          />
        </>
      );
    }

    if (publicView === 'register') {
      return (
        <>
          <ParentRegistrationView
            onBackToHome={() => setPublicView('landing')}
            onGoToLogin={() => {
              setLoginRoleHint('parent');
              setPublicView('login');
            }}
            onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
            onRegistrationComplete={() => {
              // User is created and logged in automatically in AuthContext
            }}
          />
          <TermsPrivacyModal
            isOpen={isPrivacyTermsOpen}
            onClose={() => setIsPrivacyTermsOpen(false)}
          />
        </>
      );
    }

    // Default: Public Landing Page (Requirement 1)
    return (
      <>
        <LandingPageView
          onGoToLogin={(roleHint) => {
            setLoginRoleHint(roleHint || 'parent');
            setPublicView('login');
          }}
          onGoToRegister={() => setPublicView('register')}
          onOpenPrivacyTerms={() => setIsPrivacyTermsOpen(true)}
        />
        <TermsPrivacyModal
          isOpen={isPrivacyTermsOpen}
          onClose={() => setIsPrivacyTermsOpen(false)}
        />
      </>
    );
  }

  // ==========================================
  // 2. AUTHENTICATED APPLICATION INTERFACE
  // ==========================================

  const handleNavigateToAttendance = (sessionId: string) => {
    setAttendanceSessionId(sessionId);
    setCurrentTab('attendance');
  };

  const handleNavigateToTrainingLoad = (sessionId: string) => {
    setTrainingLoadSessionId(sessionId);
    setCurrentTab('training-load');
  };

  const handleOpenPlayerDetail = (playerId: string) => {
    setSelectedPlayerIdForDetail(playerId);
    setCurrentTab('players');
  };

  const handleQuickAction = (action: 'add_player' | 'add_session' | 'quick_attendance') => {
    if (action === 'add_player') {
      setIsQuickPlayerOpen(true);
    } else if (action === 'add_session') {
      setIsQuickSessionOpen(true);
    } else if (action === 'quick_attendance') {
      setCurrentTab('attendance');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'players') setSelectedPlayerIdForDetail(null);
        }}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          currentTab={currentTab}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onQuickAction={handleQuickAction}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ErrorBoundary isInline fallbackTitle="Terjadi kendala saat memuat menu ini">
            {/* PARENT DASHBOARD ROUTE */}
            {(currentTab === 'parent-dashboard' || (isParent && currentTab === 'dashboard')) && (
              <ParentDashboardView />
            )}

            {/* COACH & ADMIN ROUTES */}
            {currentTab === 'dashboard' && !isParent && (
              <DashboardView
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenPlayerDetail={handleOpenPlayerDetail}
              />
            )}

            {currentTab === 'parent-management' && isAdmin && (
              <ParentManagementView />
            )}

            {currentTab === 'players' && !isParent && (
              <PlayersView
                initialSelectedPlayerId={selectedPlayerIdForDetail}
                onNavigateToVerification={() => setCurrentTab('verification')}
              />
            )}

            {currentTab === 'verification' && isAdmin && (
              <PlayerVerificationView onOpenRegistrationForm={() => setCurrentTab('registration')} />
            )}

            {currentTab === 'registration' && !isParent && (
              <PlayerRegistrationView
                onBackToApp={() =>
                  setCurrentTab('dashboard')
                }
              />
            )}

            {currentTab === 'attendance' && !isParent && (
              <AttendanceView initialSessionId={attendanceSessionId} />
            )}

            {currentTab === 'training-load' && !isParent && (
              <TrainingLoadView initialSessionId={trainingLoadSessionId} />
            )}

            {currentTab === 'sessions' && !isParent && (
              <SessionsView
                onNavigateToAttendance={handleNavigateToAttendance}
                onNavigateToTrainingLoad={handleNavigateToTrainingLoad}
              />
            )}

            {currentTab === 'evaluations' && !isParent && <EvaluationsView />}

            {currentTab === 'motor-tests' && !isParent && <MotorTestsView />}

            {currentTab === 'ltad' && !isParent && <LtadGoalsView />}

            {currentTab === 'promotion' && !isParent && <PromotionReviewView />}

            {currentTab === 'reports' && !isParent && <ReportsView />}

            {currentTab === 'settings' && <SettingsView />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Quick Modals */}
      {!isParent && (
        <>
          <PlayerFormModal
            isOpen={isQuickPlayerOpen}
            onClose={() => setIsQuickPlayerOpen(false)}
            onSaved={() => setCurrentTab('players')}
          />

          <SessionFormModal
            isOpen={isQuickSessionOpen}
            onClose={() => setIsQuickSessionOpen(false)}
            onSaved={() => setCurrentTab('sessions')}
          />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="Terjadi kendala pada tampilan aplikasi">
      <AuthProvider>
        <DataProvider>
          <MainLayout />
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
