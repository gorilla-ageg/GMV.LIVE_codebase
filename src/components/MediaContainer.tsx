import { Play } from "lucide-react";

interface MediaContainerProps {
  src?: string;
  videoSrc?: string;
  alt?: string;
  aspectRatio?: "video" | "square" | "portrait";
  className?: string;
  showPlayButton?: boolean;
}

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  portrait: "aspect-[3/4]",
};

const MediaContainer = ({
  src,
  videoSrc,
  alt = "Media placeholder",
  aspectRatio = "video",
  className = "",
  showPlayButton = true,
}: MediaContainerProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-muted ${aspectClasses[aspectRatio]} ${className}`}
    >
      {videoSrc ? (
        <video
          src={videoSrc}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
      ) : src ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-secondary">
          <div className="text-muted-foreground/40 text-sm">Placeholder</div>
        </div>
      )}
      {showPlayButton && (
        <button className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors hover:bg-foreground/10 group">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-transform group-hover:scale-110">
            <Play className="h-5 w-5 ml-0.5" fill="currentColor" />
          </div>
        </button>
      )}
    </div>
  );
};

export default MediaContainer;
