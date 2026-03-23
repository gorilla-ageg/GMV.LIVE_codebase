const brands = [
  { name: "Sephora", logo: "/images/brands/sephora.png" },
  { name: "Crocs", logo: "/images/brands/crocs.png" },
  { name: "Samsung", logo: "/images/brands/samsung.png" },
  { name: "Rhode", logo: "/images/brands/rhode.png" },
  { name: "Adidas", logo: "/images/brands/adidas.png" },
  { name: "Halara" },
  { name: "medicube" },
  { name: "Tarte" },
  { name: "VEVOR" },
  { name: "Gymshark" },
];

const SocialProofBar = () => {
  return (
    <section className="border-y border-border/50 bg-background py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium text-muted-foreground">
          Trusted by 200+ e-commerce brands going live every week.
        </p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex animate-scroll-logos w-max gap-12 px-6">
          {[...brands, ...brands].map((brand, i) => (
            <div
              key={i}
              className="flex h-10 w-28 shrink-0 items-center justify-center rounded-md bg-muted px-3"
            >
              {brand.logo ? (
                <img
                  src={brand.logo}
                  alt={brand.name}
                  className="h-7 w-auto max-w-full object-contain opacity-60 grayscale"
                />
              ) : (
                <span className="text-xs font-semibold text-muted-foreground/60 tracking-wide">
                  {brand.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProofBar;
