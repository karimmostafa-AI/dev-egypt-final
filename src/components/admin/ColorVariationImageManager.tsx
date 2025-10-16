"use client"

import React, { useState, useRef } from 'react'
import { Upload, Link as LinkIcon, X, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ColorOption } from '@/types/product-variations'

interface ColorVariationImageManagerProps {
  colors: ColorOption[]
  onColorImageUpdate: (colorId: string, updates: Partial<ColorOption>) => void
  disabled?: boolean
}

export default function ColorVariationImageManager({
  colors,
  onColorImageUpdate,
  disabled = false
}: ColorVariationImageManagerProps) {
  const [uploadingColor, setUploadingColor] = useState<string | null>(null)
  const [urlInputs, setUrlInputs] = useState<{ [key: string]: { main: string; back: string } }>({})
  
  const fileInputRefs = useRef<{ [key: string]: { main: HTMLInputElement | null; back: HTMLInputElement | null } }>({})

  const handleFileUpload = async (colorId: string, type: 'mainImageUrl' | 'backImageUrl', file: File) => {
    setUploadingColor(colorId)

    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', `${colorId}-${type}-${Date.now()}.${file.name.split('.').pop()}`)
      formData.append('type', type)

      // Upload to server
      const response = await fetch('/api/admin/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        onColorImageUpdate(colorId, {
          [type]: result.url || URL.createObjectURL(file)
        })
      } else {
        // Fallback to blob URL
        onColorImageUpdate(colorId, {
          [type]: URL.createObjectURL(file)
        })
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      // Fallback to blob URL
      onColorImageUpdate(colorId, {
        [type]: URL.createObjectURL(file)
      })
    } finally {
      setUploadingColor(null)
    }
  }

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent, colorId: string, type: 'mainImageUrl' | 'backImageUrl') => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(colorId, type, files[0])
    }
  }

  const handleUrlSubmit = (colorId: string, type: 'mainImageUrl' | 'backImageUrl') => {
    const url = urlInputs[colorId]?.[type === 'mainImageUrl' ? 'main' : 'back']
    
    if (!url?.trim()) {
      alert('Please enter a valid URL')
      return
    }

    try {
      new URL(url)
      onColorImageUpdate(colorId, { [type]: url.trim() })
      
      // Clear input
      setUrlInputs(prev => ({
        ...prev,
        [colorId]: {
          ...prev[colorId],
          [type === 'mainImageUrl' ? 'main' : 'back']: ''
        }
      }))
    } catch {
      alert('Please enter a valid URL')
    }
  }

  const handleRemoveImage = (colorId: string, type: 'mainImageUrl' | 'backImageUrl') => {
    onColorImageUpdate(colorId, { [type]: '' })
  }

  const ImageUploadSection = ({ 
    color, 
    type 
  }: { 
    color: ColorOption; 
    type: 'main' | 'back' 
  }) => {
    const fieldKey = type === 'main' ? 'mainImageUrl' : 'backImageUrl'
    const imageUrl = color[fieldKey]
    const isUploading = uploadingColor === color.id

    if (!fileInputRefs.current[color.id]) {
      fileInputRefs.current[color.id] = { main: null, back: null }
    }

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {type === 'main' ? 'Front View' : 'Back View'} Image *
        </Label>

        {imageUrl ? (
          // Image Preview
          <div className="relative group bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
            <div className="aspect-square bg-gray-100">
              <img
                src={imageUrl}
                alt={`${color.name} - ${type} view`}
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Remove button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveImage(color.id, fieldKey)}
                disabled={disabled}
              >
                <X className="w-4 h-4 mr-1" />
                Remove
              </Button>
            </div>

            {/* Type indicator */}
            <div className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded">
              {type === 'main' ? 'Front' : 'Back'}
            </div>
          </div>
        ) : (
          // Upload Interface
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="mt-3">
              <div
                onClick={() => !disabled && !isUploading && fileInputRefs.current[color.id]?.[type]?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDrop={(e) => !disabled && handleDrop(e, color.id, fieldKey)}
                className={`
                  relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  ${isUploading
                    ? 'border-blue-500 bg-blue-50 scale-105'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:shadow-lg'
                  }
                  ${disabled && 'opacity-50 cursor-not-allowed'}
                  ${!disabled && !isUploading && 'hover:scale-105'}
                `}
              >
                <input
                  ref={(el) => {
                    if (fileInputRefs.current[color.id]) {
                      fileInputRefs.current[color.id][type] = el
                    }
                  }}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload(color.id, fieldKey, file)
                  }}
                  disabled={disabled || isUploading}
                  className="hidden"
                />

                <div className="space-y-3">
                  {isUploading ? (
                    <>
                      <div className="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-sm font-medium text-blue-700">
                        Uploading image...
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-blue-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700">
                          Drop image here or click to browse
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, WebP up to 5MB • Recommended: 800x800px
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Drag overlay */}
                {!isUploading && (
                  <div className="absolute inset-0 border-2 border-blue-500 bg-blue-50 rounded-xl opacity-0 transition-opacity duration-200 pointer-events-none" />
                )}
              </div>
            </TabsContent>

            <TabsContent value="url" className="mt-3">
              <div className="space-y-3">
                <Input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={urlInputs[color.id]?.[type] || ''}
                  onChange={(e) => setUrlInputs(prev => ({
                    ...prev,
                    [color.id]: {
                      ...prev[color.id],
                      [type]: e.target.value
                    }
                  }))}
                  disabled={disabled}
                />
                <Button
                  type="button"
                  onClick={() => handleUrlSubmit(color.id, fieldKey)}
                  disabled={disabled || !urlInputs[color.id]?.[type]?.trim()}
                  className="w-full"
                >
                  Use This URL
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    )
  }

  if (colors.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select colors first before uploading images.
        </AlertDescription>
      </Alert>
    )
  }

  const allColorsHaveImages = colors.every(c => c.mainImageUrl && c.backImageUrl)
  const missingImages = colors.filter(c => !c.mainImageUrl || !c.backImageUrl)

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      {missingImages.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {missingImages.length} color{missingImages.length > 1 ? 's' : ''} still need{missingImages.length === 1 ? 's' : ''} images: {' '}
            <span className="font-medium">
              {missingImages.map(c => c.name).join(', ')}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {allColorsHaveImages && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All colors have both front and back images! ✓
          </AlertDescription>
        </Alert>
      )}

      {/* Color Image Upload Cards */}
      {colors.map((color) => (
        <Card key={color.id}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full border-2 border-gray-300"
                style={{ backgroundColor: color.hexCode }}
              />
              <div>
                <CardTitle>{color.name}</CardTitle>
                <CardDescription className="text-xs">
                  Upload front and back view images for this color
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ImageUploadSection color={color} type="main" />
              <ImageUploadSection color={color} type="back" />
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Guidelines */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900">
            Image Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload high-quality images (minimum 800x800px recommended)</li>
            <li>• Front view: Show the product from the front</li>
            <li>• Back view: Show the product from the back</li>
            <li>• Use consistent lighting across all images</li>
            <li>• Ensure the product color matches the selected color option</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
