'use client';

import { useState } from 'react';
import Link from 'next/link';
import MainLayout from '../../components/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage('Email address is required');
      setSubmitStatus('error');
      return;
    }

    if (!validateEmail(email)) {
      setErrorMessage('Please enter a valid email address');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Use the auth service to send password reset email
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitStatus('success');
      } else {
        setErrorMessage(data.error || 'Failed to send reset email. Please try again.');
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error sending reset email:', error);
      setErrorMessage('Failed to send reset email. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (submitStatus === 'error') {
      setSubmitStatus('idle');
      setErrorMessage('');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-[#173a6a] rounded-full flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
            <p className="text-gray-600">
              No worries! Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {submitStatus === 'success' ? (
              /* Success State */
              <div className="text-center">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <span className="font-medium text-[#173a6a]">{email}</span>
                </p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Didn't receive the email?</strong> Check your spam folder or try again with a different email address.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSubmitStatus('idle');
                      setEmail('');
                    }}
                    className="w-full bg-[#173a6a] text-white py-3 px-4 rounded-lg hover:bg-[#1e4a7a] transition-colors font-medium"
                  >
                    Send Another Email
                  </button>
                  <Link
                    href="/login"
                    className="w-full inline-flex justify-center items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] transition-colors ${
                      submitStatus === 'error' ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter your email address"
                    disabled={isSubmitting}
                  />
                  {submitStatus === 'error' && errorMessage && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      {errorMessage}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full bg-[#173a6a] text-white py-3 px-4 rounded-lg hover:bg-[#1e4a7a] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Send Reset Link
                    </>
                  )}
                </button>

                {/* Additional Info */}
                <div className="text-center text-sm text-gray-600">
                  <p>
                    Remember your password?{' '}
                    <Link href="/login" className="text-[#173a6a] hover:text-[#1e4a7a] font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>

          {/* Help Section */}
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 mb-4">
              If you're having trouble accessing your account, our customer support team is here to help.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-[#173a6a] hover:text-[#1e4a7a] font-medium text-sm"
            >
              Contact Support →
            </Link>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}