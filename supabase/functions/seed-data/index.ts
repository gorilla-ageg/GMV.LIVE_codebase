import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const avatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
  
  // Working Unsplash URLs with verified photo IDs
  const unsplash = (id: string) => `https://images.unsplash.com/${id}?w=800&h=600&fit=crop`;

  const creators = [
    { email: "creator1@demo.com", password: "demo1234", display_name: "Sarah Chen", bio: "Top TikTok live seller with 3 years experience in beauty and skincare. Known for high engagement rates and authentic product reviews.", niches: ["Beauty", "Skincare"], platforms: ["TikTok", "Instagram"], follower_count: 250000, avg_gmv: 15000, rating: 4.8, location: "Los Angeles, CA", portfolio: [unsplash("photo-1494790108377-be9c29b29330"), unsplash("photo-1529626455594-4ff0802cfb7e")] },
    { email: "creator2@demo.com", password: "demo1234", display_name: "Marcus Johnson", bio: "Tech reviewer and live shopping host. Specializing in gadgets, electronics, and smart home products.", niches: ["Tech", "Gaming"], platforms: ["YouTube", "TikTok"], follower_count: 180000, avg_gmv: 22000, rating: 4.6, location: "Austin, TX", portfolio: [unsplash("photo-1507003211169-0a1dd7228f2d"), unsplash("photo-1500648767791-00dcc994a43e")] },
    { email: "creator3@demo.com", password: "demo1234", display_name: "Jessica Rivera", bio: "Fashion and lifestyle creator. I bring energy and fun to every live stream. My audience loves discovering new brands!", niches: ["Fashion", "Lifestyle"], platforms: ["Instagram", "TikTok"], follower_count: 420000, avg_gmv: 35000, rating: 4.9, location: "Miami, FL", portfolio: [unsplash("photo-1534528741775-53994a69daeb"), unsplash("photo-1517841905240-472988babdf9")] },
    { email: "creator4@demo.com", password: "demo1234", display_name: "David Kim", bio: "Fitness and wellness live host. I help brands connect with health-conscious consumers through engaging live demonstrations.", niches: ["Fitness", "Home"], platforms: ["YouTube", "Facebook"], follower_count: 95000, avg_gmv: 8000, rating: 4.3, location: "Seattle, WA", portfolio: [unsplash("photo-1568602471122-7832951cc4c5"), unsplash("photo-1506794778202-cad84cf45f1d")] },
    { email: "creator5@demo.com", password: "demo1234", display_name: "Emma Thompson", bio: "Pet product specialist and animal lover. My community trusts my recommendations for their furry friends.", niches: ["Pets", "Lifestyle"], platforms: ["TikTok", "Instagram"], follower_count: 310000, avg_gmv: 12000, rating: 4.7, location: "Denver, CO", portfolio: [unsplash("photo-1524504388940-b1c1722653e1"), unsplash("photo-1531746020798-e6953c6e8e04")] },
    { email: "creator6@demo.com", password: "demo1234", display_name: "Aisha Patel", bio: "Home décor and DIY queen. Passionate about helping people transform their spaces on a budget through live demos.", niches: ["Home", "Lifestyle"], platforms: ["Instagram", "YouTube"], follower_count: 175000, avg_gmv: 9500, rating: 4.5, location: "Chicago, IL", portfolio: [unsplash("photo-1438761681033-6461ffad8d80"), unsplash("photo-1544005313-94ddf0286df2")] },
    { email: "creator7@demo.com", password: "demo1234", display_name: "Carlos Mendez", bio: "Food and kitchen gadget enthusiast. My live cooking demos consistently drive sales for kitchen brands.", niches: ["Food", "Home"], platforms: ["TikTok", "Facebook"], follower_count: 290000, avg_gmv: 18000, rating: 4.6, location: "Houston, TX", portfolio: [unsplash("photo-1472099645785-5658abf4ff4e"), unsplash("photo-1560250097-0b93528c311a")] },
    { email: "creator8@demo.com", password: "demo1234", display_name: "Lily Zhang", bio: "K-beauty expert and skincare educator. I break down ingredients and do live product comparisons.", niches: ["Beauty", "Skincare"], platforms: ["TikTok", "YouTube"], follower_count: 520000, avg_gmv: 42000, rating: 4.9, location: "New York, NY", portfolio: [unsplash("photo-1488426862026-3ee34a7d66df"), unsplash("photo-1502685104226-ee32379fefbe")] },
    { email: "creator9@demo.com", password: "demo1234", display_name: "Jake Morrison", bio: "Outdoor and adventure gear reviewer. I test products in real conditions during my live streams.", niches: ["Fitness", "Travel"], platforms: ["YouTube", "Instagram"], follower_count: 145000, avg_gmv: 11000, rating: 4.4, location: "Portland, OR", portfolio: [unsplash("photo-1492562080023-ab3db95bfbce"), unsplash("photo-1519085360753-af0119f7cbe7")] },
    { email: "creator10@demo.com", password: "demo1234", display_name: "Nina Okafor", bio: "Fashion-forward creator specializing in sustainable and ethical brands. My audience values quality over quantity.", niches: ["Fashion", "Lifestyle"], platforms: ["Instagram", "TikTok"], follower_count: 380000, avg_gmv: 28000, rating: 4.8, location: "Atlanta, GA", portfolio: [unsplash("photo-1489424731084-a5d8b219a5bb"), unsplash("photo-1508214751196-bcfd4ca60f91")] },
  ];

  const productImg = (id: string) => `https://images.unsplash.com/${id}?w=600&h=400&fit=crop`;

  const brandsData = [
    { email: "brand1@demo.com", password: "demo1234", display_name: "GlowUp Beauty", company_name: "GlowUp Beauty Co.", website: "https://glowupbeauty.com", industry: "Beauty & Skincare", product: { title: "Vitamin C Brightening Serum", description: "Our bestselling serum needs live demos showing before/after results. Looking for beauty creators who can showcase the glow-up transformation.", category: "Beauty", budget_min: 500, budget_max: 2000, target_platforms: ["TikTok", "Instagram"], commission_info: "15% commission per sale", images: [productImg("photo-1620916566398-39f1143ab7be"), productImg("photo-1571781926291-c477ebfd024b")], weekly_sales: "$12,400" } },
    { email: "brand2@demo.com", password: "demo1234", display_name: "TechVault", company_name: "TechVault Inc.", website: "https://techvault.io", industry: "Electronics", product: { title: "Wireless Noise-Cancelling Earbuds", description: "Launch campaign for our new ANC earbuds. Need tech reviewers who can do live unboxing and sound quality tests.", category: "Tech", budget_min: 1000, budget_max: 5000, target_platforms: ["YouTube", "TikTok"], commission_info: "10% commission per sale", images: [productImg("photo-1590658268037-6bf12165a8df"), productImg("photo-1606220588913-b3aacb4d2f46")], weekly_sales: "$28,700" } },
    { email: "brand3@demo.com", password: "demo1234", display_name: "FitLife Nutrition", company_name: "FitLife Nutrition LLC", website: "https://fitlifenutrition.com", industry: "Health & Wellness", product: { title: "Organic Protein Powder Bundle", description: "Promote our new plant-based protein line. Looking for fitness creators to do live taste tests and workout demos.", category: "Health", budget_min: 300, budget_max: 1500, target_platforms: ["Instagram", "YouTube", "Facebook"], commission_info: "20% commission per sale", images: [productImg("photo-1593095948071-474c5cc2989d"), productImg("photo-1594381898411-846e7d193883")], weekly_sales: "$8,200" } },
    { email: "brand4@demo.com", password: "demo1234", display_name: "HomeNest", company_name: "HomeNest Design", website: "https://homenest.co", industry: "Home & Living", product: { title: "Smart Home Starter Kit", description: "Demonstrate our smart home bundle (smart plugs, bulbs, doorbell) in a live setting. Show how easy setup is.", category: "Tech", budget_min: 800, budget_max: 3000, target_platforms: ["YouTube", "TikTok"], commission_info: "12% commission + free product", images: [productImg("photo-1558089687-f282ffcbc126"), productImg("photo-1545259741-2ea3ebf61fa3")], weekly_sales: "$15,300" } },
    { email: "brand5@demo.com", password: "demo1234", display_name: "Lumière Candles", company_name: "Lumière Artisan Candles", website: "https://lumierecandles.com", industry: "Home & Living", product: { title: "Luxury Candle Collection", description: "Holiday campaign for our handmade candle line. Need lifestyle creators who can create cozy, aesthetic vibes on stream.", category: "Home", budget_min: 200, budget_max: 800, target_platforms: ["TikTok", "Instagram"], commission_info: "18% commission per sale", images: [productImg("photo-1602607537639-b12a47e8e94d"), productImg("photo-1603006905003-be475563bc59")], weekly_sales: "$4,600" } },
    { email: "brand6@demo.com", password: "demo1234", display_name: "PureGlow Skin", company_name: "PureGlow Skincare", website: "https://pureglowskin.com", industry: "Beauty & Skincare", product: { title: "Anti-Aging Eye Cream", description: "Looking for skincare experts to demo our new eye cream with close-up before/after comparisons during live streams.", category: "Beauty", budget_min: 600, budget_max: 2500, target_platforms: ["TikTok", "Instagram", "Amazon Live"], commission_info: "15% commission per sale", images: [productImg("photo-1556228720-195a672e8a03"), productImg("photo-1598440947619-2c35fc9aa908")], weekly_sales: "$9,800" } },
    { email: "brand7@demo.com", password: "demo1234", display_name: "PawPerfect", company_name: "PawPerfect Pet Co.", website: "https://pawperfect.com", industry: "Pet Products", product: { title: "Organic Dog Treat Sampler", description: "We need pet-loving creators to showcase our all-natural dog treats during live unboxing sessions with their pets.", category: "Pets", budget_min: 250, budget_max: 1000, target_platforms: ["TikTok", "Instagram"], commission_info: "20% commission + free products", images: [productImg("photo-1587300003388-59208cc962cb"), productImg("photo-1623387641168-d9803ddd3f35")], weekly_sales: "$3,400" } },
    { email: "brand8@demo.com", password: "demo1234", display_name: "UrbanThread", company_name: "UrbanThread Fashion", website: "https://urbanthread.co", industry: "Fashion", product: { title: "Fall Streetwear Collection", description: "Launch our new streetwear drop with live try-on sessions. Looking for fashion creators with an urban aesthetic.", category: "Fashion", budget_min: 1500, budget_max: 5000, target_platforms: ["Instagram", "TikTok"], commission_info: "12% commission + free outfit", images: [productImg("photo-1523398002811-999ca8dec234"), productImg("photo-1489987707025-afc232f7ea0f")], weekly_sales: "$22,100" } },
    { email: "brand9@demo.com", password: "demo1234", display_name: "ChefTools Pro", company_name: "ChefTools Professional", website: "https://cheftoolspro.com", industry: "Kitchen & Cooking", product: { title: "Japanese Knife Set", description: "Live cooking demonstrations showcasing our premium Japanese knife set. Need food creators who can highlight precision cutting.", category: "Food", budget_min: 700, budget_max: 3000, target_platforms: ["YouTube", "TikTok", "Facebook"], commission_info: "10% commission + product set", images: [productImg("photo-1593618998160-e34014e67546"), productImg("photo-1566454419290-57a64afe1e5b")], weekly_sales: "$11,500" } },
    { email: "brand10@demo.com", password: "demo1234", display_name: "TrailBlaze Gear", company_name: "TrailBlaze Outdoor Gear", website: "https://trailblazegear.com", industry: "Outdoor & Adventure", product: { title: "Ultralight Hiking Backpack", description: "Need outdoor creators to test our new 30L ultralight pack on trail and do live gear reviews from the field.", category: "Fitness", budget_min: 500, budget_max: 2000, target_platforms: ["YouTube", "Instagram"], commission_info: "15% commission + free gear", images: [productImg("photo-1553062407-98eeb64c6a62"), productImg("photo-1501555088652-021faa106b9b")], weekly_sales: "$7,900" } },
  ];

  const results: string[] = [];

  // Delete existing demo data first
  for (const c of [...creators, ...brandsData]) {
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const found = existingUser?.users?.find((u: any) => u.email === c.email);
    if (found) {
      await supabaseAdmin.auth.admin.deleteUser(found.id);
      results.push(`🗑️ Deleted existing ${c.email}`);
    }
  }

  // Create creators
  for (const c of creators) {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: c.email,
      password: c.password,
      email_confirm: true,
      user_metadata: { role: "creator", display_name: c.display_name },
    });
    if (authErr) {
      results.push(`❌ Creator ${c.email}: ${authErr.message}`);
      continue;
    }
    const uid = authData.user.id;
    const avatar = avatarUrl(c.display_name);

    await supabaseAdmin.from("profiles").update({ bio: c.bio, avatar_url: avatar }).eq("id", uid);
    await supabaseAdmin.from("creator_profiles").insert({
      user_id: uid,
      niches: c.niches,
      platforms: c.platforms,
      follower_count: c.follower_count,
      avg_gmv: c.avg_gmv,
      rating: c.rating,
      location: c.location,
      portfolio_urls: c.portfolio,
    });
    results.push(`✅ Creator ${c.display_name}`);
  }

  // Create brands + products
  for (const b of brandsData) {
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: b.email,
      password: b.password,
      email_confirm: true,
      user_metadata: { role: "brand", display_name: b.display_name },
    });
    if (authErr) {
      results.push(`❌ Brand ${b.email}: ${authErr.message}`);
      continue;
    }
    const uid = authData.user.id;
    const avatar = avatarUrl(b.company_name);

    await supabaseAdmin.from("profiles").update({ avatar_url: avatar }).eq("id", uid);
    await supabaseAdmin.from("brand_profiles").insert({
      user_id: uid,
      company_name: b.company_name,
      website: b.website,
      industry: b.industry,
      logo_url: avatar,
    });

    const p = b.product as any;
    await supabaseAdmin.from("products").insert({
      brand_id: uid,
      title: p.title,
      description: p.description,
      category: p.category,
      budget_min: p.budget_min,
      budget_max: p.budget_max,
      target_platforms: p.target_platforms,
      commission_info: `${p.commission_info} · ${p.weekly_sales} in sales this week`,
      images: p.images,
    });
    results.push(`✅ Brand ${b.company_name} + 📦 ${p.title}`);
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
