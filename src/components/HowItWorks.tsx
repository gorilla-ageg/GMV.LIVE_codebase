import MediaContainer from "./MediaContainer";

const steps = [
  {
    step: 1,
    title: "Find Your Host",
    description:
      "Browse vetted live shopping hosts. Filter by niche, selling style, platform, and past performance. Watch highlight reels before you book.",
  },
  {
    step: 2,
    title: "Align and Book",
    description:
      "Message hosts directly. Share your product brief, agree on format and budget, and lock in your live date. No agencies, no middlemen.",
  },
  {
    step: 3,
    title: "Go Live and Sell",
    description:
      "Ship your product, drop your talking points, and watch them sell. Track viewers, clicks, and conversions in real time.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How It Works
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.step}
              className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-shadow hover:shadow-md animate-fade-in-up"
              style={{ animationDelay: `${i * 150}ms`, opacity: 0 }}
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {s.step}
              </div>
              <h3 className="text-lg font-semibold text-card-foreground">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
              <div className="mt-5">
                <MediaContainer aspectRatio="video" showPlayButton />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
