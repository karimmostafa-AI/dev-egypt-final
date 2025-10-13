'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Button } from './button'
import { X, ZoomIn, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react'
import { useAccessibility } from '../../lib/accessibility-service'

interface GalleryImage {
  src: string
  alt: string
  color?: string
  isMain?: boolean
  caption?: string
}

interface EnhancedImageGalleryProps {
  images: GalleryImage[]
  selectedColor?: string
  onColorChange?: (color: string) => void
  className?: string
  priority?: boolean
  showThumbnails?: boolean
  maxThumbnails?: number
  enableZoom?: boolean
  enableFullscreen?: boolean
}

interface ImageState {
  isLoading: boolean
  hasError: boolean
  currentIndex: number
  isFullscreen: boolean
  showZoom: boolean
  zoomPosition: { x: number; y: number }
}

export const EnhancedImageGallery: React.FC<EnhancedImageGalleryProps> = ({
  images,
  selectedColor,
  onColorChange,
  className = '',
  priority = false,
  showThumbnails = true,
  maxThumbnails = 5,
  enableZoom = true,
  enableFullscreen = true
}) => {
  const [imageState, setImageState] = useState<ImageState>({
    isLoading: true,
    hasError: false,
    currentIndex: 0,
    isFullscreen: false,
    showZoom: false,
    zoomPosition: { x: 50, y: 50 }
  })

  const imageRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)

  const { setupAccessibleImageGallery, announceToScreenReader } = useAccessibility()

  // Filter images based on selected color or show all
  const displayImages = selectedColor
    ? images.filter(img => img.color === selectedColor || img.isMain)
    : images

  const currentImage = displayImages[imageState.currentIndex] || displayImages[0]

  // Touch handling for mobile swipe
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe && imageState.currentIndex < displayImages.length - 1) {
      handleNext()
    }
    if (isRightSwipe && imageState.currentIndex > 0) {
      handlePrevious()
    }
  }

  // Preload next/previous images for smooth transitions
  useEffect(() => {
    if (displayImages.length > 1) {
      const preloadImages = [
        displayImages[imageState.currentIndex + 1],
        displayImages[imageState.currentIndex - 1]
      ].filter(Boolean)

      preloadImages.forEach(image => {
        if (image) {
          const img = new window.Image()
          img.src = image.src
        }
      })
    }
  }, [imageState.currentIndex, displayImages])

  const handleImageLoad = useCallback(() => {
    setImageState(prev => ({ ...prev, isLoading: false }))
  }, [])

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const imgElement = e.target as HTMLImageElement

    // Use local placeholder as fallback
    try {
      // Generate a simple SVG placeholder directly
      const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
        <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="400" height="600" fill="#f3f4f6"/>
          <rect x="20" y="20" width="360" height="560" fill="none" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,5"/>
          <circle cx="200" cy="250" r="30" fill="none" stroke="#d1d5db" stroke-width="2"/>
          <path d="M170 290h60M170 330h60" stroke="#d1d5db" stroke-width="2"/>
          <text x="200" y="380" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="16">No Image Available</text>
        </svg>
      `)}`

      imgElement.src = placeholderSvg
      setImageState(prev => ({ ...prev, hasError: false, isLoading: false }))
    } catch (error) {
      console.warn('Failed to generate placeholder:', error)
      // Final fallback to error state
      setImageState(prev => ({ ...prev, hasError: true, isLoading: false }))
    }
  }, [])

  const handleThumbnailClick = useCallback((index: number) => {
    setImageState(prev => ({
      ...prev,
      currentIndex: index,
      isLoading: true,
      hasError: false
    }))
  }, [])

  const handlePrevious = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex > 0 ? prev.currentIndex - 1 : displayImages.length - 1,
      isLoading: true
    }))
  }, [displayImages.length])

  const handleNext = useCallback(() => {
    setImageState(prev => ({
      ...prev,
      currentIndex: prev.currentIndex < displayImages.length - 1 ? prev.currentIndex + 1 : 0,
      isLoading: true
    }))
  }, [displayImages.length])

  const toggleFullscreen = useCallback(() => {
    setImageState(prev => ({ ...prev, isFullscreen: !prev.isFullscreen }))
  }, [])

  const handleZoomMove = useCallback((e: React.MouseEvent) => {
    if (!enableZoom || !imageRef.current) return

    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setImageState(prev => ({
      ...prev,
      zoomPosition: { x, y }
    }))
  }, [enableZoom])

  // Generate color thumbnails for color selection
  const colorThumbnails = images
    .filter((img, index, arr) => img.color && arr.findIndex(i => i.color === img.color) === index)
    .slice(0, maxThumbnails)

  // Setup accessibility features
  useEffect(() => {
    if (galleryRef.current) {
      setupAccessibleImageGallery(galleryRef.current)
    }
  }, [setupAccessibleImageGallery])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (imageState.isFullscreen) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            handlePrevious()
            announceToScreenReader(`Viewing image ${imageState.currentIndex} of ${displayImages.length}`)
            break
          case 'ArrowRight':
            e.preventDefault()
            handleNext()
            announceToScreenReader(`Viewing image ${imageState.currentIndex + 2} of ${displayImages.length}`)
            break
          case 'Escape':
            e.preventDefault()
            toggleFullscreen()
            announceToScreenReader('Gallery closed')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [imageState.isFullscreen, handlePrevious, handleNext, toggleFullscreen, announceToScreenReader, displayImages.length])

  if (!currentImage) {
    return (
      <div className={`bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-[3/4] flex items-center justify-center">
          <div className="text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>No image available</p>
          </div>
        </div>
      </div>
    )
  }

  const GalleryContent = () => (
    <div ref={galleryRef} className={`space-y-4 ${className}`} role="region" aria-label="Product image gallery">
      {/* Main Image Display */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        <div
          ref={imageRef}
          className="aspect-[3/4] relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {imageState.isLoading && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse" />
          )}

          {imageState.hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm text-gray-500">Image not available</p>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                width={454}
                height={678}
                priority={priority}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDU0IiBoZWlnaHQ9IjY3OCIgdmlld0JveD0iMCAwIDQ1NCA2NzgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQ1NCIgaGVpZ2h0PSI2NzgiIGZpbGw9IiNmM2Y0ZjYiLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MTQiIGhlaWdodD0iNjM4IiBmaWxsPSJub25lIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iMTAsNSIvPjxjaXJjbGUgY3g9IjIyNyIgY3k9IjMzOSIgcj0iMzAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTE5NyAzMDloNjBNMjMwIDI3OWg2ME0xOTcgMzk5aDYwIiBzdHJva2U9IiNkMWQ1ZGIiIHN0cm9rZS13aWR0aD0iMiIvPjx0ZXh0IHg9IjIyNyIgeT0iMzk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD48L3N2Zz4="
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageState.isLoading ? 'opacity-0' : 'opacity-100'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 454px"
              />

              {/* Zoom Button - Click to zoom instead of hover */}
              {enableZoom && !imageState.hasError && (
                <button
                  onClick={() => setImageState(prev => ({ ...prev, showZoom: !prev.showZoom }))}
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all z-10"
                  aria-label="Zoom image"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              )}

              {/* Zoom Modal - Only shows on click */}
              {imageState.showZoom && enableZoom && (
                <div 
                  className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100]"
                  onClick={() => setImageState(prev => ({ ...prev, showZoom: false }))}
                >
                  <div
                    ref={zoomRef}
                    className="relative w-full h-full max-w-4xl max-h-[90vh] cursor-move"
                    onMouseMove={handleZoomMove}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      backgroundImage: `url(${currentImage.src})`,
                      backgroundPosition: `${imageState.zoomPosition.x}% ${imageState.zoomPosition.y}%`,
                      backgroundSize: '200%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-4 right-4 z-10"
                    onClick={() => setImageState(prev => ({ ...prev, showZoom: false }))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-4 py-2 rounded-full">
                    Click and drag to explore • Click outside to close
                  </div>
                </div>
              )}
            </>
          )}

          {/* Navigation Arrows */}
          {displayImages.length > 1 && !imageState.hasError && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Fullscreen Button */}
          {enableFullscreen && !imageState.hasError && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-2 right-12 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Fullscreen view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              {imageState.currentIndex + 1} / {displayImages.length}
            </div>
          )}

          {/* Image Caption */}
          {currentImage.caption && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2">
              {currentImage.caption}
            </div>
          )}
        </div>
      </div>

      {/* Color Selection Thumbnails */}
      {showThumbnails && colorThumbnails.length > 0 && onColorChange && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Available Colors:</p>
          <div className="grid grid-cols-5 gap-2">
            {colorThumbnails.map((image, index) => (
              <button
                key={`${image.color}-${index}`}
                onClick={() => image.color && onColorChange(image.color)}
                className={`relative bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity border-2 ${
                  selectedColor === image.color
                    ? 'border-blue-600 ring-2 ring-blue-600 ring-opacity-50'
                    : 'border-transparent'
                }`}
                aria-label={`Select ${image.color} color`}
                aria-pressed={selectedColor === image.color}
              >
                <div className="aspect-square">
                  <Image
                    src={image.src}
                    alt={`${image.color} color option`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    priority={priority && index < 4}
                    placeholder="blur"
                    blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IiNmM2Y0ZjYiLz48cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSI0LDIiLz48Y2lyY2xlIGN4PSI0MCIgY3k9IjQwIiByPSIxNSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjEiLz48cGF0aCBkPSJNMzUgMzVoMTBNMzUgNDVoMTAiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSIxIi8+PHRleHQgeD0iNDAiIHk9IjU1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iOCI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+"
                    sizes="80px"
                    onError={(e) => {
                      const imgElement = e.target as HTMLImageElement
                      try {
                        const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
                          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="80" height="80" fill="#f3f4f6"/>
                            <rect x="8" y="8" width="64" height="64" fill="none" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4,2"/>
                            <circle cx="40" cy="40" r="15" fill="none" stroke="#d1d5db" stroke-width="1"/>
                            <path d="M35 35h10M35 45h10" stroke="#d1d5db" stroke-width="1"/>
                            <text x="40" y="55" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="8">No Image</text>
                          </svg>
                        `)}`
                        imgElement.src = placeholderSvg
                      } catch (error) {
                        imgElement.src = '/images/placeholder.svg'
                      }
                    }}
                  />
                </div>
                {image.color && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                    {image.color}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Navigation Dots */}
      {displayImages.length > 1 && (
        <div className="flex justify-center space-x-2">
          {displayImages.map((_, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === imageState.currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <>
      <GalleryContent />

      {/* Fullscreen Modal */}
      {imageState.isFullscreen && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <div className="relative max-w-full max-h-full p-4">
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 z-10"
              onClick={toggleFullscreen}
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="max-w-4xl max-h-full">
              <Image
                src={currentImage.src}
                alt={currentImage.alt}
                width={800}
                height={1200}
                className="max-w-full max-h-full object-contain"
                priority
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjEyMDAiIHZpZXdCb3g9IjAgMCA4MDAgMTIwMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjEyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48cmVjdCB4PSI0MCIgeT0iNDAiIHdpZHRoPSI3MjAiIGhlaWdodD0iMTEyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjQiIHN0cm9rZS1kYXNoYXJyYXk9IjIwLDEwIi8+PGNpcmNsZSBjeD0iNDAwIiBjeT0iNjAwIiByPSI2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZDFkNWRiIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNNDMwIDU0MGgtNjBNMzcwIDU4MGgtNjBNMzMwIDY2MGgtNjAiIHN0cm9rZT0iI2QxZDVkYiIgc3Ryb2tlLXdpZHRoPSI0Ii8+PHRleHQgeD0iNDAwIiB5PSI3NDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzMiI+Tm8gSW1hZ2UgQXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=="
                onError={(e) => {
                  const imgElement = e.target as HTMLImageElement
                  try {
                    const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
                      <svg width="800" height="1200" viewBox="0 0 800 1200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="800" height="1200" fill="#f3f4f6"/>
                        <rect x="40" y="40" width="720" height="1120" fill="none" stroke="#d1d5db" stroke-width="4" stroke-dasharray="20,10"/>
                        <circle cx="400" cy="500" r="60" fill="none" stroke="#d1d5db" stroke-width="4"/>
                        <path d="M370 440h60M370 560h60" stroke="#d1d5db" stroke-width="4"/>
                        <text x="400" y="700" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="32">No Image Available</text>
                      </svg>
                    `)}`
                    imgElement.src = placeholderSvg
                  } catch (error) {
                    imgElement.src = '/images/placeholder.svg'
                  }
                }}
              />
            </div>

            {/* Fullscreen Navigation */}
            {displayImages.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default EnhancedImageGallery