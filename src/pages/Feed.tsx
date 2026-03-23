import { useAuth } from "@/contexts/AuthContext";
import CreatorFeed from "@/components/feeds/CreatorFeed";
import BrandFeed from "@/components/feeds/BrandFeed";
import AppLayout from "@/components/AppLayout";

const Feed = () => {
  const { role } = useAuth();
  return (
    <AppLayout>
      {role === "creator" ? <CreatorFeed /> : <BrandFeed />}
    </AppLayout>
  );
};

export default Feed;
