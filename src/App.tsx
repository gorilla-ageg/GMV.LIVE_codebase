import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import OnboardingRole from "./pages/OnboardingRole";
import OnboardingBrand from "./pages/OnboardingBrand";
import OnboardingCreator from "./pages/OnboardingCreator";
import Onboarding from "./pages/Onboarding";
import Feed from "./pages/Feed";
import ProductDetail from "./pages/ProductDetail";
import CreatorDetail from "./pages/CreatorDetail";
import MyProducts from "./pages/MyProducts";
import NewProduct from "./pages/NewProduct";
import Messages from "./pages/Messages";
import ConversationThread from "./pages/ConversationThread";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ForCreators from "./pages/ForCreators";
import Waitlist from "./pages/Waitlist";
import Pricing from "./pages/Pricing";
import Blog from "./pages/Blog";
import DealInbox from "./pages/DealInbox";
import DealRoom from "./pages/DealRoom";
import EditProduct from "./pages/EditProduct";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<ForCreators />} />
              <Route path="/for-brands" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              <Route path="/register" element={<Navigate to="/auth" replace />} />
              <Route path="/waitlist" element={<Waitlist />} />
              <Route path="/for-creators" element={<ForCreators />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/coming-soon" element={<ComingSoon />} />
              <Route path="/onboarding/role" element={<OnboardingRole />} />
              <Route path="/onboarding/brand" element={<OnboardingBrand />} />
              <Route path="/onboarding/creator" element={<OnboardingCreator />} />
              <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
              <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
              <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
              <Route path="/creators/:id" element={<ProtectedRoute><CreatorDetail /></ProtectedRoute>} />
              <Route path="/my-products" element={<ProtectedRoute requiredRole="brand"><MyProducts /></ProtectedRoute>} />
              <Route path="/products/new" element={<ProtectedRoute requiredRole="brand"><NewProduct /></ProtectedRoute>} />
              <Route path="/products/:id/edit" element={<ProtectedRoute requiredRole="brand"><EditProduct /></ProtectedRoute>} />
              <Route path="/deals" element={<ProtectedRoute><DealInbox /></ProtectedRoute>} />
              <Route path="/deals/:id" element={<ProtectedRoute><DealRoom /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
              <Route path="/messages/:id" element={<ProtectedRoute><ConversationThread /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
              <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
