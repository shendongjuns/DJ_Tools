import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { InitialPasswordPage } from '../pages/InitialPasswordPage';
import { LoginPage } from '../pages/LoginPage';
import { NoteDetailPage } from '../pages/NoteDetailPage';
import { NotesPage } from '../pages/NotesPage';
import { SharedNotePage } from '../pages/SharedNotePage';
import { TodoPage } from '../pages/TodoPage';
import { useAuth } from '../store/AuthContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { token, loading, profile } = useAuth();

  if (loading) {
    return null;
  }
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (profile?.forcePasswordChange && location.pathname !== '/initial-password') {
    return <Navigate to="/initial-password" replace />;
  }
  return <>{children}</>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share/notes/:token" element={<SharedNotePage />} />
      <Route
        path="/initial-password"
        element={
          <ProtectedRoute>
            <InitialPasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="todos" element={<TodoPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/:id" element={<NoteDetailPage />} />
      </Route>
    </Routes>
  );
}

