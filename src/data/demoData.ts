// Realistic demo data for GMV.live — modeled after top TikTok Shop brands & creators
// Images use local assets in /public to guarantee they always load

export interface DemoProduct {
  id: string;
  brand_id: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  budget_min: number;
  budget_max: number;
  target_platforms: string[];
  preferred_date: string | null;
  commission_info: string;
  status: string;
  past_month_gmv: number | null;
  created_at: string;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

export interface DemoCreator {
  id: string;
  user_id: string;
  niches: string[];
  platforms: string[];
  follower_count: number;
  avg_gmv: number;
  rating: number;
  portfolio_urls: string[];
  past_collabs: string[];
  location: string;
  experience_level: string;
  audience_type: string;
  tiktok_handle: string;
  instagram_handle: string;
  youtube_handle: string;
  product_interests: string[];
  has_tiktok_affiliate: boolean;
  created_at: string;
  public_profiles: {
    display_name: string;
    avatar_url: string;
    bio: string;
  };
}

export const DEMO_PRODUCTS: DemoProduct[] = [
  {
    id: "demo-product-sephora",
    brand_id: "demo-brand-sephora",
    title: "Rare Beauty Soft Pinch Blush — Live Launch",
    description:
      "We're looking for energetic live hosts to showcase the new Rare Beauty Soft Pinch Liquid Blush collection on TikTok Shop. Demonstrate shade range, application techniques, and durability. Ideal hosts have an engaged beauty audience and experience with live selling. This is a high-priority launch — top performers will be invited for ongoing brand ambassador roles.",
    images: ["/images/thumbs/video-01.png", "/images/thumbs/video-02.png"],
    category: "Beauty",
    budget_min: 500,
    budget_max: 2000,
    target_platforms: ["TikTok", "Instagram"],
    preferred_date: "2026-04-10",
    commission_info: "15% commission + $500 flat fee per stream",
    status: "active",
    past_month_gmv: 48000,
    created_at: "2026-03-10T12:00:00Z",
    profiles: {
      display_name: "Sephora",
      avatar_url: "/images/brands/sephora.png",
    },
  },
  {
    id: "demo-product-crocs",
    brand_id: "demo-brand-crocs",
    title: "Crocs Classic Clog — Spring Collection Livestream",
    description:
      "Promote the 2026 Spring Classic Clog collection featuring new colorways and Jibbitz charms. We need hosts who can make footwear fun and drive impulse buys. Show styling tips, unboxing, and on-foot demos. Bonus for hosts who can tap into the Gen Z customization trend with Jibbitz.",
    images: ["/images/thumbs/video-03.png", "/images/thumbs/video-04.png"],
    category: "Fashion",
    budget_min: 300,
    budget_max: 1200,
    target_platforms: ["TikTok"],
    preferred_date: "2026-04-05",
    commission_info: "12% commission on all live sales",
    status: "active",
    past_month_gmv: 32000,
    created_at: "2026-03-08T10:00:00Z",
    profiles: {
      display_name: "Crocs",
      avatar_url: "/images/brands/crocs.png",
    },
  },
  {
    id: "demo-product-samsung",
    brand_id: "demo-brand-samsung",
    title: "Galaxy Buds3 Pro — Tech Review Livestream",
    description:
      "Samsung is seeking tech-savvy live hosts to demo the Galaxy Buds3 Pro with real-time sound tests, ANC comparisons, and feature walk-throughs. Perfect for creators who can break down specs in an engaging way while driving TikTok Shop conversions. Experience with consumer electronics content preferred.",
    images: ["/images/thumbs/video-05.png"],
    category: "Tech",
    budget_min: 800,
    budget_max: 3000,
    target_platforms: ["TikTok", "YouTube"],
    preferred_date: "2026-04-15",
    commission_info: "10% commission + product gifting",
    status: "active",
    past_month_gmv: 75000,
    created_at: "2026-03-12T09:00:00Z",
    profiles: {
      display_name: "Samsung",
      avatar_url: "/images/brands/samsung.png",
    },
  },
  {
    id: "demo-product-rhode",
    brand_id: "demo-brand-rhode",
    title: "Rhode Peptide Lip Treatment — Viral Restock Stream",
    description:
      "Rhode's best-selling Peptide Lip Treatment is back in stock and we need creators to host a live shopping event. Show application, texture, before/after, and create urgency around limited availability. Looking for hosts with a skincare-focused audience who can speak authentically about clean beauty ingredients.",
    images: ["/images/thumbs/video-06.png", "/images/thumbs/video-07.png"],
    category: "Beauty",
    budget_min: 400,
    budget_max: 1500,
    target_platforms: ["TikTok", "Instagram"],
    preferred_date: null,
    commission_info: "18% commission — top TikTok Shop rate",
    status: "active",
    past_month_gmv: 62000,
    created_at: "2026-03-14T14:00:00Z",
    profiles: {
      display_name: "Rhode",
      avatar_url: "/images/brands/rhode.png",
    },
  },
  {
    id: "demo-product-adidas",
    brand_id: "demo-brand-adidas",
    title: "Adidas Ultraboost 5X — Fitness Live Sale",
    description:
      "Help us launch the Ultraboost 5X on TikTok Shop with an energetic fitness-focused livestream. Demonstrate comfort, performance features, and style versatility. Ideal hosts are active in the fitness or running community and can combine product demos with workout content. Multi-stream commitment preferred.",
    images: ["/images/thumbs/video-02.png", "/images/thumbs/video-05.png"],
    category: "Fitness",
    budget_min: 600,
    budget_max: 2500,
    target_platforms: ["TikTok", "YouTube", "Instagram"],
    preferred_date: "2026-04-20",
    commission_info: "10% commission + $750 per stream",
    status: "active",
    past_month_gmv: 55000,
    created_at: "2026-03-15T11:00:00Z",
    profiles: {
      display_name: "Adidas",
      avatar_url: "/images/brands/adidas.png",
    },
  },
];

export const DEMO_CREATORS: DemoCreator[] = [
  {
    id: "demo-creator-mia",
    user_id: "demo-creator-mia",
    niches: ["Beauty", "Skincare"],
    platforms: ["TikTok", "Instagram"],
    follower_count: 320000,
    avg_gmv: 4800,
    rating: 4.9,
    portfolio_urls: ["/images/thumbs/creator-1.png", "/images/thumbs/creator-2.png", "/images/thumbs/creator-3.png"],
    past_collabs: ["Sephora", "Rhode", "Glossier", "Fenty Beauty"],
    location: "Los Angeles, CA",
    experience_level: "pro",
    audience_type: "Women 18–34, beauty enthusiasts, skincare-first shoppers",
    tiktok_handle: "miachen.beauty",
    instagram_handle: "miachen.glow",
    youtube_handle: "",
    product_interests: ["Skincare", "Makeup", "Hair Care"],
    has_tiktok_affiliate: true,
    created_at: "2026-01-15T10:00:00Z",
    public_profiles: {
      display_name: "Mia Chen",
      avatar_url: "/images/hosts/girl-1.png",
      bio: "Full-time TikTok Shop live host specializing in beauty and skincare. I've driven $180K+ in GMV over the past 6 months through live selling. I focus on honest reviews and real-time demos that convert — my audience trusts my recommendations because I only promote products I genuinely use.",
    },
  },
  {
    id: "demo-creator-jordan",
    user_id: "demo-creator-jordan",
    niches: ["Tech", "Gaming"],
    platforms: ["TikTok", "YouTube"],
    follower_count: 185000,
    avg_gmv: 3600,
    rating: 5.0,
    portfolio_urls: ["/images/thumbs/creator-4.png", "/images/thumbs/creator-5.png"],
    past_collabs: ["Samsung", "Anker", "Logitech"],
    location: "Austin, TX",
    experience_level: "experienced",
    audience_type: "Men 18–30, tech early adopters, gamers",
    tiktok_handle: "jordanlee.tech",
    instagram_handle: "jordanlee.reviews",
    youtube_handle: "JordanLeeTech",
    product_interests: ["Electronics", "Audio", "Smart Home"],
    has_tiktok_affiliate: true,
    created_at: "2026-02-01T12:00:00Z",
    public_profiles: {
      display_name: "Jordan Lee",
      avatar_url: "/images/hosts/boy-1.png",
      bio: "Tech reviewer and live commerce host. I break down specs into plain English and show real-world performance on camera. My streams average 2K+ concurrent viewers. Previously worked in consumer electronics retail, so I know what drives purchase decisions.",
    },
  },
  {
    id: "demo-creator-aisha",
    user_id: "demo-creator-aisha",
    niches: ["Fashion", "Lifestyle"],
    platforms: ["TikTok", "Instagram"],
    follower_count: 245000,
    avg_gmv: 5200,
    rating: 4.8,
    portfolio_urls: ["/images/thumbs/creator-6.png", "/images/thumbs/creator-7.png", "/images/thumbs/creator-1.png"],
    past_collabs: ["Crocs", "Halara", "Shein", "Princess Polly"],
    location: "Miami, FL",
    experience_level: "pro",
    audience_type: "Women 18–28, fashion-forward, trend-conscious shoppers",
    tiktok_handle: "aisha.styles",
    instagram_handle: "aisha.patel",
    youtube_handle: "",
    product_interests: ["Clothing", "Footwear", "Accessories"],
    has_tiktok_affiliate: true,
    created_at: "2026-01-20T08:00:00Z",
    public_profiles: {
      display_name: "Aisha Patel",
      avatar_url: "/images/hosts/girl-2.png",
      bio: "Fashion and lifestyle live seller with a knack for styling hauls that drive massive cart adds. I've hosted 100+ live shopping sessions and know how to keep an audience engaged for 2–3 hour streams. I specialize in making affordable fashion look high-end.",
    },
  },
  {
    id: "demo-creator-tyler",
    user_id: "demo-creator-tyler",
    niches: ["Fitness", "Health"],
    platforms: ["TikTok", "YouTube", "Instagram"],
    follower_count: 150000,
    avg_gmv: 2900,
    rating: 4.7,
    portfolio_urls: ["/images/thumbs/creator-2.png", "/images/thumbs/creator-4.png"],
    past_collabs: ["Adidas", "Gymshark", "Optimum Nutrition"],
    location: "Denver, CO",
    experience_level: "experienced",
    audience_type: "Men & women 20–35, fitness enthusiasts, gym-goers",
    tiktok_handle: "tylerross.fit",
    instagram_handle: "tyler.ross.fitness",
    youtube_handle: "TylerRossFit",
    product_interests: ["Sportswear", "Supplements", "Fitness Equipment"],
    has_tiktok_affiliate: true,
    created_at: "2026-02-10T14:00:00Z",
    public_profiles: {
      display_name: "Tyler Ross",
      avatar_url: "/images/thumbs/creator-5.png",
      bio: "Certified personal trainer turned TikTok Shop live seller. I combine real workout demos with product showcases — my audience buys because they see the gear in action, not just on a model. Avg stream converts at 8% which is 3x the platform average.",
    },
  },
  {
    id: "demo-creator-sofia",
    user_id: "demo-creator-sofia",
    niches: ["Home", "Food"],
    platforms: ["TikTok", "Instagram"],
    follower_count: 198000,
    avg_gmv: 3200,
    rating: 4.9,
    portfolio_urls: ["/images/thumbs/creator-3.png", "/images/thumbs/creator-6.png", "/images/thumbs/creator-7.png"],
    past_collabs: ["Walmart", "Our Place", "Ninja Kitchen"],
    location: "Chicago, IL",
    experience_level: "pro",
    audience_type: "Women 25–40, home cooks, lifestyle shoppers",
    tiktok_handle: "sofiamartinez.home",
    instagram_handle: "sofia.cooks",
    youtube_handle: "",
    product_interests: ["Kitchen", "Home Decor", "Food & Beverage"],
    has_tiktok_affiliate: true,
    created_at: "2026-01-28T09:00:00Z",
    public_profiles: {
      display_name: "Sofia Martinez",
      avatar_url: "/images/hosts/girl-3.png",
      bio: "Home and kitchen live shopping host. I do cooking demos with the products I'm selling — nothing converts better than watching someone make a perfect meal with the exact pan you can buy right now. 200+ successful live streams and counting.",
    },
  },
];

export const DEMO_BRAND_NAMES = [
  "Sephora",
  "Crocs",
  "Samsung",
  "Rhode",
  "Adidas",
  "Halara",
  "medicube",
  "Tarte",
  "VEVOR",
  "Gymshark",
];

export const DEMO_BRAND_LOGOS: Record<string, string> = {
  Sephora: "/images/brands/sephora.png",
  Crocs: "/images/brands/crocs.png",
  Samsung: "/images/brands/samsung.png",
  Rhode: "/images/brands/rhode.png",
  Adidas: "/images/brands/adidas.png",
};

export function isDemoId(id: string): boolean {
  return id.startsWith("demo-");
}

export function getDemoProduct(id: string): DemoProduct | undefined {
  return DEMO_PRODUCTS.find((p) => p.id === id);
}

export function getDemoCreator(id: string): DemoCreator | undefined {
  return DEMO_CREATORS.find((c) => c.user_id === id);
}
