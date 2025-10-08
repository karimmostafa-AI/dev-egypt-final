import { Metadata } from 'next';
 import RegisterPage from'./RegisterPage';

export const metadata: Metadata = {
  title: 'Create Account | Join - Dev Egypt Registration',
  description: 'Create your Dev Egypt account to access exclusive deals on medical scrubs, nursing uniforms, and professional healthcare apparel. Join thousands of healthcare professionals today.',
  keywords: 'create account, register, Dev Egypt, medical scrubs, nursing uniforms, healthcare apparel, professional uniforms, account registration, sign up',
  
  openGraph: {
    title: 'Create Account | Join - Dev Egypt Registration',
    description: 'Join Dev Egypt today! Create your account to access exclusive deals on premium medical scrubs and nursing uniforms. Easy registration process with exclusive member benefits.',
  }
}

export default function Page() {
  return <RegisterPage />
}