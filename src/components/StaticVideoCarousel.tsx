import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import VideoCard from "@/components/VideoCard";

const videos = [
  { src: "/videos/video-01.mp4", poster: "/images/thumbs/video-01.png" },
  { src: "/videos/video-02.mp4", poster: "/images/thumbs/video-02.png" },
  { src: "/videos/video-03.mp4", poster: "/images/thumbs/video-03.png" },
  { src: "/videos/video-04.mp4", poster: "/images/thumbs/video-04.png" },
  { src: "/videos/video-05.mp4", poster: "/images/thumbs/video-05.png" },
  { src: "/videos/video-06.mp4", poster: "/images/thumbs/video-06.png" },
  { src: "/videos/video-07.mp4", poster: "/images/thumbs/video-07.png" },
];

function useVisibleCount() {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCount(w >= 1024 ? 4 : w >= 640 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

/** Wrap index into [0, length) */
const wrap = (i: number, length: number) => ((i % length) + length) % length;

const StaticVideoCarousel = () => {
  const visibleCount = useVisibleCount();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handlePrev = useCallback(() => {
    setCurrentIndex((i) => wrap(i - 1, videos.length));
  }, []);

  const handleNext = useCallback(() => {
    setCurrentIndex((i) => wrap(i + 1, videos.length));
  }, []);

  const handleTogglePlay = useCallback((index: number) => {
    setActiveIndex((prev) => (prev === index ? null : index));
  }, []);

  // Build the visible indices (wrapping)
  const visibleIndices: number[] = [];
  for (let offset = 0; offset < visibleCount; offset++) {
    visibleIndices.push(wrap(currentIndex + offset, videos.length));
  }

  const cardWidth = 100 / visibleCount;

  return (
    <div className="relative w-full">
      {/* Left arrow */}
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrev}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-border bg-card/80 backdrop-blur-sm shadow-md"
        aria-label="Previous video"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      {/* Right arrow */}
      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-border bg-card/80 backdrop-blur-sm shadow-md"
        aria-label="Next video"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>

      {/* Carousel viewport — horizontal margin for arrows on small screens */}
      <div className="overflow-hidden rounded-2xl mx-10 sm:mx-12">
        <div className="flex gap-2 sm:gap-3 lg:gap-4">
            {visibleIndices.map((vi) => {
              const v = videos[vi];
              return (
                <div
                  key={`${currentIndex}-${vi}`}
                  className="shrink-0"
                  style={{ width: `calc(${cardWidth}% - ${((visibleCount - 1) * (visibleCount <= 1 ? 0 : 12)) / visibleCount}px)` }}
                >
                  <VideoCard
                    src={v.src}
                    poster={v.poster}
                    isActive={activeIndex === vi}
                    preload="auto"
                    onTogglePlay={() => handleTogglePlay(vi)}
                  />
                </div>
              );
            })}
          </div>
        </div>
    </div>
  );
};

export default StaticVideoCarousel;
