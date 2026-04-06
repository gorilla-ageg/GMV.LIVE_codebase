import { useRef, useEffect } from "react";

interface LiveVideoCardProps {
  video: string;
  poster: string;
  label: string;
  sublabel?: string;
}

const LiveVideoCard = ({ video, poster, label, sublabel }: LiveVideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all">
      <div className="aspect-[9/16] overflow-hidden">
        <video
          ref={videoRef}
          src={video}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
      <div className="absolute top-3 left-3">
        <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-red-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
        </span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {sublabel && <p className="text-[10px] text-emerald-400 font-medium mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};

export default LiveVideoCard;
