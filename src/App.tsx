import { useState } from 'react';
import Starfield from './components/Starfield';
import TopNav from './components/TopNav';
import SideNav from './components/SideNav';
import ChatView from './components/ChatView';
import DashboardView from './components/DashboardView';
import AuditSandboxView from './components/AuditSandboxView';
import GovernanceReportPage from './components/GovernanceReportPage';
import LoginView from './components/LoginView';
import JupiterLoader from './components/JupiterLoader';
import { useAuth } from './hooks/useAuth';
import { useCustomerDiscovery } from './hooks/useCustomerDiscovery';
import type { AppView } from './types/views';

export default function App() {
  const { user, isAuthenticated, checking, error, setError, login, register, logout } = useAuth();
  const { discoveryComplete, sessionId, refresh: refreshDiscovery } = useCustomerDiscovery(
    user?.customer_id,
  );
  const [view, setView] = useState<AppView>('dashboard');
  const [loginLoading, setLoginLoading] = useState(false);

  const openAuditing = () => setView('auditing');
  const openAudit = () => setView('audit_report');

  async function handleLogin(email: string, password: string) {
    setLoginLoading(true);
    setError(null);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Authentication failed');
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegister(email: string, password: string, name?: string, company?: string) {
    setLoginLoading(true);
    setError(null);
    try {
      await register(email, password, name, company);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed');
    } finally {
      setLoginLoading(false);
    }
  }

  function renderMain() {
    switch (view) {
      case 'dashboard':
        return <DashboardView onOpenAuditing={openAuditing} />;
      case 'auditing':
        return (
          <ChatView
            onOpenAudit={openAudit}
            onDiscoveryComplete={() => void refreshDiscovery()}
          />
        );
      case 'audit_report':
        return (
          <AuditSandboxView
            sessionId={sessionId}
            onBackToChat={() => setView('auditing')}
          />
        );
      case 'sys_config':
        return <GovernanceReportPage sessionId={sessionId} />;
    }
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col font-code-snippet text-on-surface selection:bg-primary-container/30">
      <Starfield />

      {checking ? (
        <JupiterLoader fullscreen text="Verifying session…" />
      ) : !isAuthenticated ? (
        <LoginView
          onLogin={handleLogin}
          onRegister={handleRegister}
          error={error}
          loading={loginLoading}
        />
      ) : (
        <>
          <TopNav user={user} onLogout={logout} />
          <SideNav active={view} onNavigate={setView} discoveryComplete={discoveryComplete} />

          <div className="flex flex-1 overflow-hidden relative z-10" style={{ paddingTop: '46px' }}>
            <main className="flex-1 md:ml-64 relative flex flex-col overflow-hidden min-h-0">
              {renderMain()}
            </main>
          </div>
        </>
      )}
    </div>
  );
}
