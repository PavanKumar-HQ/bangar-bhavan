import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrinterProvider } from './context/PrinterContext';
import { SyncProvider } from './context/SyncContext';
import { Header } from './components/layout/Header';
import { Navbar } from './components/layout/Navbar';
import { Login } from './pages/Login';
import { Billing } from './pages/Billing';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { MenuManagement } from './pages/MenuManagement';
import { Settings } from './pages/Settings';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-cream-50 text-darkbrown-800 antialiased">
      <Header />
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <PrinterProvider>
        <SyncProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route element={<MainLayout />}>
                <Route path="/" element={<Billing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/history" element={<History />} />
                <Route path="/menu" element={<MenuManagement />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </Router>
        </SyncProvider>
      </PrinterProvider>
    </AuthProvider>
  );
};

export default App;
