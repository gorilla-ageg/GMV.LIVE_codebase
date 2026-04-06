import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import ProtectedRoute from "@/components/ProtectedRoute";
import OnboardingRoute from "@/components/OnboardingRoute";
import AdminRoute from "@/components/AdminRoute";
import ScrollToTop from "@/components/ScrollToTop";

// Eager-load the landing page (first thing users see)
import ForCreators from "./pages/ForCreators";

// Lazy-load everything else
const Index = lazy(() => import("./pages/Index"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const OnboardingRole = lazy(() => import("./pages/OnboardingRole"));
const OnboardingBrand = lazy(() => import("./pages/OnboardingBrand"));
const OnboardingCreator = lazy(() => import("./pages/OnboardingCreator"));
const Feed = lazy(() => import("./pages/Feed"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CreatorDetail = lazy(() => import("./pages/CreatorDetail"));
const MyProducts = lazy(() => import("./pages/MyProducts"));
const NewProduct = lazy(() => import("./pages/NewProduct"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Waitlist = lazy(() => import("./pages/Waitlist"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Blog = lazy(() => import("./pages/Blog"));
const DealInbox = lazy(() => import("./pages/DealInbox"));
const DealRoom = lazy(() => import("./pages/DealRoom"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Suspended = lazy(() => import("./pages/Suspended"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ScrollToTop />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
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
                <Route path="/suspended" element={<Suspended />} />

                {/* Onboarding routes */}
                <Route path="/onboarding/role" element={<OnboardingRoute><OnboardingRole /></OnboardingRoute>} />
                <Route path="/onboarding/brand" element={<OnboardingRoute><OnboardingBrand /></OnboardingRoute>} />
                <Route path="/onboarding/creator" element={<OnboardingRoute><OnboardingCreator /></OnboardingRoute>} />
                <Route path="/onboarding" element={<Navigate to="/onboarding/role" replace />} />

                {/* Protected routes */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/browse" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
                <Route path="/products/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
                <Route path="/creators/:id" element={<ProtectedRoute><CreatorDetail /></ProtectedRoute>} />
                <Route path="/my-products" element={<ProtectedRoute requiredRole="brand"><MyProducts /></ProtectedRoute>} />
                <Route path="/products/new" element={<ProtectedRoute requiredRole="brand"><NewProduct /></ProtectedRoute>} />
                <Route path="/products/:id/edit" element={<ProtectedRoute requiredRole="brand"><EditProduct /></ProtectedRoute>} />
                <Route path="/deals" element={<ProtectedRoute><DealInbox /></ProtectedRoute>} />
                <Route path="/deals/:id" element={<ProtectedRoute><DealRoom /></ProtectedRoute>} />
                <Route path="/messages" element={<Navigate to="/deals" replace />} />
                <Route path="/messages/:id" element={<Navigate to="/deals" replace />} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/settings" element={<Navigate to="/settings/profile" replace />} />
                <Route path="/settings/profile" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/settings/payment" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

                {/* Admin */}
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
