import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/auth/Login';
import AdminLogin from './components/admin/AdminLogin';
import Dashboard from './components/dashboard/Dashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Import Font Awesome configuration
import './lib/fontawesome';

function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="App">
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/admin-login" 
          element={!user ? <AdminLogin /> : user.is_admin ? <Navigate to="/admin" replace /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/dashboard/*" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/admin/*" 
          element={user && user.is_admin ? <AdminDashboard /> : <Navigate to="/admin-login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? (user.is_admin ? "/admin" : "/dashboard") : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
}

export default App;