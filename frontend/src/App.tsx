import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TravelerLandingPage from './app/page';
import ListingDetail from './routes/public/ListingDetail';
import PolStoryPage from './routes/public/PolStoryPage';
import PolAreaPage from './routes/public/PolAreaPage';
import ExperiencesPage from './routes/public/ExperiencesPage';
import HeritageMapPage from './routes/public/HeritageMapPage';
import LoginPage from './routes/public/LoginPage';
import HostDashboard from './routes/authenticated/HostDashboard';
import GuestDashboard from './routes/authenticated/GuestDashboard';
import Messages from './routes/authenticated/Messages';
import VerificationsPanel from './routes/admin/VerificationsPanel';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<TravelerLandingPage />} />
      <Route path="/search" element={<TravelerLandingPage />} />
      <Route path="/listings/:id" element={<ListingDetail />} />
      <Route path="/pols" element={<PolAreaPage />} />
      <Route path="/experiences" element={<ExperiencesPage />} />
      <Route path="/map" element={<HeritageMapPage />} />
      <Route path="/pol/:polSlug" element={<PolStoryPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Requirement 4: Role-Based Protected Routes */}
      
      {/* Traveler Routes */}
      <Route
        path="/traveler/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TRAVELER', 'HOST', 'ADMIN']}>
            <GuestDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guest/dashboard"
        element={
          <ProtectedRoute allowedRoles={['TRAVELER', 'HOST', 'ADMIN']}>
            <GuestDashboard />
          </ProtectedRoute>
        }
      />

      {/* Host Routes */}
      <Route
        path="/host/dashboard"
        element={
          <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
            <HostDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/verify-identity"
        element={
          <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
            <HostDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/host/new-listing"
        element={
          <ProtectedRoute allowedRoles={['HOST', 'ADMIN']}>
            <HostDashboard />
          </ProtectedRoute>
        }
      />

      {/* Messages */}
      <Route
        path="/messages"
        element={
          <ProtectedRoute allowedRoles={['TRAVELER', 'HOST', 'ADMIN']}>
            <Messages />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <VerificationsPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <VerificationsPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <VerificationsPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
