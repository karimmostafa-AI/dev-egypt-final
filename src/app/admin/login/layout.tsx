import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Admin Login - Dev-Egypt",
  description: "Admin login page for Dev-Egypt e-commerce platform",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function AdminLoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // This layout overrides the root layout for the login page
  // No Nav or Footer - just the login form
  return <>{children}</>;
}
