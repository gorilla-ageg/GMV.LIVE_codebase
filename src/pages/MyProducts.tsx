import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Plus, Package, Loader2 } from "lucide-react";

const MyProducts = () => {
  const { user } = useAuth();

  const { data: products, isLoading } = useQuery({
    queryKey: ["my-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("brand_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <AppLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Products</h1>
        <Button asChild><Link to="/products/new"><Plus className="mr-1 h-4 w-4" /> Add Product</Link></Button>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : products?.length === 0 ? (
          <p className="col-span-full py-12 text-center text-muted-foreground">No products yet. Add your first one!</p>
        ) : (
          products?.map((p: any) => (
            <Link key={p.id} to={`/products/${p.id}/edit`} className="group">
              <Card className="overflow-hidden transition-shadow group-hover:shadow-lg">
                {/* Hero image */}
                <div className="relative aspect-[3/2] w-full overflow-hidden bg-muted">
                  {p.images?.[0] ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <Badge
                    variant={p.status === "active" ? "default" : "secondary"}
                    className="absolute right-3 top-3 shadow-sm"
                  >
                    {p.status}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{p.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default MyProducts;
