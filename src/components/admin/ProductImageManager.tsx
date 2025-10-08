"use client"

import React, { useState, useCallback, useRef } from 'react'
import { Upload, Link, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { createImageService } from '@/lib/image-service'
import { storage, databases } from '@/lib/appwrite'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface ProductImage {
  id: string
  url: string
  source: 'upload' | 'url'
  file?: File
  originalName?: string
}

export interface ProductImageManagerProps {
  onImagesChange?: (mainImage: ProductImage | null, backImage: ProductImage | null) => void
  className?: string
  disabled?: boolean
}

interface ImageUploadState {
  isDragging: boolean
  isDragOver: boolean
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  onImagesChange,
  className = '',
  disabled = false
}) => {
  const [mainImage, setMainImage] = useState<ProductImage | null>(null)
  const [backImage, setBackImage] = useState<ProductImage | null>(null)
  const [mainImageUrl, setMainImageUrl] = useState('')
  const [backImageUrl, setBackImageUrl] = useState('')
  const [dragState, setDragState] = useState<ImageUploadState>({ isDragging: false, isDragOver: false })
  const [isUploading, setIsUploading] = useState(false)

  const mainFileInputRef = useRef<HTMLInputElement>(null)
  const backFileInputRef = useRef<HTMLInputElement>(null)
  const mainDropZoneRef = useRef<HTMLDivElement>(null)
  const backDropZoneRef = useRef<HTMLDivElement>(null)

  // Initialize image service
  const imageService = React.useMemo(() => {
    return createImageService(storage, databases)
  }, [])

  // Notify parent component of changes
  React.useEffect(() => {
    onImagesChange?.(mainImage, backImage)
  }, [mainImage, backImage, onImagesChange])

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent, isMain: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setDragState({ isDragging: true, isDragOver: true })
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent, dropZoneRef: React.RefObject<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = dropZoneRef.current?.getBoundingClientRect()
    if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      setDragState({ isDragging: false, isDragOver: false })
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, isMain: boolean) => {
    e.preventDefault()
    e.stopPropagation()

    setDragState({ isDragging: false, isDragOver: false })

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    await handleFiles(files, isMain)
  }, [disabled])

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isMain: boolean) => {
    const files = Array.from(e.target.files || [])
    await handleFiles(files, isMain)

    // Reset file input
    if (e.target) {
      e.target.value = ''
    }
  }, [])

  // Process uploaded files
  const handleFiles = useCallback(async (files: File[], isMain: boolean) => {
    if (disabled || files.length === 0) return

    const file = files[0] // Only take first file

    // Validate file type
    const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif']
    if (!acceptedTypes.includes(file.type)) {
      alert(`${file.name} is not a supported file type. Please use JPEG, PNG, WebP, or AVIF.`)
      return
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024
    if (file.size > maxFileSize) {
      alert(`${file.name} exceeds maximum file size of 10MB.`)
      return
    }

    setIsUploading(true)

    try {
      // Upload file using the image service
      const uploadResult = await imageService.uploadFromFile(file, {
        folder: 'products/temp',
        generateThumbnails: false,
        quality: 80,
        format: 'webp'
      })

      const newImage: ProductImage = {
        id: uploadResult.id,
        url: uploadResult.url,
        source: 'upload',
        file: file,
        originalName: file.name
      }

      if (isMain) {
        setMainImage(newImage)
      } else {
        setBackImage(newImage)
      }
    } catch (error) {
      console.error('Error uploading image:', error)

      // Fallback to blob URL if server upload fails
      try {
        const imageId = `img_${Date.now()}_${isMain ? 'main' : 'back'}`
        const imageUrl = URL.createObjectURL(file)

        const newImage: ProductImage = {
          id: imageId,
          url: imageUrl,
          source: 'upload',
          file: file,
          originalName: file.name
        }

        if (isMain) {
          setMainImage(newImage)
        } else {
          setBackImage(newImage)
        }
      } catch (fallbackError) {
        console.error('Error creating fallback blob URL:', fallbackError)
        alert('Failed to process image')
      }
    } finally {
      setIsUploading(false)
    }
  }, [disabled])

  // Handle URL input
  const handleUrlSubmit = useCallback((url: string, isMain: boolean) => {
    if (!url.trim()) return

    // Basic URL validation
    try {
      new URL(url)
    } catch {
      alert('Please enter a valid URL')
      return
    }

    const imageId = `img_${Date.now()}_${isMain ? 'main' : 'back'}_${Math.random().toString(36).substr(2, 9)}`

    const newImage: ProductImage = {
      id: imageId,
      url: url.trim(),
      source: 'url'
    }

    if (isMain) {
      setMainImage(newImage)
      setMainImageUrl('')
    } else {
      setBackImage(newImage)
      setBackImageUrl('')
    }
  }, [])

  // Delete image
  const handleDeleteImage = useCallback((isMain: boolean) => {
    if (isMain) {
      setMainImage(null)
    } else {
      setBackImage(null)
    }
  }, [])

  // Image preview component
  const ImagePreview = ({ image, isMain }: { image: ProductImage; isMain: boolean }) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleImageLoad = useCallback(() => {
      setIsLoading(false)
    }, [])

    const handleImageError = useCallback(() => {
      setIsLoading(false)
      setHasError(true)
    }, [])

    return (
      <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="aspect-square bg-gray-100 relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Failed to load</p>
              </div>
            </div>
          ) : (
            <img
              src={image.url}
              alt={isMain ? 'Main view' : 'Back view'}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}

          {/* Delete button */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteImage(isMain)}
              disabled={disabled}
              className="shadow-lg"
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>

          {/* Image source indicator */}
          <div className="absolute top-2 right-2">
            <div className={`px-2 py-1 text-xs font-medium rounded-full ${
              image.source === 'upload'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {image.source === 'upload' ? 'Uploaded' : 'URL'}
            </div>
          </div>
        </div>

        {/* Image info */}
        <div className="p-3 bg-gray-50">
          <p className="text-sm font-medium text-gray-900">
            {isMain ? 'Main View' : 'Back View'}
          </p>
          {image.originalName && (
            <p className="text-xs text-gray-500 truncate" title={image.originalName}>
              {image.originalName}
            </p>
          )}
          {image.source === 'url' && (
            <p className="text-xs text-gray-500 truncate" title={image.url}>
              {image.url}
            </p>
          )}
        </div>
      </div>
    )
  }

  // Drop zone component
  const DropZone = ({ isMain }: { isMain: boolean }) => {
    const dropZoneRef = isMain ? mainDropZoneRef : backDropZoneRef
    const fileInputRef = isMain ? mainFileInputRef : backFileInputRef
    const currentImage = isMain ? mainImage : backImage

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">
            {isMain ? 'Main View Image *' : 'Back View Image *'}
          </Label>
          {currentImage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleDeleteImage(isMain)}
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-1" />
              Remove
            </Button>
          )}
        </div>

        {currentImage ? (
          <ImagePreview image={currentImage} isMain={isMain} />
        ) : (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                Image URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div
                ref={dropZoneRef}
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragState.isDragOver
                    ? 'border-blue-500 bg-blue-50'
                    : disabled
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={(e) => handleDragEnter(e, isMain)}
                onDragLeave={(e) => {
                  const rect = dropZoneRef.current?.getBoundingClientRect()
                  if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
                    setDragState({ isDragging: false, isDragOver: false })
                  }
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, isMain)}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/avif"
                  onChange={(e) => handleFileSelect(e, isMain)}
                  disabled={disabled || isUploading}
                  className="hidden"
                />

                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 text-gray-400">
                    <ImageIcon className="w-full h-full" />
                  </div>

                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isUploading ? 'Processing image...' : 'Drop image here or click to browse'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Supports: JPEG, PNG, WebP, AVIF up to 10MB
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isUploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Select Image
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor={`${isMain ? 'main' : 'back'}-image-url`}>
                        Image URL
                      </Label>
                      <Input
                        id={`${isMain ? 'main' : 'back'}-image-url`}
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        value={isMain ? mainImageUrl : backImageUrl}
                        onChange={(e) => isMain ? setMainImageUrl(e.target.value) : setBackImageUrl(e.target.value)}
                        disabled={disabled}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter the full URL of the image (must be accessible from the internet)
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleUrlSubmit(isMain ? mainImageUrl : backImageUrl, isMain)}
                      disabled={disabled || !mainImageUrl.trim()}
                      className="w-full"
                    >
                      <Link className="w-4 h-4 mr-2" />
                      Use This URL
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    )
  }

  const hasBothImages = mainImage && backImage

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DropZone isMain={true} />
        <DropZone isMain={false} />
      </div>

      {!hasBothImages && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Both main view and back view images are required for the product.
          </AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900">Image Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Main view: Front-facing product image (primary display image)</li>
            <li>• Back view: Rear view of the product for detail reference</li>
            <li>• Use high-quality images (at least 800x800px recommended)</li>
            <li>• Ensure good lighting and clear focus</li>
            <li>• Images should show the product clearly from the specified angle</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProductImageManager