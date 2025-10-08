"use client";
import React from "react";

type StripCarouselProps = {
  images: string[];
  heightPx?: number;
  intervalMs?: number;
};

export default function StripCarousel({
  images,
  heightPx = 75,
  intervalMs = 4000,
}: StripCarouselProps) {
  const [index, setIndex] = React.useState(0);
  const numSlides = images.length;

  React.useEffect(() => {
    if (numSlides <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % numSlides);
    }, intervalMs);
    return () => clearInterval(id);
  }, [numSlides, intervalMs]);

  const go = (delta: number) => setIndex((i) => (i + delta + numSlides) % numSlides);

  return (
    <div className="relative w-full overflow-hidden" style={{ height: heightPx }}>
      <div
        className="absolute inset-0 bg-no-repeat bg-cover bg-center transition-opacity duration-700"
        style={{ backgroundImage: `url(${images[index]})` }}
      />
      {numSlides > 1 && (
        <>
          <button
            aria-label="Previous"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 w-[45px] h-[45px] rounded-full grid place-items-center"
          >
            {/* simple caret */}
            <span className="text-black text-[18px]">&#8249;</span>
          </button>
          <button
            aria-label="Next"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 w-[45px] h-[45px] rounded-full grid place-items-center"
          >
            <span className="text-black text-[18px]">&#8250;</span>
          </button>
        </>
      )}
    </div>
  );
}


