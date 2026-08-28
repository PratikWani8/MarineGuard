import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./components/layout/AppShell";
import Home from "./pages/Home";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Technology from "./pages/Technology";
import Impact from "./pages/Impact";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Surveys from "./pages/Surveys";
import SurveyDetails from "./pages/SurveyDetails";
import SonarAnalysis from "./pages/SonarAnalysis";
import DetectionDetails from "./pages/DetectionDetails";
import MarineMap from "./pages/MarineMap";
import CleanupMission from "./pages/CleanupMission";
import Reports from "./pages/Reports";
import SSSUpload from "./pages/SSSUpload";

function Protected() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ocean-950 text-slate-400">
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      {/* =====================================================
          PUBLIC PAGES
      ====================================================== */}

      {/* Home */}
      <Route path="/" element={<Home />} />

      {/* About Us */}
      <Route path="/about" element={<About />} />

      {/* How It Works */}
      <Route
        path="/how-it-works"
        element={<HowItWorks />}
      />

      {/* Technology */}
      <Route
        path="/technology"
        element={<Technology />}
      />

      {/* Impact */}
      <Route
        path="/impact"
        element={<Impact />}
      />

      {/* Authentication */}
      <Route
        path="/register"
        element={<Register />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      {/* =====================================================
          PROTECTED APPLICATION
      ====================================================== */}

      <Route element={<Protected />}>
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/surveys"
          element={<Surveys />}
        />

        <Route
          path="/surveys/:surveyId"
          element={<SurveyDetails />}
        />

        <Route
          path="/analysis/:frameId"
          element={<SonarAnalysis />}
        />

        <Route
          path="/detections/:detectionId"
          element={<DetectionDetails />}
        />

        <Route
          path="/map"
          element={<MarineMap />}
        />

        <Route
          path="/missions"
          element={<CleanupMission />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/sss-upload"
          element={<SSSUpload />}
        />
      </Route>

      {/* =====================================================
          FALLBACK
      ====================================================== */}

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}