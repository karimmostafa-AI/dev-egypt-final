'use client';

import { useState } from 'react';
import { Share2, Facebook, Twitter, Instagram, Link2, Mail, MessageCircle, Copy, Check } from 'lucide-react';

interface SocialShareProps {
  productName: string;
  productUrl: string;
  productDescription?: string;
  productImage?: string;
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
  showLabels?: boolean;
}

export default function SocialShare({
  productName,
  productUrl,
  productDescription = '',
  productImage,
  className = '',
  variant = 'horizontal',
  showLabels = true
}: SocialShareProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const fullUrl = `${baseUrl}${productUrl}`;

  const shareText = `Check out this amazing product: ${productName}`;
  const shareDescription = productDescription || `High-quality ${productName} - Perfect for healthcare professionals`;

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'text-blue-600 hover:text-blue-700',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}&quote=${encodeURIComponent(shareText)}`
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'text-sky-500 hover:text-sky-600',
      bgColor: 'bg-sky-50 hover:bg-sky-100',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'text-gray-700 hover:text-gray-800',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      url: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareDescription}\n\n${fullUrl}`)}`
    },
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'text-green-600 hover:text-green-700',
      bgColor: 'bg-green-50 hover:bg-green-100',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = (platformUrl: string, platformName: string) => {
    if (platformName === 'Email' || platformName === 'WhatsApp') {
      window.location.href = platformUrl;
    } else {
      window.open(platformUrl, '_blank', 'width=600,height=400');
    }
  };

  const containerClasses = {
    horizontal: 'flex items-center gap-2',
    vertical: 'flex flex-col gap-2',
    compact: 'flex items-center gap-1'
  };

  const buttonClasses = {
    horizontal: 'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
    vertical: 'flex items-center gap-2 px-4 py-3 rounded-lg transition-colors w-full',
    compact: 'p-2 rounded-lg transition-colors'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Share Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-colors ${variant === 'compact' ? 'px-3 py-2' : ''}`}
      >
        <Share2 className="h-4 w-4 text-gray-600" />
        {showLabels && variant !== 'compact' && (
          <span className="text-sm font-medium text-gray-700">Share</span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Share Menu */}
          <div className={`absolute ${variant === 'vertical' ? 'top-full left-0 mt-2' : 'top-full right-0 mt-2'} w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20`}>
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Share this product</h3>

              {/* Social Platforms */}
              <div className={containerClasses[variant]}>
                {socialPlatforms.map((platform) => {
                  const Icon = platform.icon;
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleShare(platform.url, platform.name)}
                      className={`${buttonClasses[variant]} ${platform.bgColor} ${platform.color}`}
                      title={`Share on ${platform.name}`}
                    >
                      <Icon className="h-4 w-4" />
                      {showLabels && variant !== 'compact' && (
                        <span className="text-sm font-medium">{platform.name}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Copy Link */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={copyToClipboard}
                  className={`w-full ${buttonClasses[variant]} ${copied ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {showLabels && variant !== 'compact' && (
                        <span className="text-sm font-medium">Copied!</span>
                      )}
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4" />
                      {showLabels && variant !== 'compact' && (
                        <span className="text-sm font-medium">Copy Link</span>
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Product Preview */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  {productImage && (
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      <img
                        src={productImage}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {productName}
                    </h4>
                    <p className="text-xs text-gray-600 truncate">
                      {shareDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Additional hook for native Web Share API (mobile)
export function useWebShare() {
  const share = async (data: {
    title: string;
    text: string;
    url: string;
  }) => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
        return false;
      }
    }
    return false;
  };

  return { share };
}