"use client";
import React from "react";
import Image from "next/image";

export type ColorItem = {
  imageSrc: string;
  label: string;
};

type ShopByColorProps = {
  items: ColorItem[];
};

export default function ShopByColor({ items }: ShopByColorProps) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const [pageIndex, setPageIndex] = React.useState(0);

  const scrollByCards = (delta: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector("[data-color-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth : 220;
    const gap = 24;
    scroller.scrollBy({ left: delta * (cardWidth + gap), behavior: "smooth" });
  };

  React.useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const onScroll = () => {
      const card = scroller.querySelector("[data-color-card]") as HTMLElement | null;
      const cardWidth = card ? card.offsetWidth : 220;
      const gap = 24;
      const idx = Math.round(scroller.scrollLeft / (cardWidth + gap));
      setPageIndex(idx);
    };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="w-full">
      <div className="w-[1400px] max-w-full mx-auto px-[60px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[28px] md:text-[32px] tracking-[-0.02em] text-black">Shop By Color</h2>
          <button
            aria-label="Next"
            onClick={() => scrollByCards(1)}
            className="hidden md:grid place-items-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10"
          >
            <span className="text-[18px]">&#8250;</span>
          </button>
        </div>

        <div className="relative">
          {/* Left arrow over the first tile */}
          <button
            aria-label="Previous"
            onClick={() => scrollByCards(-1)}
            className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-10 grid place-items-center w-9 h-9 rounded-full bg-white shadow"
          >
            <span className="text-[16px]">&#8249;</span>
          </button>

          <div
            ref={scrollerRef}
            className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]"
            style={{ scrollBehavior: "smooth" }}
          >
            <div className="flex gap-6 pr-4">
              {items.map((item, idx) => (
                <div key={idx} data-color-card className="min-w-[220px] md:min-w-[240px] lg:min-w-[260px]">
                  <div className="relative  md:h-[200px]  bg-[#F3F3F3]">
                    <Image src={item.imageSrc} alt={item.label} fill className="object-contain" />
                    <div className="absolute left-3 top-3  px-2 py-1 text-[11px] tracking-[0.08em] uppercase shadow-sm">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right floating arrow */}
          <button
            aria-label="Next"
            onClick={() => scrollByCards(1)}
            className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-10 grid place-items-center w-9 h-9 rounded-full bg-white shadow"
          >
            <span className="text-[16px]">&#8250;</span>
          </button>
        </div>

        {/* Simple pagination indicator */}
        <div className="mt-3 flex justify-center gap-2">
          {Array.from({ length: Math.max(1, items.length - 2) }).map((_, i) => (
            <div
              key={i}
              className={"h-[2px] w-10 " + (i === pageIndex ? "bg-black" : "bg-black/30")}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


