import React from "react";
import { BrowserRouter as Router, Routes, Route, Link,Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import LoginPage from "./LoginPage";
import SignupPage from "./SignupPage";
import HomePage from "./pages/HomePage";
import RegisterForm from "./pages/RegisterForm";
import ProjectsPage from "./pages/ProjectsPage";
import MRVPage from "./pages/MRVPage";
import VerificationPage from "./pages/VerificationPage";
import ManageProjects from "./pages/ManageProjects";
import ReportPage from "./pages/ReportPage";
import CreditsPage from "./pages/CreditsPage";
import HistoryPage from "./pages/HistoryPage";
import MonitoringVerified from "./pages/MonitoringVerified";
import MonitoringPending from "./pages/MonitoringPending";
import MonitoringRejected from "./pages/MonitoringRejected";
import AIAnalysis from "./pages/AIAnalysis";
import Wallet from "./pages/Wallet";
import CarbonCredits from "./pages/CarbonCredits";
import DashboardStub from "./pages/DashboardStub";
import NotFound from "./pages/NotFound";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/home" element={<HomePage />} />
      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="/home" element={<HomePage />} />              {/* HomePage.jsx */}
      <Route path="/dashboard" element={<DashboardStub />} />   {/* DashboardStub.jsx */}
      <Route path="/register" element={<RegisterForm />} />     {/* RegisterForm.jsx */}
      <Route path="/projects" element={<ProjectsPage />} />     {/* ProjectsPage.jsx */}
      <Route path="/projects/manage" element={<ManageProjects />} />
      <Route path="/projects/report" element={<ReportPage />} />
      <Route path="/projects/credits" element={<CreditsPage />} />
      <Route path="/projects/history" element={<HistoryPage />} />

      <Route path="/mrv" element={<MRVPage />} />               {/* MRVPage.jsx */}
      <Route path="/verification" element={<VerificationPage />} /> {/* VerificationPage.jsx */}

      <Route path="/monitoring/verified" element={<MonitoringVerified />} />
      <Route path="/monitoring/pending" element={<MonitoringPending />} />
      <Route path="/monitoring/rejected" element={<MonitoringRejected />} />

      <Route path="/ai/analysis" element={<AIAnalysis />} />

      <Route path="/wallet" element={<Wallet />} />
      <Route path="/carbon-credits" element={<CarbonCredits />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
    </Router>
  );
}

export default App;