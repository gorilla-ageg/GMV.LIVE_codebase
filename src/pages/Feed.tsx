import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import CreatorFeed from "@/components/feeds/CreatorFeed";
import BrandFeed from "@/components/feeds/BrandFeed";
import AppLayout from "@/components/AppLayout";

const Feed = () => {
  const { role } = useAuth();

  // Admin has no feed — redirect to admin dashboard
  if (role === "admin") return <Navigate to="/admin" replace />;

  return (
    <AppLayout>
      {role === "brand" ? <BrandFeed /> : <CreatorFeed />}
    </AppLayout>
  );
};

export default Feed;
