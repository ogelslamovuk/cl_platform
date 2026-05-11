import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import OrganizerPage from "./pages/OrganizerPage";
import ChannelPage from "./pages/ChannelPage";
import DemoPage from "./pages/DemoPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";
import OrganizerLoginPage from "./pages/OrganizerLoginPage";
import OrganizerRegistrationStubPage from "./pages/OrganizerRegistrationStubPage";
import OrganizerEventCompliancePage from "./pages/OrganizerEventCompliancePage";
import PlatformLandingPage from "./pages/PlatformLandingPage";
import MainPage from "./pages/MainPage";
import ProtoPage from "./pages/ProtoPage";
import DemoToolsPanel from "./components/demo/DemoToolsPanel";
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

function MainRoute() {
  return (
    <>
      <MainPage />
      <Sonner />
      <aside className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-700 bg-slate-950/95 p-4 shadow-2xl">
        <div className="mb-3">
          <p className="text-sm font-semibold text-white">Инструменты прототипа</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Управление демо-данными актуального стенда.</p>
        </div>
        <DemoToolsPanel />
      </aside>
    </>
  );
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
          <Route path="/platform" element={<PlatformLandingPage />} />
          <Route path="/main" element={<MainRoute />} />
          <Route path="/proto" element={<ProtoPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
