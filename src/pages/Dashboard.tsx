import { useAuth } from "@/contexts/AuthContext";
import BrandDashboard from "./BrandDashboard";
import CreatorDashboard from "./CreatorDashboard";

const Dashboard = () => {
  const { role } = useAuth();
  return role === "brand" ? <BrandDashboard /> : <CreatorDashboard />;
};

export default Dashboard;
