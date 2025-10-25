import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { MainLayout } from "./components/layout/MainLayout";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { DemoLanguage } from "./pages/DemoLanguage";
import { Signup } from "./pages/Signup";
import { Home } from "./pages/Home";
import { HomeDemo } from "./pages/HomeDemo";
import { HomeDemoMovil } from "./pages/HomeDemoMovil";
import { BetsDemo } from "./pages/BetsDemo";
import { BetsDemoMovil } from "./pages/BetsDemoMovil";
import { BetHistoryDemo } from "./pages/BetHistoryDemo";
import { BetHistoryDemoMovil } from "./pages/BetHistoryDemoMovil";
import { ClasificacionDemo } from "./pages/ClasificacionDemo";
import { TestDemo } from "./pages/TestDemo";
import { Clasificacion } from "./pages/Clasificacion";
import Bets from "./pages/Bets";
import { BetHistory } from "./pages/BetHistory";
import LeagueMatchAvailabilityControl from "./pages/LeagueMatchAvailabilityControl";
import NotFound from "./pages/NotFound";
import AdminLiga from "./pages/AdminLiga";
import { AdminRoute } from "./components/AdminRoute";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminSelecciones from "./pages/SuperAdminSelecciones";
import SuperAdminCoparey from "./pages/SuperAdminCoparey";
import { SuperAdminRoute } from "./components/SuperAdminRoute";
import { ResetPassword } from "./pages/ResetPassword";
import { UpdatePassword } from "./pages/UpdatePassword";
import { LeagueSetup } from "./pages/LeagueSetup";
import { Settings } from "./pages/Settings";
import { SmartRedirect } from "./components/SmartRedirect";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/demo-language" element={<DemoLanguage />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/home-demo" element={<HomeDemo />} />
            <Route path="/home-demo-movil" element={<HomeDemoMovil />} />
            <Route path="/bets-demo" element={<BetsDemo />} />
            <Route path="/bets-demo-movil" element={<BetsDemoMovil />} />
            <Route path="/bet-history-demo" element={<BetHistoryDemo />} />
            <Route path="/bet-history-demo-movil" element={<BetHistoryDemoMovil />} />
            <Route path="/clasificacion-demo" element={<ClasificacionDemo />} />
            <Route path="/test-demo" element={<TestDemo />} />
            <Route path="/league-setup" element={
              <ProtectedRoute>
                <MainLayout>
                  <LeagueSetup />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/home" element={
              <ProtectedRoute>
                <SmartRedirect>
                  <MainLayout>
                    <Home />
                  </MainLayout>
                </SmartRedirect>
              </ProtectedRoute>
            } />
            <Route path="/clasificacion" element={
              <ProtectedRoute>
                <SmartRedirect>
                  <MainLayout>
                    <Clasificacion />
                  </MainLayout>
                </SmartRedirect>
              </ProtectedRoute>
            } />
            <Route path="/bets" element={
              <ProtectedRoute>
                <SmartRedirect>
                  <MainLayout>
                    <Bets />
                  </MainLayout>
                </SmartRedirect>
              </ProtectedRoute>
            } />
            <Route path="/bet-history" element={
              <ProtectedRoute>
                <SmartRedirect>
                  <MainLayout>
                    <BetHistory />
                  </MainLayout>
                </SmartRedirect>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <SmartRedirect>
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                </SmartRedirect>
              </ProtectedRoute>
            } />
            <Route path="/admin-liga" element={
              <AdminRoute>
                <SmartRedirect>
                  <MainLayout>
                    <AdminLiga />
                  </MainLayout>
                </SmartRedirect>
              </AdminRoute>
            } />
            <Route path="/league-match-availability" element={
              <AdminRoute>
                <SmartRedirect>
                  <MainLayout>
                    <LeagueMatchAvailabilityControl />
                  </MainLayout>
                </SmartRedirect>
              </AdminRoute>
            } />
            <Route path="/superadmin" element={
              <SuperAdminRoute>
                <SmartRedirect>
                  <MainLayout>
                    <SuperAdmin />
                  </MainLayout>
                </SmartRedirect>
              </SuperAdminRoute>
            } />
            <Route path="/superadmin-selecciones" element={
              <SuperAdminRoute>
                <SmartRedirect>
                  <MainLayout>
                    <SuperAdminSelecciones />
                  </MainLayout>
                </SmartRedirect>
              </SuperAdminRoute>
            } />
            <Route path="/superadmin-coparey" element={
              <SuperAdminRoute>
                <SmartRedirect>
                  <MainLayout>
                    <SuperAdminCoparey />
                  </MainLayout>
                </SmartRedirect>
              </SuperAdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
