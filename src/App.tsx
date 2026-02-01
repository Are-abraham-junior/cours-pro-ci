import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Prestataires from "./pages/admin/Prestataires";
import Clients from "./pages/admin/Clients";
import Profile from "./pages/admin/Profile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Composant de redirection basé sur l'authentification
function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

// Composant pour rediriger les utilisateurs connectés
function AuthRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Route publique */}
            <Route path="/auth" element={<AuthRedirect />} />

            {/* Redirection de la page d'accueil */}
            <Route path="/" element={<HomeRedirect />} />

            {/* Routes protégées - Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées - Gestion utilisateurs (admin only) */}
            <Route
              path="/users"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées - Répétiteurs (admin only) */}
            <Route
              path="/prestataires"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                  <Prestataires />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées - Parents (admin only) */}
            <Route
              path="/clients"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                  <Clients />
                </ProtectedRoute>
              }
            />

            {/* Routes protégées - Profil */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
