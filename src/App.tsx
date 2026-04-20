import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Welcome from "./pages/Welcome";
import AccountPage from "./pages/AccountPage";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import ClientHome from "./pages/ClientHome";
import ProviderListing from "./pages/ProviderListing";
import ProviderProfileView from "./pages/ProviderProfileView";
import CreateRequest from "./pages/CreateRequest";
import PlanMyEvent from "./pages/PlanMyEvent";
import RequestSent from "./pages/RequestSent";
import MyRequests from "./pages/MyRequests";
import RequestDetail from "./pages/RequestDetail";
import MessageList from "./pages/MessageList";
import ConversationThread from "./pages/ConversationThread";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderEventDetail from "./pages/ProviderEventDetail";
import ProviderEditProfile from "./pages/ProviderEditProfile";
import ProviderAvailability from "./pages/ProviderAvailability";
import ProviderLeads from "./pages/ProviderLeads";
import AccountSettings from "./pages/AccountSettings";
import UserProfileView from "./pages/UserProfileView";
import GroupChatThread from "./pages/GroupChatThread";
import CreateGroupChat from "./pages/CreateGroupChat";
import ClientProfile from "./pages/ClientProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, profile, isReady } = useAuth();
  if (!isReady) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (user && !profile) return <div className="flex min-h-screen items-center justify-center"><p>Loading account...</p></div>;
  if (user && profile) {
    return <Navigate to={profile.role === 'client' ? '/client' : '/provider'} replace />;
  }
  return <>{children}</>;
}

function RequireAuth({ children, role }: { children: React.ReactNode; role?: 'client' | 'provider' }) {
  const { user, profile, isReady } = useAuth();
  if (!isReady) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  if (!profile) return <div className="flex min-h-screen items-center justify-center"><p>Loading account...</p></div>;
  if (role && profile && profile.role !== role) {
    return <Navigate to={profile.role === 'client' ? '/client' : '/provider'} replace />;
  }
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthRedirect><Welcome /></AuthRedirect>} />
    <Route path="/account" element={<AuthRedirect><AccountPage /></AuthRedirect>} />
    <Route path="/signup" element={<AuthRedirect><SignUp /></AuthRedirect>} />
    <Route path="/login" element={<AuthRedirect><LogIn /></AuthRedirect>} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />

    {/* Client routes */}
    <Route path="/client" element={<RequireAuth role="client"><ClientHome /></RequireAuth>} />
    <Route path="/client/category/:category" element={<RequireAuth role="client"><ProviderListing /></RequireAuth>} />
    <Route path="/client/provider/:profileId" element={<RequireAuth role="client"><ProviderProfileView /></RequireAuth>} />
    <Route path="/client/request/:profileId" element={<RequireAuth role="client"><CreateRequest /></RequireAuth>} />
    <Route path="/client/plan-event" element={<RequireAuth role="client"><PlanMyEvent /></RequireAuth>} />
    <Route path="/client/request-sent" element={<RequireAuth role="client"><RequestSent /></RequireAuth>} />
    <Route path="/client/requests" element={<RequireAuth role="client"><MyRequests /></RequireAuth>} />
    <Route path="/client/requests/:requestId" element={<RequireAuth role="client"><RequestDetail /></RequireAuth>} />
    <Route path="/client/messages" element={<RequireAuth role="client"><MessageList /></RequireAuth>} />
    <Route path="/client/messages/:threadId" element={<RequireAuth role="client"><ConversationThread /></RequireAuth>} />
    <Route path="/client/group/:groupId" element={<RequireAuth role="client"><GroupChatThread /></RequireAuth>} />
    <Route path="/client/new-group" element={<RequireAuth role="client"><CreateGroupChat /></RequireAuth>} />
    <Route path="/client/profile" element={<RequireAuth role="client"><ClientProfile /></RequireAuth>} />
    <Route path="/client/account" element={<RequireAuth role="client"><AccountSettings /></RequireAuth>} />

    {/* Provider routes */}
    <Route path="/provider" element={<RequireAuth role="provider"><ProviderDashboard /></RequireAuth>} />
    <Route path="/provider/events/:requestId" element={<RequireAuth role="provider"><ProviderEventDetail /></RequireAuth>} />
    <Route path="/provider/leads" element={<RequireAuth role="provider"><ProviderLeads /></RequireAuth>} />
    <Route path="/provider/availability" element={<RequireAuth role="provider"><ProviderAvailability /></RequireAuth>} />
    <Route path="/provider/messages" element={<RequireAuth role="provider"><MessageList /></RequireAuth>} />
    <Route path="/provider/messages/:threadId" element={<RequireAuth role="provider"><ConversationThread /></RequireAuth>} />
    <Route path="/provider/group/:groupId" element={<RequireAuth role="provider"><GroupChatThread /></RequireAuth>} />
    <Route path="/provider/new-group" element={<RequireAuth role="provider"><CreateGroupChat /></RequireAuth>} />
    <Route path="/provider/profile" element={<RequireAuth role="provider"><ProviderEditProfile /></RequireAuth>} />
    <Route path="/provider/account" element={<RequireAuth role="provider"><AccountSettings /></RequireAuth>} />

    {/* Shared */}
    <Route path="/profile/:userId" element={<RequireAuth><UserProfileView /></RequireAuth>} />

    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
