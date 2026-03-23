import { useRef, useEffect } from "react";

const ALL_VIDEOS = [
  { src: "/videos/video-01.mp4", poster: "/images/thumbs/video-01.png" },
  { src: "/videos/video-02.mp4", poster: "/images/thumbs/video-02.png" },
  { src: "/videos/video-03.mp4", poster: "/images/thumbs/video-03.png" },
  { src: "/videos/video-04.mp4", poster: "/images/thumbs/video-04.png" },
  { src: "/videos/video-05.mp4", poster: "/images/thumbs/video-05.png" },
  { src: "/videos/video-06.mp4", poster: "/images/thumbs/video-06.png" },
];

export type HeroVideoStripVariant = "default" | "featured";

interface HeroVideoStripProps {
  /** default = 1,2,3; featured = 4,5,6 (more relevant live streaming) */
  variant?: HeroVideoStripVariant;
  /** sm = compact (e.g. under CTA); lg = larger hero strip on the right */
  size?: "sm" | "lg";
  /** alignment of the strip */
  align?: "center" | "end" | "start";
}

/**
 * A strip of auto-playing muted videos for the hero. Makes it obvious the product is live/TikTok-style shopping.
 */
const HeroVideoStrip = ({
  variant = "default",
  size = "sm",
  align = "center",
}: HeroVideoStripProps) => {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const videos =
    variant === "featured" ? ALL_VIDEOS.slice(3, 6) : ALL_VIDEOS.slice(0, 3);

  useEffect(() => {
    refs.current.forEach((el) => {
      if (el) {
        el.muted = true;
        el.play().catch(() => {});
      }
    });
  }, []);

  const alignClass =
    align === "end" ? "justify-end" : align === "start" ? "justify-start" : "justify-center";
  /* Fixed widths so three cards + gaps never overflow or overlap */
  const cardWidth =
    size === "lg"
      ? "w-[100px] sm:w-[130px] lg:w-[150px] xl:w-[160px]"
      : "w-[min(28vw,140px)] sm:w-[min(24vw,160px)]";
  const roundedClass = size === "lg" ? "rounded-2xl" : "rounded-xl";

  return (
    <div className={`flex ${alignClass} gap-2 sm:gap-3 lg:gap-4 w-full max-w-[calc(100vw-2rem)] sm:max-w-none`}>
      {videos.map((v, i) => (
        <div
          key={i}
          className={`${cardWidth} shrink-0 overflow-hidden ${roundedClass} border border-border/60 bg-muted shadow-xl ring-1 ring-black/5`}
        >
          <video
            ref={(el) => {
              refs.current[i] = el;
            }}
            src={v.src}
            poster={v.poster}
            playsInline
            muted
            loop
            autoPlay
            className="aspect-[9/16] w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default HeroVideoStrip;
