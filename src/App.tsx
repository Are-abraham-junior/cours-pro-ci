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
import AdminDashboard from "./pages/admin/Dashboard";
import Users from "./pages/admin/Users";
import Prestataires from "./pages/admin/Prestataires";
import Clients from "./pages/admin/Clients";
import Profile from "./pages/admin/Profile";
import AdminOffres from "./pages/admin/AdminOffres";
import NotFound from "./pages/NotFound";

// Parent pages
import ParentDashboard from "./pages/parent/Dashboard";
import MesOffres from "./pages/parent/MesOffres";
import NouvelleOffre from "./pages/parent/NouvelleOffre";
import OffreDetailsParent from "./pages/parent/OffreDetails";
import MesContratsParent from "./pages/parent/MesContrats";

// Répétiteur pages
import RepetiteurDashboard from "./pages/repetiteur/Dashboard";
import RepetiteurProfile from "./pages/repetiteur/Profile";
import OffresDisponibles from "./pages/repetiteur/OffresDisponibles";
import OffreDetailsRepetiteur from "./pages/repetiteur/OffreDetails";
import MesCandidatures from "./pages/repetiteur/MesCandidatures";
import MesContratsRepetiteur from "./pages/repetiteur/MesContrats";

const queryClient = new QueryClient();

// Composant de redirection basé sur l'authentification et le rôle
function HomeRedirect() {
  const { user, loading, roles } = useAuth();

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

  // Redirect based on role
  if (roles.includes('super_admin') || roles.includes('admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (roles.includes('client')) {
    return <Navigate to="/parent/dashboard" replace />;
  } else if (roles.includes('prestataire')) {
    return <Navigate to="/repetiteur/dashboard" replace />;
  }

  return <Navigate to="/auth" replace />;
}

// Composant pour rediriger les utilisateurs connectés
function AuthRedirect() {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // Redirect based on role
    if (roles.includes('super_admin') || roles.includes('admin')) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (roles.includes('client')) {
      return <Navigate to="/parent/dashboard" replace />;
    } else if (roles.includes('prestataire')) {
      return <Navigate to="/repetiteur/dashboard" replace />;
    }
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

            {/* Routes Admin - Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            {/* Redirect old /dashboard to role-based dashboard */}
            <Route path="/dashboard" element={<HomeRedirect />} />

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

            {/* Routes protégées - Toutes les offres (admin only) */}
            <Route
              path="/admin/offres"
              element={
                <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
                  <AdminOffres />
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

            {/* Routes Parent */}
            <Route
              path="/parent/dashboard"
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <ParentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-offres"
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <MesOffres />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-offres/nouvelle"
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <NouvelleOffre />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-offres/:id"
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <OffreDetailsParent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-contrats"
              element={
                <ProtectedRoute requiredRoles={['client']}>
                  <MesContratsParent />
                </ProtectedRoute>
              }
            />

            {/* Routes Répétiteur */}
            <Route
              path="/repetiteur/dashboard"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <RepetiteurDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offres"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <OffresDisponibles />
                </ProtectedRoute>
              }
            />
            <Route
              path="/offres/:id"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <OffreDetailsRepetiteur />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mes-candidatures"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <MesCandidatures />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repetiteur/profil"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <RepetiteurProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/repetiteur/contrats"
              element={
                <ProtectedRoute requiredRoles={['prestataire']}>
                  <MesContratsRepetiteur />
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
