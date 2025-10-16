'use client';

import { useState } from 'react';
import MainLayout from '../../components/MainLayout';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle } from 'lucide-react';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  orderNumber?: string;
}

interface ContactInfo {
  icon: React.ReactNode;
  title: string;
  details: string[];
  description: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    orderNumber: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});

  const contactInfo: ContactInfo[] = [
    {
      icon: <Mail className="h-6 w-6 text-[#173a6a]" />,
      title: 'Email Us',
      details: ['support@deveg.com', 'orders@deveg.com'],
      description: 'Send us an email anytime! We\'ll respond within 24 hours.'
    },
    {
      icon: <Phone className="h-6 w-6 text-[#173a6a]" />,
      title: 'Call Us',
      details: ['+1 (555) 123-4567', '+1 (555) 123-4568'],
      description: 'Mon-Fri from 8am to 6pm EST. Sat from 9am to 4pm EST.'
    },
    {
      icon: <MapPin className="h-6 w-6 text-[#173a6a]" />,
      title: 'Visit Us',
      details: ['123 Medical Drive', 'Healthcare City, HC 12345'],
      description: 'Our showroom is open for in-person shopping and fittings.'
    },
    {
      icon: <Clock className="h-6 w-6 text-[#173a6a]" />,
      title: 'Business Hours',
      details: ['Mon-Fri: 8:00 AM - 6:00 PM', 'Sat: 9:00 AM - 4:00 PM', 'Sun: Closed'],
      description: 'Emergency support available 24/7 for existing customers.'
    }
  ];

  const subjectOptions = [
    'General Inquiry',
    'Product Information',
    'Order Status',
    'Returns & Exchanges',
    'Technical Support',
    'Wholesale Inquiry',
    'Partnership Opportunities',
    'Feedback & Suggestions',
    'Other'
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        orderNumber: ''
      });
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#173a6a] to-[#1e4a7a] text-white">
          <div className="max-w-[1920px] mx-auto px-[50px] py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
              <p className="text-xl text-blue-100 leading-relaxed">
                We're here to help! Get in touch with our customer service team for any questions,
                concerns, or feedback about your medical scrubs and healthcare apparel.
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-[50px] py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Get in Touch</h2>
                <p className="text-gray-600">
                  Choose the most convenient way to reach us. Our team is ready to assist you
                  with anything you need.
                </p>
              </div>

              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {info.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{info.title}</h3>
                        <div className="space-y-1 mb-3">
                          {info.details.map((detail, idx) => (
                            <p key={idx} className="text-sm font-medium text-[#173a6a]">
                              {detail}
                            </p>
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">{info.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* FAQ Link */}
              <div className="mt-8 bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Quick Help</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Before contacting us, you might find the answer you're looking for in our FAQ section.
                </p>
                <a
                  href="/faq"
                  className="inline-flex items-center text-sm font-medium text-[#173a6a] hover:text-[#1e4a7a]"
                >
                  Visit FAQ →
                </a>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-green-800">Message Sent Successfully!</h3>
                      <p className="text-sm text-green-700 mt-1">
                        Thank you for contacting us. We've received your message and will get back to you within 24 hours.
                      </p>
                    </div>
                  </div>
                )}

                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h3 className="font-medium text-red-800">Failed to Send Message</h3>
                    <p className="text-sm text-red-700 mt-1">
                      We're sorry, but there was an error sending your message. Please try again or contact us directly via email.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name and Email Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] ${
                          errors.name ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Enter your full name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] ${
                          errors.email ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  {/* Phone and Order Number Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div>
                      <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        Order Number (if applicable)
                      </label>
                      <input
                        type="text"
                        id="orderNumber"
                        value={formData.orderNumber}
                        onChange={(e) => handleInputChange('orderNumber', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a]"
                        placeholder="e.g., DE-2024-001234"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      id="subject"
                      value={formData.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] ${
                        errors.subject ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Please select a subject</option>
                      {subjectOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-[#173a6a] ${
                        errors.message ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Please describe your question, concern, or feedback in detail..."
                    />
                    {errors.message && (
                      <p className="text-sm text-red-600 mt-1">{errors.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-center justify-between pt-4">
                    <p className="text-sm text-gray-600">
                      We typically respond within 24 hours.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 bg-[#173a6a] text-white px-8 py-3 rounded-lg hover:bg-[#1e4a7a] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Section */}
        <div className="bg-white">
          <div className="max-w-[1920px] mx-auto px-[50px] py-16">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Other Ways We Can Help</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Track Your Order</h3>
                  <p className="text-gray-600 mb-4">
                    Already placed an order? Track your shipment and delivery status.
                  </p>
                  <a
                    href="/track-order"
                    className="inline-flex items-center text-[#173a6a] hover:text-[#1e4a7a] font-medium"
                  >
                    Track Order →
                  </a>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">❓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-600 mb-4">
                    Find quick answers to common questions about our products and services.
                  </p>
                  <a
                    href="/faq"
                    className="inline-flex items-center text-[#173a6a] hover:text-[#1e4a7a] font-medium"
                  >
                    View FAQ →
                  </a>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">💬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat Support</h3>
                  <p className="text-gray-600 mb-4">
                    Chat with our customer service team in real-time during business hours.
                  </p>
                  <button className="inline-flex items-center text-[#173a6a] hover:text-[#1e4a7a] font-medium">
                    Start Chat →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}