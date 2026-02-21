import React from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginScreen from './screens/LoginScreen';
import ParentDashboard from './screens/ParentDashboard';
import ChildDashboard from './screens/ChildDashboard';

function AppRouter() {
  const { loading } = useApp();
  const { isLoggedIn, isParent, isChild } = useAuth();

  if (loading) {
    return (
      <div className="app-container flex flex-col items-center justify-center" style={{ minHeight: '100dvh' }}>
        <div className="app-logo-icon animate-pulse" style={{ width: '80px', height: '80px', fontSize: '2.5rem' }}>
          🎮
        </div>
        <p className="text-muted" style={{ marginTop: 'var(--space-md)' }}>Ładowanie...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  if (isParent) {
    return <ParentDashboard />;
  }

  if (isChild) {
    return <ChildDashboard />;
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppProvider>
  );
}
