import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { PlatformSettingsProvider } from "@/contexts/PlatformSettingsContext";
import { LandingSettingsProvider } from "@/contexts/LandingSettingsContext";
import DashboardLayout from "@/components/DashboardLayout";
import AdminLayout from "@/components/AdminLayout";
import LandingRoute from "./components/LandingRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Plans from "./pages/Plans";
import Dashboard from "./pages/Dashboard";
import UploadVideo from "./pages/UploadVideo";
import TodayDeliveries from "./pages/TodayDeliveries";
import MyVideos from "./pages/MyVideos";
import VideoCalendar from "./pages/VideoCalendar";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminVideos from "./pages/admin/AdminVideos";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminProduction from "./pages/admin/AdminProduction";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminRawVideos from "./pages/admin/AdminRawVideos";
import AdminChats from "./pages/admin/AdminChats";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminLandingPage from "./pages/admin/AdminLandingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <LanguageProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <PlatformSettingsProvider>
                <LandingSettingsProvider>
                  <Toaster />
                  <Sonner />
                  <Routes>
                    <Route element={<DashboardLayout />}>
                      <Route path="/" element={<LandingRoute />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/plans" element={<Plans />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/today" element={<TodayDeliveries />} />
                      <Route path="/my-videos" element={<MyVideos />} />
                      <Route path="/calendar" element={<VideoCalendar />} />
                      <Route element={<AdminLayout />}>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/production" element={<AdminProduction />} />
                        <Route path="/admin/team" element={<AdminTeam />} />
                        <Route path="/admin/users" element={<AdminUsers />} />
                        <Route path="/admin/plans" element={<AdminPlans />} />
                        <Route path="/admin/videos" element={<AdminVideos />} />
                        <Route path="/admin/raw-videos" element={<AdminRawVideos />} />
                        <Route path="/admin/chats" element={<AdminChats />} />
                        <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                        <Route path="/admin/landing" element={<AdminLandingPage />} />
                        <Route path="/admin/settings" element={<AdminSettings />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </LandingSettingsProvider>
              </PlatformSettingsProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
