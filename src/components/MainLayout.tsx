'use client';

import Nav from '../../components/nav';
import Footer from '../../components/footer';
import PWAInstallPrompt from './ui/PWAInstallPrompt';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
      {/* PWA Install Prompt */}
      <PWAInstallPrompt variant="button" className="fixed bottom-4 right-4 z-50" />
    </>
  );
}
