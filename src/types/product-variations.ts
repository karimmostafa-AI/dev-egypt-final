// Shared type definitions for product variations
// Used across admin and frontend components

export interface ColorOption {
  id: string
  name: string
  hexCode: string
  mainImageUrl: string
  backImageUrl: string
  isActive: boolean
  order: number
}

export interface SizeOption {
  id: string
  name: string
  sku: string
  stock: number
  priceModifier: number
  isActive: boolean
  order: number
}

export interface ProductVariation {
  id: string
  colorId: string
  sizeId: string
  sku: string
  stock: number
  price: number
  mainImageUrl: string
  backImageUrl: string
  isActive: boolean
}

export interface ImageUploadState {
  id: string
  url: string
  source: 'device' | 'url'
  file?: File
  originalName?: string
}
