"use client"

import React, { useState } from 'react'
import { Check, Plus, X, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SizeOption } from '@/types/product-variations'

interface SizeSelectorProps {
  selectedSizes: SizeOption[]
  onSizesChange: (sizes: SizeOption[]) => void
  maxSizes?: number
}

// Predefined size options
const PREDEFINED_SIZES = [
  'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL',
  '28', '30', '32', '34', '36', '38', '40', '42', '44',
  'One Size'
]

export default function SizeSelector({
  selectedSizes,
  onSizesChange,
  maxSizes = 15
}: SizeSelectorProps) {
  const [customSizeName, setCustomSizeName] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [editingSize, setEditingSize] = useState<string | null>(null)
  const [editStock, setEditStock] = useState<number>(0)
  const [editPriceModifier, setEditPriceModifier] = useState<number>(0)

  const handleSizeSelect = (sizeName: string) => {
    // Check if already selected
    if (selectedSizes.some(s => s.name === sizeName)) {
      return
    }

    // Check max limit
    if (selectedSizes.length >= maxSizes) {
      alert(`Maximum ${maxSizes} sizes allowed`)
      return
    }

    const newSize: SizeOption = {
      id: `size_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: sizeName,
      sku: sizeName.toLowerCase().replace(/\s+/g, '-'),
      stock: 10, // Default stock
      priceModifier: 0, // No price modifier by default
      isActive: true,
      order: selectedSizes.length + 1
    }

    onSizesChange([...selectedSizes, newSize])
  }

  const handleAddCustomSize = () => {
    if (!customSizeName.trim()) {
      alert('Please enter a size name')
      return
    }

    handleSizeSelect(customSizeName.trim())
    setCustomSizeName('')
    setShowCustomInput(false)
  }

  const handleRemoveSize = (sizeId: string) => {
    const updatedSizes = selectedSizes
      .filter(s => s.id !== sizeId)
      .map((s, index) => ({ ...s, order: index + 1 }))
    
    onSizesChange(updatedSizes)
  }

  const handleStartEdit = (size: SizeOption) => {
    setEditingSize(size.id)
    setEditStock(size.stock)
    setEditPriceModifier(size.priceModifier)
  }

  const handleSaveEdit = () => {
    if (editingSize) {
      const updatedSizes = selectedSizes.map(s => 
        s.id === editingSize 
          ? { ...s, stock: editStock, priceModifier: editPriceModifier }
          : s
      )
      onSizesChange(updatedSizes)
      setEditingSize(null)
    }
  }

  const handleCancelEdit = () => {
    setEditingSize(null)
    setEditStock(0)
    setEditPriceModifier(0)
  }

  const isSizeSelected = (sizeName: string) => {
    return selectedSizes.some(s => s.name === sizeName)
  }

  return (
    <div className="space-y-4">
      {/* Selected Sizes Display */}
      {selectedSizes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Selected Sizes ({selectedSizes.length}/{maxSizes})
            </CardTitle>
            <CardDescription className="text-xs">
              Click edit icon to set stock quantity and price modifier
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedSizes.map((size) => (
                <div
                  key={size.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  {editingSize === size.id ? (
                    // Edit Mode
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Size</Label>
                        <p className="font-medium">{size.name}</p>
                      </div>
                      <div>
                        <Label htmlFor={`stock-${size.id}`} className="text-xs">Stock</Label>
                        <Input
                          id={`stock-${size.id}`}
                          type="number"
                          min="0"
                          value={editStock}
                          onChange={(e) => setEditStock(parseInt(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`price-${size.id}`} className="text-xs">
                          Price + ($)
                        </Label>
                        <Input
                          id={`price-${size.id}`}
                          type="number"
                          step="0.01"
                          value={editPriceModifier}
                          onChange={(e) => setEditPriceModifier(parseFloat(e.target.value) || 0)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-3 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEdit}
                          className="flex-1"
                        >
                          Save
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-white border-2 border-gray-300 rounded-lg font-bold text-sm">
                          {size.name}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{size.name}</p>
                          <div className="flex gap-3 text-xs text-gray-600">
                            <span>Stock: <span className="font-medium">{size.stock}</span></span>
                            {size.priceModifier !== 0 && (
                              <span>
                                Price: <span className="font-medium">
                                  {size.priceModifier > 0 ? '+' : ''}{size.priceModifier.toFixed(2)}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(size)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Edit size"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(size.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove size"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Predefined Size Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Sizes</CardTitle>
          <CardDescription>
            Select from common sizes or add a custom size
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-6 gap-2">
            {PREDEFINED_SIZES.map((sizeName) => {
              const selected = isSizeSelected(sizeName)
              return (
                <button
                  key={sizeName}
                  type="button"
                  onClick={() => !selected && handleSizeSelect(sizeName)}
                  disabled={selected}
                  className={`
                    relative flex items-center justify-center h-14 rounded-lg border-2 font-medium transition-all
                    ${selected 
                      ? 'border-green-500 bg-green-50 cursor-not-allowed opacity-60' 
                      : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                    }
                  `}
                  title={sizeName}
                >
                  {sizeName}
                  {selected && (
                    <div className="absolute top-0.5 right-0.5 bg-green-500 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Custom Size Section */}
          <div className="pt-4 border-t border-gray-200">
            {!showCustomInput ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomInput(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Size
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="customSizeName">Custom Size Name</Label>
                  <Input
                    id="customSizeName"
                    placeholder="e.g., 3XL, 46, Custom"
                    value={customSizeName}
                    onChange={(e) => setCustomSizeName(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustomSize()
                      }
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="flex-1"
                  >
                    Add Size
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomSizeName('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
