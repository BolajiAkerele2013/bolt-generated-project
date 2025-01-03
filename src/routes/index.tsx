import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { SignupPage } from '../pages/auth/SignupPage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { CreateIdeaPage } from '../pages/ideas/CreateIdeaPage';
import { EditIdeaPage } from '../pages/ideas/EditIdeaPage';
import { ViewIdeaPage } from '../pages/ideas/ViewIdeaPage';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export const AppRoutes = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <LoginPage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/signup" 
        element={!isAuthenticated ? <SignupPage /> : <Navigate to="/" />} 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ideas/new" 
        element={
          <ProtectedRoute>
            <CreateIdeaPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ideas/:id/edit" 
        element={
          <ProtectedRoute>
            <EditIdeaPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/ideas/:id" 
        element={
          <ProtectedRoute>
            <ViewIdeaPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};
