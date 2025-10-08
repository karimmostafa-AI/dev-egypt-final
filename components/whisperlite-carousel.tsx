"use client";
import React from "react";
import Image from "next/image";

export type WhisperliteItem = {
  imageSrc: string;
  title: string;
};

type WhisperliteCarouselProps = {
  items: WhisperliteItem[];
};

export default function WhisperliteCarousel({ items }: WhisperliteCarouselProps) {
  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  const scrollByCards = (deltaCards: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector("[data-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth : 320;
    scroller.scrollBy({ left: deltaCards * (cardWidth + 24), behavior: "smooth" });
  };

  return (
    <section className="w-full">
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[32px] md:text-[40px] tracking-[-0.02em] text-black">Shop Whisperlite</h2>
          <div className="flex items-center gap-3">
            <button
              aria-label="Previous products"
              onClick={() => scrollByCards(-1)}
              className="w-10 h-10 rounded-full grid place-items-center bg-black/5 hover:bg-black/10 transition"
            >
              <span className="text-[18px]">&#8249;</span>
            </button>
            <button
              aria-label="Next products"
              onClick={() => scrollByCards(1)}
              className="w-10 h-10 rounded-full grid place-items-center bg-black/5 hover:bg-black/10 transition"
            >
              <span className="text-[18px]">&#8250;</span>
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollBehavior: "smooth" }}
        >
          <div className="flex gap-6 pr-2" style={{ paddingBottom: 6 }}>
            {items.map((item, idx) => (
              <div key={idx} data-card className="min-w-[280px] md:min-w-[300px] lg:min-w-[320px]">
                <div className="relative w-full h-[570px] bg-[#F3F3F3]">
                  {item.imageSrc ? (
                    <Image
                      src={item.imageSrc}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="mt-2 text-[13px] md:text-[14px] leading-snug text-black">
                  {item.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


