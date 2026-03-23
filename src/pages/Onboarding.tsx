import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const NICHE_OPTIONS = ["Beauty", "Fashion", "Tech", "Home", "Food", "Fitness", "Lifestyle", "Gaming", "Pets", "Travel"];
const PLATFORM_OPTIONS = ["TikTok", "Instagram", "Amazon Live", "YouTube", "Facebook"];

const CreatorOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bio, setBio] = useState("");
  const [niches, setNiches] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [followerCount, setFollowerCount] = useState("");
  const [avgGmv, setAvgGmv] = useState("");
  const [location, setLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleItem = (arr: string[], setArr: (v: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await supabase.from("profiles").update({ bio }).eq("id", user.id);
      const { error } = await supabase.from("creator_profiles").insert({
        user_id: user.id,
        niches,
        platforms,
        follower_count: parseInt(followerCount) || 0,
        avg_gmv: parseFloat(avgGmv) || 0,
        location,
      });
      if (error) throw error;
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Bio</Label>
        <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell brands about yourself…" />
      </div>

      <div className="space-y-2">
        <Label>Niches</Label>
        <div className="flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((n) => (
            <Badge
              key={n}
              variant={niches.includes(n) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleItem(niches, setNiches, n)}
            >
              {n} {niches.includes(n) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Platforms</Label>
        <div className="flex flex-wrap gap-2">
          {PLATFORM_OPTIONS.map((p) => (
            <Badge
              key={p}
              variant={platforms.includes(p) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleItem(platforms, setPlatforms, p)}
            >
              {p} {platforms.includes(p) && <X className="ml-1 h-3 w-3" />}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Follower Count</Label>
          <Input type="number" value={followerCount} onChange={(e) => setFollowerCount(e.target.value)} placeholder="e.g. 50000" />
        </div>
        <div className="space-y-2">
          <Label>Avg. GMV ($)</Label>
          <Input type="number" value={avgGmv} onChange={(e) => setAvgGmv(e.target.value)} placeholder="e.g. 5000" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Complete Profile"}
      </Button>
    </form>
  );
};

const BrandOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companyName, setCompanyName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("brand_profiles").insert({
        user_id: user.id,
        company_name: companyName,
        website,
        industry,
      });
      if (error) throw error;
      navigate("/feed");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Company Name</Label>
        <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>Website</Label>
        <Input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
      </div>
      <div className="space-y-2">
        <Label>Industry</Label>
        <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Beauty, Fashion, Tech" />
      </div>
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Saving…" : "Complete Profile"}
      </Button>
    </form>
  );
};

const Onboarding = () => {
  const { role } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <Link to="/" className="mb-2 text-xl font-bold text-foreground hover:text-primary transition-colors">gmv.live</Link>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            {role === "creator" ? "Tell brands what makes you great" : "Set up your brand profile"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {role === "creator" ? <CreatorOnboarding /> : <BrandOnboarding />}
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
