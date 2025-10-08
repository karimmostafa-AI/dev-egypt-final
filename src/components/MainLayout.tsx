'use client';

import Nav from '../../components/nav';
import Footer from '../../components/footer';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
