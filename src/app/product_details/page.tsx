import { Metadata } from 'next';
 import ProductPage from'./ProductPage';

export const metadata: Metadata = {
  title: 'Butter-Soft STRETCH Men\'s 4-Pocket V-Neck Scrub Top - Royal Blue Medical Scrubs',
  description: 'Shop the Butter-Soft STRETCH Men\'s 4-Pocket V-Neck Scrub Top in Royal Blue. Premium medical scrubs with 4 pockets, classic fit, and 2-way stretch comfort fabric. Sale price from $11.91 - $25.64.',
  keywords: 'medical scrubs, men\'s scrub top, v-neck scrubs, butter soft stretch, royal blue scrubs, 4-pocket scrub top, healthcare uniforms, medical apparel',
  
  openGraph: {
    title: 'Butter-Soft STRETCH Men\'s 4-Pocket V-Neck Scrub Top - Royal Blue Medical Scrubs',
    description: 'Premium medical scrubs with 4 pockets, classic fit, and 2-way stretch comfort fabric. Sale price from $11.91 - $25.64 with customer reviews.',
  }
}

export default function Page() {
  return <ProductPage />
}