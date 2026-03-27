import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import Welcome from "./pages/Welcome";
import AccountPage from "./pages/AccountPage";
import SignUp from "./pages/SignUp";
import LogIn from "./pages/LogIn";
import ClientHome from "./pages/ClientHome";
import ProviderListing from "./pages/ProviderListing";
import ProviderProfileView from "./pages/ProviderProfileView";
import CreateRequest from "./pages/CreateRequest";
import RequestSent from "./pages/RequestSent";
import MyRequests from "./pages/MyRequests";
import RequestDetail from "./pages/RequestDetail";
import MessageList from "./pages/MessageList";
import ConversationThread from "./pages/ConversationThread";
import ProviderDashboard from "./pages/ProviderDashboard";
import ProviderEventDetail from "./pages/ProviderEventDetail";
import ProviderEditProfile from "./pages/ProviderEditProfile";
import AccountSettings from "./pages/AccountSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<LogIn />} />

            {/* Client routes */}
            <Route path="/client" element={<ClientHome />} />
            <Route path="/client/category/:category" element={<ProviderListing />} />
            <Route path="/client/provider/:profileId" element={<ProviderProfileView />} />
            <Route path="/client/request/:profileId" element={<CreateRequest />} />
            <Route path="/client/request-sent" element={<RequestSent />} />
            <Route path="/client/requests" element={<MyRequests />} />
            <Route path="/client/requests/:requestId" element={<RequestDetail />} />
            <Route path="/client/messages" element={<MessageList />} />
            <Route path="/client/messages/:threadId" element={<ConversationThread />} />
            <Route path="/client/account" element={<AccountSettings />} />

            {/* Provider routes */}
            <Route path="/provider" element={<ProviderDashboard />} />
            <Route path="/provider/events/:requestId" element={<ProviderEventDetail />} />
            <Route path="/provider/messages" element={<MessageList />} />
            <Route path="/provider/messages/:threadId" element={<ConversationThread />} />
            <Route path="/provider/profile" element={<ProviderEditProfile />} />
            <Route path="/provider/account" element={<AccountSettings />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
