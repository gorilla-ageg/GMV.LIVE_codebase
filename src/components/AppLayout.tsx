import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut, MessageSquare, Package, User, Settings,
  Handshake, Menu, X, LayoutDashboard, Plus, ChevronLeft,
  ShieldCheck, Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: ("brand" | "creator" | "admin")[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard className="h-5 w-5" />, roles: ["brand", "creator"] },
  { label: "Browse Creators", path: "/browse", icon: <Search className="h-5 w-5" />, roles: ["brand"] },
  { label: "Browse Products", path: "/browse", icon: <Search className="h-5 w-5" />, roles: ["creator"] },
  { label: "Deals", path: "/deals", icon: <Handshake className="h-5 w-5" />, roles: ["brand", "creator"] },
  { label: "Products", path: "/my-products", icon: <Package className="h-5 w-5" />, roles: ["brand"] },
  { label: "Profile", path: "/profile", icon: <User className="h-5 w-5" />, roles: ["brand", "creator"] },
  { label: "Settings", path: "/settings/profile", icon: <Settings className="h-5 w-5" />, roles: ["brand", "creator"] },
  { label: "Admin Dashboard", path: "/admin", icon: <ShieldCheck className="h-5 w-5" />, roles: ["admin"] },
];

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["nav-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  const initials = (profile?.display_name || "")
    .split(" ")
    .filter((w: string) => w.length > 0)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredNav = NAV_ITEMS.filter(
    (item) => !item.roles || (role && item.roles.includes(role as "brand" | "creator" | "admin"))
  );

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className={cn(
        "flex items-center border-b border-border px-4",
        collapsed ? "h-16 justify-center" : "h-16 justify-between"
      )}>
        {!collapsed ? (
          <Link to="/dashboard" className="flex items-center gap-2.5 text-xl font-bold text-foreground">
            <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-10 w-10" />
            <span>GMV<span className="font-normal text-muted-foreground">.live</span></span>
          </Link>
        ) : (
          <Link to="/dashboard" className="flex items-center justify-center">
            <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-11 w-11" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden text-muted-foreground hover:text-foreground md:block"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-5 w-5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNav.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              isActive(item.path)
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
            )}
            title={collapsed ? item.label : undefined}
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}

        {role === "brand" && (
          <Button
            size="sm"
            className={cn("mt-4 w-full gap-2", collapsed && "px-2")}
            onClick={() => { navigate("/products/new"); setSidebarOpen(false); }}
          >
            <Plus className="h-4 w-4" />
            {!collapsed && "New Product"}
          </Button>
        )}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-border p-3", collapsed && "flex justify-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent/10",
              collapsed && "justify-center px-2"
            )}>
              <Avatar className="h-8 w-8 shrink-0">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name || ""} />
                )}
                <AvatarFallback className="text-xs">
                  {initials || <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {profile?.display_name || "User"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground capitalize">
                    {role || ""}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-48">
            <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings/profile")} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-40 border-r border-border bg-card transition-all duration-200",
        collapsed ? "md:w-16" : "md:w-60"
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border bg-card transition-transform duration-200 md:hidden",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Main content area */}
      <div className={cn(
        "flex-1 transition-all duration-200",
        collapsed ? "md:ml-16" : "md:ml-60"
      )}>
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-md px-4 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-foreground"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/dashboard" className="flex items-center gap-2 text-lg font-bold text-foreground">
            <img src="/images/gmv-logo-mark.svg" alt="GMV.live" className="h-7 w-7" />
            <span>GMV<span className="font-normal text-muted-foreground">.live</span></span>
          </Link>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
