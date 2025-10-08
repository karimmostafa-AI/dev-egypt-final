import Image from "next/image";
import WhisperliteCarousel from "../../components/whisperlite-carousel";
import ShopByColor from "../../components/shop-by-color";
import MainLayout from "@/components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="font-sans w-full min-h-screen bg-white text-black">
      

      

      {/* Main container */}
      <main className="w-full flex flex-col items-center">
        <div className="w-[1400px] max-w-full flex flex-col">
          {/* Hero main image */}
          <section className="w-full">
            <div
              className="w-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: 'url(/figma/hero-main-56586a.png)' }}
            >
              <div className="h-[900px] sm:h-[1200px] md:h-[1600px] lg:h-[1800px]" />
            </div>
          </section>

          {/* Thin spacer */}
          <div className="w-full h-20 bg-white" />

          {/* Shop Whisperlite - MVP carousel */}
          <WhisperliteCarousel
            items={[
              {
                imageSrc: "/figma/slide_wear1.png",
                title: "",
              },
              {
                imageSrc: "/figma/slide_wear2.png",
                title: "",
              },
              {
                imageSrc: "/figma/slide_wear3.png",
                title: "",
              },
              {
                imageSrc: "/figma/slide_show4.png",
                title: "",
              },
            ]}
          />

          {/* Sky band - Shop All + categories */}
          <section className="w-full">
            <div
              className="w-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: 'url(/figma/ShopAll.jpg)' }}
            >
              <div className="w-[1400px] max-w-full mx-auto px-[60px] py-16 md:py-20 lg:py-24">
                <a
                  href="#"
                  className="inline-block text-white text-[14px] tracking-[0.15em] uppercase underline-offset-4 hover:underline"
                >
                  SHOP ALL &gt;
                </a>

                <div className="mt-10 md:mt-12 flex items-start justify-center gap-8 md:gap-10 lg:gap-14">
                  {/* Tops */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-[260px] h-[300px] md:w-[280px] md:h-[320px] bg-white/70">
                      <Image src="/figma/sky_brand_img1.png" alt="Shop Tops" fill className="object-cover" />
                    </div>
                    <a href="#" className="mt-3 text-white text-[14px] tracking-[0.15em] uppercase">SHOP TOPS &gt;</a>
                  </div>

                  {/* Pants */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-[260px] h-[300px] md:w-[280px] md:h-[320px] bg-white/70">
                      <Image src="/figma/sky_brand_img2.png" alt="Shop Pants" fill className="object-cover" />
                    </div>
                    <a href="#" className="mt-3 text-white text-[14px] tracking-[0.15em] uppercase">SHOP PANTS &gt;</a>
                  </div>

                  {/* Jackets */}
                  <div className="flex flex-col items-center">
                    <div className="relative w-[260px] h-[300px] md:w-[280px] md:h-[320px] bg-white/70">
                      <Image src="/figma/sky_band_img3.png" alt="Shop Jackets" fill className="object-cover" />
                    </div>
                    <a href="#" className="mt-3 text-white text-[14px] tracking-[0.15em] uppercase">SHOP JACKETS &gt;</a>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="w-full">
            <div
              className="w-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: 'url(/figma/afterSkyBrad.jpg)' }}
            >
              <div className="h-[100vh] w-[100vh] " />
            </div>
          </section>

          

          {/* Fixed height spacer */}
          <div className="w-full h-20 bg-white" />

          {/* Shop By Color - MVP carousel */}
          <ShopByColor
            items={[
              { imageSrc: "/figma/shop_color_img1.jpg", label: "" },
              { imageSrc: "/figma/shop_color_img2.png", label: "" },
              { imageSrc: "/figma/shop_color_img3.png", label: "" },
              { imageSrc: "/figma/shop_color_img4.png", label: "" },
            ]}
          />

          <br /><br />


          <section className="w-full">
            <div
              className="w-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: 'url(/figma/shop_the_look.jpg)' }}
            >
              <div className="h-[100vh] w-[100vh] " />
            </div>
          </section>

          {/* Shop the Fits */}
          <section className="w-full">
            <div
              className="w-full bg-no-repeat bg-cover bg-center"
              style={{ backgroundImage: 'url(/figma/shop-fits-56586a.png)' }}
            >
              <div className="h-[700px] sm:h-[900px] md:h-[1200px] lg:h-[1400px]" />
            </div>
          </section>


          

          {/* Reviews banner */}
          <section
            className="w-full bg-no-repeat bg-cover bg-center"
            style={{ backgroundImage: 'url(/figma/reviews-banner-56586a.png)'}}
          >
          </section>

         

          {/* Reviews section on cloud background */}
          <section
            className="w-full bg-no-repeat bg-cover bg-center text-center"
            style={{ backgroundImage: 'url(/figma/reviews-bg-56586a.png)', paddingTop: 70, paddingBottom: 109 }}
          >
            <div className="w-full flex flex-col items-center gap-4">
              <div className="text-[14px] tracking-[0.2em] text-white">FIVE STAR REVIEWS</div>
              <h2 className="text-[44px] leading-[1.2] tracking-[-0.02em] text-white">YOU SAY IT BEST</h2>
              <div className="text-[14px] tracking-[0.15em] text-white">WHISPERLITE CUSTOMERS LOVE THEIR SCRUBS</div>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full px-[60px]">
                <div className="bg-white/90 px-8 py-10 text-[16px] leading-[1.6]">
                  <p>Super soft and stretchy. Best of all, no hair, dirt or liquid stay on them.</p>
                  <p className="mt-4 font-semibold">Ashlyn L.</p>
                </div>
                <div className="bg-white/90 px-8 py-10 text-[16px] leading-[1.6]">
                  <p>I usually run hot and need to wear something light. These were perfect.</p>
                  <p className="mt-4 font-semibold">Eliza R.</p>
                </div>
                <div className="bg-white/90 px-8 py-10 text-[16px] leading-[1.6]">
                  <p>I love the material. I feel comfortable, confident and professional.</p>
                  <p className="mt-4 font-semibold">Maria O.</p>
                </div>
                <div className="bg-white/90 px-8 py-10 text-[16px] leading-[1.6]">
                  <p>So much stretch it’s like wearing yoga pants. Love all the pockets.</p>
                  <p className="mt-4 font-semibold">Sarah S.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Fixed height spacer */}
          <div className="w-full" style={{ height: 50 }} />
        </div>
      </main>

      
      <section className="w-full px-[140px] flex flex-col gap-2">
        <h1 className="text-[26px] leading-[1.2] tracking-[-0.03em]">
          Experience the Ultimate Comfort with WhisperLite Scrubs
        </h1>
        <p className="text-[16px] leading-[1.75]">
          Experience unmatched comfort during your workday with WhisperLite scrubs from <strong>Dev Egypt</strong>, Designed for healthcare professionals who prioritize lightweight, breathable fabric, these scrubs offer exceptional comfort without compromising on style.
        </p>
        <p className="text-[16px] leading-[1.75]">
          Made from advanced materials, these <strong>lightweight scrubs</strong>, are easy to wear and keep you cool and comfortable throughout your shift. They are flexible and durable, moving with you without restricting movement, ensuring long-term use. Available in a variety of stylish designs and colors to suit every preference, these scrubs also include functional details like multiple pockets and adjustable closures for added convenience.
        </p>
        <p className="text-[16px] leading-[1.75]">
          Why Choose WhisperLite Scrubs? These scrubs are the perfect choice for healthcare professionals seeking comfort and functionality. Whether <strong>you're a nurse</strong>, doctor, or medical student, these scrubs provide the ideal blend of performance and style to meet your needs.
        </p>
        <p className="text-[16px] leading-[1.75]">
          Browse our selection of WhisperLite tops and pants, available in a range of sizes for both men and women and find your perfect fit today at Dev Egypt. Enjoy comfort and style with every shift.
        </p>
      </section>
      

      {/* Links container near bottom */}
      <div className="w-full flex justify-center">
        <div className="w-[1400px]" />
      </div>
    </div>
    </MainLayout>
  );
}
