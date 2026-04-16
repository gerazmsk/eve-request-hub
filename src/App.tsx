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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, profile, isReady } = useAuth();
  if (!isReady) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (user && profile) {
    return <Navigate to={profile.role === 'client' ? '/client' : '/provider'} replace />;
  }
  return <>{children}</>;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isReady } = useAuth();
  if (!isReady) return <div className="flex min-h-screen items-center justify-center"><p>Loading...</p></div>;
  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthRedirect><Welcome /></AuthRedirect>} />
    <Route path="/account" element={<AuthRedirect><AccountPage /></AuthRedirect>} />
    <Route path="/signup" element={<AuthRedirect><SignUp /></AuthRedirect>} />
    <Route path="/login" element={<AuthRedirect><LogIn /></AuthRedirect>} />

    {/* Client routes */}
    <Route path="/client" element={<RequireAuth><ClientHome /></RequireAuth>} />
    <Route path="/client/category/:category" element={<RequireAuth><ProviderListing /></RequireAuth>} />
    <Route path="/client/provider/:profileId" element={<RequireAuth><ProviderProfileView /></RequireAuth>} />
    <Route path="/client/request/:profileId" element={<RequireAuth><CreateRequest /></RequireAuth>} />
    <Route path="/client/plan-event" element={<RequireAuth><PlanMyEvent /></RequireAuth>} />
    <Route path="/client/request-sent" element={<RequireAuth><RequestSent /></RequireAuth>} />
    <Route path="/client/requests" element={<RequireAuth><MyRequests /></RequireAuth>} />
    <Route path="/client/requests/:requestId" element={<RequireAuth><RequestDetail /></RequireAuth>} />
    <Route path="/client/messages" element={<RequireAuth><MessageList /></RequireAuth>} />
    <Route path="/client/messages/:threadId" element={<RequireAuth><ConversationThread /></RequireAuth>} />
    <Route path="/client/group/:groupId" element={<RequireAuth><GroupChatThread /></RequireAuth>} />
    <Route path="/client/new-group" element={<RequireAuth><CreateGroupChat /></RequireAuth>} />
    <Route path="/client/profile" element={<RequireAuth><ClientProfile /></RequireAuth>} />
    <Route path="/client/account" element={<RequireAuth><AccountSettings /></RequireAuth>} />

    {/* Provider routes */}
    <Route path="/provider" element={<RequireAuth><ProviderDashboard /></RequireAuth>} />
    <Route path="/provider/events/:requestId" element={<RequireAuth><ProviderEventDetail /></RequireAuth>} />
    <Route path="/provider/leads" element={<RequireAuth><ProviderLeads /></RequireAuth>} />
    <Route path="/provider/availability" element={<RequireAuth><ProviderAvailability /></RequireAuth>} />
    <Route path="/provider/messages" element={<RequireAuth><MessageList /></RequireAuth>} />
    <Route path="/provider/messages/:threadId" element={<RequireAuth><ConversationThread /></RequireAuth>} />
    <Route path="/provider/group/:groupId" element={<RequireAuth><GroupChatThread /></RequireAuth>} />
    <Route path="/provider/new-group" element={<RequireAuth><CreateGroupChat /></RequireAuth>} />
    <Route path="/provider/profile" element={<RequireAuth><ProviderEditProfile /></RequireAuth>} />
    <Route path="/provider/account" element={<RequireAuth><AccountSettings /></RequireAuth>} />

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
