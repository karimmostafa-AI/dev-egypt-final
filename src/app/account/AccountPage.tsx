'use client';
import { useState } from 'react';
import Image from 'next/image';
import BreadCrumb from '../../../components/ui/BreadCrumb';
import Button from '../../../components/ui/Button';
import EditText from '../../../components/ui/EditText';
import CheckBox from '../../../components/ui/CheckBox';
import SearchView from '../../../components/ui/SearchView';
import Line from '../../../components/ui/Line';
import Link from '../../../components/ui/Link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';
import MainLayout from '@/components/MainLayout';

interface CountdownTime {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
}

export default function AccountPage() {
  const router = useRouter()
  const { login, auth } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<CountdownTime>({
    days: '01',
    hours: '03',
    minutes: '16',
    seconds: '46'
  })

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      setError(null)
      await login(email, password)

      // Redirect to home page on successful login
      if (!auth.error) {
        router.push('/')
      }
    } catch (err) {
      setError('Login failed. Please check your credentials and try again.')
    }
  }

  const handleCreateAccount = () => {
    router.push('/register')
  }

  const handleForgotPassword = () => {
    // Handle forgot password logic
  }

  const handleTrackOrder = () => {
    // Handle track order logic
  }

  return (
    <MainLayout>
      <div className="flex flex-col justify-start items-center w-full min-h-screen bg-white">
      
      
      

      {/* Main Content */}
      <main className="w-full max-w-[1520px] mx-auto px-4 py-12">
        <div className="flex flex-col items-center w-full">
          
          {/* Breadcrumb */}
          <BreadCrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Account Login', href: '/account', isActive: true }
            ]}
            className="w-full mb-8"
            variant="default"
            size="default"
          />

          {/* Page Title */}
          <div className="text-center mb-2">
            <h1 className="text-4xl font-medium text-gray-900 mb-2">
              Account Sign in or Join
            </h1>
            <p className="text-base text-gray-900">
              No account, you can still{' '}
              <button
                onClick={handleTrackOrder}
                className="font-normal underline hover:text-gray-700 transition-colors"
              >
                track your order.
              </button>
            </p>
          </div>

          {/* Sign In and Create Account Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-[1200px] mt-12">
            
            {/* Returning Customers - Sign In */}
            <div className="bg-gray-50 rounded p-8">
              <h2 className="text-2xl font-medium text-gray-900 mb-2">
                Returning Customers
              </h2>
              <p className="text-base text-gray-700 mb-6">
                Welcome back! Sign in below.
              </p>

              <div className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">
                    EMAIL *
                  </label>
                  <EditText
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-sm px-3 py-3"
                    fill_background_color="bg-white"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-xs font-bold tracking-widest uppercase text-gray-900 mb-2">
                    PASSWORD *
                  </label>
                  <div className="relative">
                    <EditText
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Show"
                      className="w-full border border-gray-300 rounded-sm px-3 py-3 pr-16"
                      fill_background_color="bg-white"
                      text_color="text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-gray-900 underline"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <CheckBox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    text="Remember Me"
                    text_color="text-gray-700"
                    layout_gap="8px"
                  />
                  <button
                    onClick={handleForgotPassword}
                    className="text-sm text-gray-700 underline hover:text-gray-900 transition-colors"
                  >
                    Forgot Password
                  </button>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-sm text-sm">
                    {error}
                  </div>
                )}

                {/* Sign In Button */}
                <button
                  onClick={handleSignIn}
                  disabled={auth.isLoading}
                  className="w-full bg-black text-white text-sm font-normal tracking-wider uppercase px-8 py-3 border border-black rounded-sm hover:bg-gray-900 transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {auth.isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
              </div>
            </div>

            {/* Create Account */}
            <div className="bg-gray-50 rounded p-8">
              <h2 className="text-2xl font-medium text-gray-900 mb-8">
                Create Account | Join
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Why Create an Account?
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700 ml-4">
                    <li>Track your Order Status 24/7</li>
                    <li>Saved for later feature</li>
                    <li>Exclusive Promotions</li>
                    <li>Express Checkout on your next visit</li>
                    <li>Saved Payment Options</li>
                  </ul>
                </div>

                <button
                  onClick={handleCreateAccount}
                  className="w-full bg-black text-white text-sm font-normal tracking-wider uppercase px-8 py-3 border border-black rounded-sm hover:bg-gray-900 transition-colors"
                >
                  CREATE ACCOUNT
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      

      
    </div>
    </MainLayout>
  )
}
