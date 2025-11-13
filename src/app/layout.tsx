import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import "../styles/product-card-animations.css";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../context/CartContext";
import { LocationProvider } from "../contexts/LocationContext";
import { ReactQueryProvider } from "../lib/react-query-provider";
import { usePerformanceMonitoring } from "../lib/performance-optimization-service";
import { LiveVisitorTracker } from "@/components/LiveVisitorTracker";

const roboto = Roboto({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Dev Egypt",
  description: "Dev Egypt WhisperLite page",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
        <ReactQueryProvider>
          <AuthProvider>
            <LocationProvider>
              <CartProvider>
                {children}
                <LiveVisitorTracker />
              </CartProvider>
            </LocationProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
