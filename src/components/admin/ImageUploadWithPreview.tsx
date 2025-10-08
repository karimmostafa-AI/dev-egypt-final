// Image Upload Component with Preview
// Provides drag-and-drop image upload with preview and optimization

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { UploadResult, createImageService } from '@/lib/image-service';
import { storage, databases, DATABASE_ID } from '@/lib/appwrite';

export interface ImageUploadWithPreviewProps {
  productId: string;
  onImagesUploaded?: (images: UploadResult[]) => void;
  onImageDeleted?: (imageId: string) => void;
  maxImages?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  currentImages?: UploadResult[];
  className?: string;
  disabled?: boolean;
}

interface DragState {
  isDragging: boolean;
  isDragOver: boolean;
}

const ImageUploadWithPreview: React.FC<ImageUploadWithPreviewProps> = ({
  productId,
  onImagesUploaded,
  onImageDeleted,
  maxImages = 10,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'],
  maxFileSize = 10,
  currentImages = [],
  className = '',
  disabled = false
}) => {
  const [uploadedImages, setUploadedImages] = useState<UploadResult[]>(currentImages);
  const [dragState, setDragState] = useState<DragState>({ isDragging: false, isDragOver: false });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Initialize image service
  const imageService = React.useMemo(() => {
    return createImageService(storage, databases);
  }, []);

  // Update parent component when images change
  useEffect(() => {
    onImagesUploaded?.(uploadedImages);
  }, [uploadedImages, onImagesUploaded]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragState(prev => ({ ...prev, isDragging: true }));
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only set isDragging to false if we're leaving the drop zone entirely
    const rect = dropZoneRef.current?.getBoundingClientRect();
    if (rect && (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      setDragState(prev => ({ ...prev, isDragging: false, isDragOver: false }));
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setDragState(prev => ({ ...prev, isDragOver: true }));
    }
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDragState({ isDragging: false, isDragOver: false });

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  }, [disabled]);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Process uploaded files
  const handleFiles = useCallback(async (files: File[]) => {
    if (disabled || files.length === 0) return;

    // Validate file count
    const remainingSlots = maxImages - uploadedImages.length;
    if (remainingSlots <= 0) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const validFiles = files.slice(0, remainingSlots);

    // Validate files
    const invalidFiles = validFiles.filter(file => {
      if (!acceptedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported file type`);
        return true;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`${file.name} exceeds maximum file size of ${maxFileSize}MB`);
        return true;
      }
      return false;
    });

    const filesToUpload = validFiles.filter(file => !invalidFiles.includes(file));

    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      const newImages: UploadResult[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        // Update progress
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

        try {
          // Upload using the real image service
          const uploadResult = await imageService.uploadFromFile(file, {
            folder: `products/${productId}`,
            generateThumbnails: true,
            quality: 80,
            format: 'webp'
          });

          // Update progress to completion
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          newImages.push(uploadResult);
        } catch (uploadError) {
          console.error(`Error uploading ${file.name}:`, uploadError);

          // If client-side upload fails, try server-side upload via API
          try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productId', productId);
            formData.append('folder', `products/${productId}`);

            const response = await fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData
            });

            if (response.ok) {
              const serverResult = await response.json();
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
              newImages.push(serverResult);
            } else {
              throw new Error(`Server upload failed: ${response.statusText}`);
            }
          } catch (serverError) {
            console.error(`Server upload also failed for ${file.name}:`, serverError);
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 })); // Mark as error
          }
        }
      }

      // Only add successfully uploaded images
      const successfulUploads = newImages.filter(img => img.id);
      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
      }

      setUploadProgress({});
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload some images');
    } finally {
      setIsUploading(false);
    }
  }, [disabled, maxImages, uploadedImages.length, acceptedTypes, maxFileSize, productId]);

  // Delete image
  const handleDeleteImage = useCallback((imageId: string) => {
    if (disabled) return;

    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
    onImageDeleted?.(imageId);
  }, [disabled, onImageDeleted]);

  // Reorder images (for future implementation)
  const handleReorderImages = useCallback((fromIndex: number, toIndex: number) => {
    if (disabled) return;

    setUploadedImages(prev => {
      const newImages = [...prev];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return newImages;
    });
  }, [disabled]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragState.isDragOver
            ? 'border-blue-500 bg-blue-50'
            : dragState.isDragging
            ? 'border-gray-400 bg-gray-50'
            : disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
          className="hidden"
        />

        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="mx-auto w-12 h-12 text-gray-400">
            <svg
              className="w-full h-full"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? 'Uploading images...' : 'Drop images here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supports: {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to {maxFileSize}MB each
            </p>
            <p className="text-sm text-gray-500">
              {uploadedImages.length}/{maxImages} images uploaded
            </p>
          </div>

          {/* Upload Button */}
          {!isUploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploadedImages.length >= maxImages}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploadedImages.length >= maxImages ? 'Maximum images reached' : 'Select Images'}
            </button>
          )}

          {/* Upload Progress */}
          {isUploading && Object.keys(uploadProgress).length > 0 && (
            <div className="space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600">{progress}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Uploaded Images</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <ImagePreview
                key={image.id}
                image={image}
                index={index}
                onDelete={() => handleDeleteImage(image.id)}
                onMoveUp={index > 0 ? () => handleReorderImages(index, index - 1) : undefined}
                onMoveDown={index < uploadedImages.length - 1 ? () => handleReorderImages(index, index + 1) : undefined}
                disabled={disabled}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">Tips for best results:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use high-quality images (at least 800x800px recommended)</li>
          <li>• Include images from multiple angles</li>
          <li>• Show the product in use when possible</li>
          <li>• Ensure good lighting and clear focus</li>
          <li>• Use consistent styling across all product images</li>
        </ul>
      </div>
    </div>
  );
};

// Image Preview Component
interface ImagePreviewProps {
  image: UploadResult;
  index: number;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  disabled?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  image,
  index,
  onDelete,
  onMoveUp,
  onMoveDown,
  disabled = false
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleImageError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  return (
    <div className="relative group bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          </div>
        )}

        {hasError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs text-gray-500">Failed to load</p>
            </div>
          </div>
        ) : (
          <img
            src={image.url}
            alt={image.originalName}
            className="w-full h-full object-cover"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex space-x-2">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                disabled={disabled}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 disabled:opacity-50"
                title="Move up"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {onMoveDown && (
              <button
                onClick={onMoveDown}
                disabled={disabled}
                className="p-2 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 disabled:opacity-50"
                title="Move down"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}

            <button
              onClick={onDelete}
              disabled={disabled}
              className="p-2 bg-red-600 bg-opacity-90 rounded-full hover:bg-opacity-100 disabled:opacity-50"
              title="Delete image"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white p-2">
          <p className="text-xs truncate" title={image.originalName}>
            {image.originalName}
          </p>
          <p className="text-xs text-gray-300">
            {(image.fileSize / 1024).toFixed(1)}KB
          </p>
        </div>
      </div>

      {/* Image Order Indicator */}
      <div className="absolute top-2 left-2 w-6 h-6 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
        {index + 1}
      </div>
    </div>
  );
};

export default ImageUploadWithPreview;