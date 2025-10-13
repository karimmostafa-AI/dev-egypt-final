'use client'

import React, { useState, useEffect } from 'react'
import { Button } from './button'
import { Card, CardContent } from './card'
import { X, Download, Smartphone } from 'lucide-react'
import { usePWA } from '../../lib/pwa-service'

interface PWAInstallPromptProps {
  className?: string
  variant?: 'banner' | 'button' | 'inline'
  onInstall?: () => void
  onDismiss?: () => void
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  className = '',
  variant = 'banner',
  onInstall,
  onDismiss
}) => {
  const { canInstall, isInstalled, showInstallPrompt } = usePWA()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      setIsDismissed(true)
      return
    }

    // Show prompt after a delay if PWA can be installed
    if (canInstall && !isInstalled && !isDismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000) // Show after 3 seconds

      return () => clearTimeout(timer)
    }
  }, [canInstall, isInstalled, isDismissed])

  const handleInstall = async () => {
    try {
      const success = await showInstallPrompt()
      if (success) {
        setIsVisible(false)
        onInstall?.()
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    localStorage.setItem('pwa-install-dismissed', 'true')
    onDismiss?.()
  }

  if (!canInstall || isInstalled || isDismissed || !isVisible) {
    return null
  }

  if (variant === 'button') {
    return (
      <Button
        onClick={handleInstall}
        className={`flex items-center ${className}`}
        variant="outline"
      >
        <Download className="w-4 h-4 mr-2" />
        Install App
      </Button>
    )
  }

  if (variant === 'inline') {
    return (
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Install our app</p>
                <p className="text-sm text-gray-600">Get quick access from your home screen</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleInstall}>
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default banner variant
  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 ${className}`}>
      <Card className="border-blue-200 bg-blue-50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Install Dev Egypt App</p>
                <p className="text-sm text-gray-600">
                  Get quick access to products and exclusive deals from your home screen
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={handleInstall}>
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PWAInstallPrompt