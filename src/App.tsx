import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import OrganizerPage from "./pages/OrganizerPage";
import ChannelPage from "./pages/ChannelPage";
import DemoPage from "./pages/DemoPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import OrganizerLoginPage from "./pages/OrganizerLoginPage";
import OrganizerRegistrationStubPage from "./pages/OrganizerRegistrationStubPage";
import OrganizerEventCompliancePage from "./pages/OrganizerEventCompliancePage";
import MainPage from "./pages/MainPage";
import ProtoPage from "./pages/ProtoPage";
import { useStorageSync } from "./hooks/useStorageSync";
import RouteTitleManager from "./components/RouteTitleManager";

const queryClient = new QueryClient();

function OrganizerRouteGuard() {
  const { state } = useStorageSync();
  if (!state.currentOrganizerId) {
    return <Navigate to="/organizer/login" replace />;
  }
  return <OrganizerPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <HashRouter>
        <RouteTitleManager />
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/organizer" element={<OrganizerRouteGuard />} />
          <Route path="/organizer/login" element={<OrganizerLoginPage />} />
          <Route path="/organizer/register" element={<OrganizerRegistrationStubPage />} />
          <Route path="/organizer/compliance" element={<OrganizerEventCompliancePage />} />
          <Route path="/channel" element={<ChannelPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/proto" element={<ProtoPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
