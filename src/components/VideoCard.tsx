import { useRef, useEffect, useState } from "react";
import { Volume2, Pause, Loader2 } from "lucide-react";

interface VideoCardProps {
  src: string;
  poster?: string;
  isActive: boolean;
  preload: "auto" | "none";
  onTogglePlay: () => void;
}

const VideoCard = ({ src, poster, isActive, preload, onTogglePlay }: VideoCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);

  // Preload the poster image and swap out the blur once ready
  useEffect(() => {
    if (!poster) return;
    setPosterLoaded(false);
    const img = new Image();
    img.onload = () => setPosterLoaded(true);
    img.src = poster;
  }, [poster]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      setIsBuffering(true);
      video.currentTime = 0;
      video.muted = false;
      const playPromise = video.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setShowVideo(true);
            setIsBuffering(false);
          })
          .catch(() => {
            video.muted = true;
            video.play().then(() => {
              setShowVideo(true);
              setIsBuffering(false);
            }).catch(() => setIsBuffering(false));
          });
      }
    } else {
      video.pause();
      video.currentTime = 0;
      setShowVideo(false);
      setIsBuffering(false);
    }
  }, [isActive]);

  return (
    <div
      className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden rounded-2xl bg-muted"
      onClick={onTogglePlay}
    >
      {/* Blurred low-quality placeholder (always visible as base) */}
      {poster && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${poster})`,
            filter: posterLoaded ? "none" : "blur(20px)",
            transform: posterLoaded ? "scale(1)" : "scale(1.1)",
            transition: "filter 0.4s ease-out, transform 0.4s ease-out",
          }}
        />
      )}

      <video
        ref={videoRef}
        src={src}
        preload={preload}
        playsInline
        loop
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
          showVideo && isActive ? "opacity-100" : "opacity-0"
        }`}
      />

      {isActive && isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/30">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        </div>
      )}

      {!isActive && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/50 px-2.5 py-1.5 text-foreground backdrop-blur-sm">
          <Volume2 className="h-3.5 w-3.5" />
          <span className="text-[10px] font-medium">Play</span>
        </div>
      )}

      {isActive && !isBuffering && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-background/50 px-2.5 py-1.5 text-foreground backdrop-blur-sm">
          <Pause className="h-3.5 w-3.5" />
        </div>
      )}
    </div>
  );
};

export default VideoCard;
