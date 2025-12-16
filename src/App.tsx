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
import PoliticaCookies from "./pages/PoliticaCookies";
import TerminosCondiciones from "./pages/TerminosCondiciones";
import PoliticaPrivacidad from "./pages/PoliticaPrivacidad";
import AvisoLegal from "./pages/AvisoLegal";
import FAQ from "./pages/FAQ";
import Reglas from "./pages/Reglas";
import AdminLiga from "./pages/AdminLiga";
import { AdminRoute } from "./components/AdminRoute";
import SuperAdmin from "./pages/SuperAdmin";
import SuperAdminOtrasLigas from "./pages/SuperAdminOtrasLigas";
import { SuperAdminRoute } from "./components/SuperAdminRoute";
import { ResetPassword } from "./pages/ResetPassword";
import { UpdatePassword } from "./pages/UpdatePassword";
import { AuthCallback } from "./pages/AuthCallback";
import { LeagueSetup } from "./pages/LeagueSetup";
import { Settings } from "./pages/Settings";
import { SmartRedirect } from "./components/SmartRedirect";
import AnalyticsLoader from "./components/AnalyticsLoader";
import { Maintenance } from "./pages/Maintenance";
import { MaintenanceGuard } from "./components/MaintenanceGuard";
import { ScrollToTop } from "./components/ScrollToTop";
const queryClient = new QueryClient();

import { HelmetProvider } from 'react-helmet-async';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HelmetProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ScrollToTop />
          <AnalyticsLoader />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/login" element={<Login />} />
              <Route path="/demo-language" element={<DemoLanguage />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/home-demo" element={<HomeDemo />} />
              <Route path="/home-demo-movil" element={<HomeDemoMovil />} />
              <Route path="/bets-demo" element={<BetsDemo />} />
              <Route path="/bets-demo-movil" element={<BetsDemoMovil />} />
              <Route path="/bet-history-demo" element={<BetHistoryDemo />} />
              <Route path="/bet-history-demo-movil" element={<BetHistoryDemoMovil />} />
              <Route path="/clasificacion-demo" element={<ClasificacionDemo />} />
              <Route path="/test-demo" element={<TestDemo />} />
              <Route path="/politica-cookies" element={<PoliticaCookies />} />
              <Route path="/terminos" element={<TerminosCondiciones />} />
              <Route path="/politica-privacidad" element={<PoliticaPrivacidad />} />
              <Route path="/aviso-legal" element={<AvisoLegal />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/reglas" element={<Reglas />} />

              {/* Wrappers for Protected Routes with Maintenance Guard */}
              <Route path="/league-setup" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <MainLayout>
                      <LeagueSetup />
                    </MainLayout>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/home" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <Home />
                      </MainLayout>
                    </SmartRedirect>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/clasificacion" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <Clasificacion />
                      </MainLayout>
                    </SmartRedirect>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/bets" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <Bets />
                      </MainLayout>
                    </SmartRedirect>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/bet-history" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <BetHistory />
                      </MainLayout>
                    </SmartRedirect>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/settings" element={
                <MaintenanceGuard>
                  <ProtectedRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <Settings />
                      </MainLayout>
                    </SmartRedirect>
                  </ProtectedRoute>
                </MaintenanceGuard>
              } />
              <Route path="/admin-liga" element={
                <MaintenanceGuard>
                  <AdminRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <AdminLiga />
                      </MainLayout>
                    </SmartRedirect>
                  </AdminRoute>
                </MaintenanceGuard>
              } />
              <Route path="/league-match-availability" element={
                <MaintenanceGuard>
                  <AdminRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <LeagueMatchAvailabilityControl />
                      </MainLayout>
                    </SmartRedirect>
                  </AdminRoute>
                </MaintenanceGuard>
              } />

              {/* SuperAdmin routes don't strictly need MaintenanceGuard since it allows SuperAdmins, 
                  but wrapping them ensures consistent behavior if logic changes */}
              <Route path="/superadmin" element={
                <MaintenanceGuard>
                  <SuperAdminRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <SuperAdmin />
                      </MainLayout>
                    </SmartRedirect>
                  </SuperAdminRoute>
                </MaintenanceGuard>
              } />
              <Route path="/superadmin-otras-ligas" element={
                <MaintenanceGuard>
                  <SuperAdminRoute>
                    <SmartRedirect>
                      <MainLayout>
                        <SuperAdminOtrasLigas />
                      </MainLayout>
                    </SmartRedirect>
                  </SuperAdminRoute>
                </MaintenanceGuard>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </HelmetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
