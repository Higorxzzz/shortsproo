import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Plans from "./pages/Plans";
import Dashboard from "./pages/Dashboard";
import MyVideos from "./pages/MyVideos";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProduction from "./pages/admin/AdminProduction";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminRawVideos from "./pages/admin/AdminRawVideos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <Routes>
                {/* Public routes with top navbar */}
                <Route
                  path="/"
                  element={
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1"><Landing /></main>
                      <Footer />
                    </div>
                  }
                />
                <Route
                  path="/login"
                  element={
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1"><Login /></main>
                    </div>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1"><Register /></main>
                    </div>
                  }
                />
                <Route
                  path="/plans"
                  element={
                    <div className="flex min-h-screen flex-col">
                      <Navbar />
                      <main className="flex-1"><Plans /></main>
                      <Footer />
                    </div>
                  }
                />

                {/* Authenticated routes with sidebar */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/my-videos" element={<MyVideos />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/admin/production" element={<AdminProduction />} />
                  <Route path="/admin/team" element={<AdminTeam />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/plans" element={<AdminPlans />} />
                  <Route path="/admin/videos" element={<AdminVideos />} />
                  <Route path="/admin/raw-videos" element={<AdminRawVideos />} />
                  <Route path="/admin/settings" element={<AdminSettings />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
