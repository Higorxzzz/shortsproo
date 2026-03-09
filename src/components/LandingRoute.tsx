import { useLandingSettings } from "@/contexts/LandingSettingsContext";
import { Navigate } from "react-router-dom";
import Landing from "@/pages/Landing";

const LandingRoute = () => {
  const { landingEnabled, loading } = useLandingSettings();

  if (loading) return null;
  if (!landingEnabled) return <Navigate to="/login" replace />;
  return <Landing />;
};

export default LandingRoute;
