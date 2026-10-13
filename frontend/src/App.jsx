import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import TicketsPage from './pages/tickets/TicketsPage';
import CustomersPage from './pages/customers/CustomersPage';
import DevicesPage from './pages/devices/DevicesPage';
import TechniciansPage from './pages/technicians/TechniciansPage';
import InventoryPage from './pages/inventory/InventoryPage';
import BillingPage from './pages/billing/BillingPage';
import ReportsPage from './pages/reports/ReportsPage';
import UsersPage from './pages/users/UsersPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#FFFFFF',
              color: '#1E293B',
              fontSize: '13px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              borderRadius: '10px',
              padding: '10px 16px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Main Application Layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route
              path="customers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <CustomersPage />
                </ProtectedRoute>
              }
            />
            <Route path="devices" element={<DevicesPage />} />
            <Route
              path="technicians"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <TechniciansPage />
                </ProtectedRoute>
              }
            />
            <Route path="inventory" element={<InventoryPage />} />
            <Route
              path="billing"
              element={
                <ProtectedRoute allowedRoles={['admin', 'receptionist']}>
                  <BillingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
