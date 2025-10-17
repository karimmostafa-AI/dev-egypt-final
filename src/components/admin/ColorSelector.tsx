"use client"

import React, { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ColorOption } from '@/types/product-variations'

interface ColorSelectorProps {
  selectedColors: ColorOption[]
  onColorsChange: (colors: ColorOption[]) => void
  maxColors?: number
}

// Enhanced predefined color palette with more options
const PREDEFINED_COLORS = [
  // Basic Colors
  { name: 'Black', hexCode: '#000000', category: 'basic' },
  { name: 'White', hexCode: '#FFFFFF', category: 'basic' },
  { name: 'Gray', hexCode: '#6B7280', category: 'basic' },
  { name: 'Light Gray', hexCode: '#F3F4F6', category: 'basic' },
  { name: 'Dark Gray', hexCode: '#374151', category: 'basic' },

  // Red & Pink
  { name: 'Red', hexCode: '#DC2626', category: 'red' },
  { name: 'Dark Red', hexCode: '#991B1B', category: 'red' },
  { name: 'Pink', hexCode: '#EC4899', category: 'red' },
  { name: 'Light Pink', hexCode: '#FBCFE8', category: 'red' },
  { name: 'Rose', hexCode: '#F43F5E', category: 'red' },

  // Blue
  { name: 'Navy', hexCode: '#1E3A8A', category: 'blue' },
  { name: 'Royal Blue', hexCode: '#3B82F6', category: 'blue' },
  { name: 'Sky Blue', hexCode: '#0EA5E9', category: 'blue' },
  { name: 'Light Blue', hexCode: '#DBEAFE', category: 'blue' },
  { name: 'Blue', hexCode: '#2563EB', category: 'blue' },

  // Green
  { name: 'Green', hexCode: '#16A34A', category: 'green' },
  { name: 'Dark Green', hexCode: '#166534', category: 'green' },
  { name: 'Mint', hexCode: '#6EE7B7', category: 'green' },
  { name: 'Olive', hexCode: '#65A30D', category: 'green' },
  { name: 'Teal', hexCode: '#14B8A6', category: 'green' },

  // Yellow & Orange
  { name: 'Yellow', hexCode: '#EAB308', category: 'yellow' },
  { name: 'Orange', hexCode: '#F97316', category: 'yellow' },
  { name: 'Gold', hexCode: '#D97706', category: 'yellow' },
  { name: 'Peach', hexCode: '#FED7AA', category: 'yellow' },
  { name: 'Mustard', hexCode: '#CA8A04', category: 'yellow' },

  // Purple
  { name: 'Purple', hexCode: '#9333EA', category: 'purple' },
  { name: 'Lavender', hexCode: '#C084FC', category: 'purple' },
  { name: 'Violet', hexCode: '#8B5CF6', category: 'purple' },
  { name: 'Indigo', hexCode: '#6366F1', category: 'purple' },

  // Brown & Beige
  { name: 'Brown', hexCode: '#92400E', category: 'brown' },
  { name: 'Beige', hexCode: '#F5F5DC', category: 'brown' },
  { name: 'Cream', hexCode: '#FEF7ED', category: 'brown' },
  { name: 'Tan', hexCode: '#D2B48C', category: 'brown' },
  { name: 'Chocolate', hexCode: '#7C2D12', category: 'brown' },

  // Fashion Colors
  { name: 'Burgundy', hexCode: '#800020', category: 'fashion' },
  { name: 'Emerald', hexCode: '#059669', category: 'fashion' },
  { name: 'Sapphire', hexCode: '#1E40AF', category: 'fashion' },
  { name: 'Coral', hexCode: '#FF6B6B', category: 'fashion' },
  { name: 'Turquoise', hexCode: '#06B6D4', category: 'fashion' },
  { name: 'Magenta', hexCode: '#D946EF', category: 'fashion' },
]

export default function ColorSelector({
  selectedColors,
  onColorsChange,
  maxColors = 10
}: ColorSelectorProps) {
  const [customColorName, setCustomColorName] = useState('')
  const [customColorHex, setCustomColorHex] = useState('#000000')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  // Group colors by category
  const colorsByCategory = PREDEFINED_COLORS.reduce((acc, color) => {
    if (!acc[color.category]) {
      acc[color.category] = []
    }
    acc[color.category].push(color)
    return acc
  }, {} as Record<string, typeof PREDEFINED_COLORS>)

  const categories = [
    { id: 'all', name: 'All Colors', count: PREDEFINED_COLORS.length },
    { id: 'basic', name: 'Basic', count: colorsByCategory.basic?.length || 0 },
    { id: 'red', name: 'Red & Pink', count: colorsByCategory.red?.length || 0 },
    { id: 'blue', name: 'Blue', count: colorsByCategory.blue?.length || 0 },
    { id: 'green', name: 'Green', count: colorsByCategory.green?.length || 0 },
    { id: 'yellow', name: 'Yellow & Orange', count: colorsByCategory.yellow?.length || 0 },
    { id: 'purple', name: 'Purple', count: colorsByCategory.purple?.length || 0 },
    { id: 'brown', name: 'Brown & Beige', count: colorsByCategory.brown?.length || 0 },
    { id: 'fashion', name: 'Fashion', count: colorsByCategory.fashion?.length || 0 },
  ]

  const getFilteredColors = () => {
    if (activeCategory === 'all') {
      return PREDEFINED_COLORS
    }
    return colorsByCategory[activeCategory] || []
  }

  const handleColorSelect = (colorName: string, hexCode: string) => {
    // Check if already selected
    if (selectedColors.some(c => c.hexCode === hexCode)) {
      return
    }

    // Check max limit
    if (selectedColors.length >= maxColors) {
      alert(`Maximum ${maxColors} colors allowed`)
      return
    }

    const newColor: ColorOption = {
      id: `color_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: colorName,
      hexCode: hexCode,
      mainImageUrl: '',
      backImageUrl: '',
      isActive: true,
      order: selectedColors.length + 1
    }

    onColorsChange([...selectedColors, newColor])
  }

  const handleAddCustomColor = () => {
    if (!customColorName.trim()) {
      alert('Please enter a color name')
      return
    }

    if (!customColorHex.match(/^#[0-9A-Fa-f]{6}$/)) {
      alert('Please enter a valid hex color code (e.g., #FF0000)')
      return
    }

    handleColorSelect(customColorName, customColorHex)
    setCustomColorName('')
    setCustomColorHex('#000000')
    setShowCustomInput(false)
  }

  const handleRemoveColor = (colorId: string) => {
    const updatedColors = selectedColors
      .filter(c => c.id !== colorId)
      .map((c, index) => ({ ...c, order: index + 1 }))
    
    onColorsChange(updatedColors)
  }

  const isColorSelected = (hexCode: string) => {
    return selectedColors.some(c => c.hexCode === hexCode)
  }

  return (
    <div className="space-y-4">
      {/* Selected Colors Display */}
      {selectedColors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Selected Colors ({selectedColors.length}/{maxColors})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedColors.map((color) => (
                <div
                  key={color.id}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg border border-gray-200"
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  <span className="text-sm font-medium">{color.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(color.id)}
                    className="ml-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Color Category Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Colors</CardTitle>
          <CardDescription>
            Select from our enhanced color palette or add a custom color
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setActiveCategory(category.id)}
                className={`
                  px-3 py-1 text-xs font-medium rounded-full transition-all
                  ${activeCategory === category.id
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>

          {/* Color Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {getFilteredColors().map((color) => {
              const selected = isColorSelected(color.hexCode)
              return (
                <button
                  key={color.hexCode}
                  type="button"
                  onClick={() => !selected && handleColorSelect(color.name, color.hexCode)}
                  disabled={selected}
                  className={`
                    relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200
                    ${selected
                      ? 'border-green-500 bg-green-50 cursor-not-allowed opacity-75 scale-95'
                      : 'border-gray-200 hover:border-gray-400 hover:shadow-lg hover:scale-105 bg-white'
                    }
                  `}
                  title={`${color.name} (${color.hexCode})`}
                >
                  <div
                    className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-sm ring-2 ring-transparent group-hover:ring-gray-200 transition-all"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  {selected && (
                    <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-sm">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-center leading-tight text-gray-700">
                    {color.name}
                  </span>
                  <div className="text-xs text-gray-500 font-mono">
                    {color.hexCode}
                  </div>
                </button>
              )
            })}
          </div>

          {getFilteredColors().length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No colors in this category
            </div>
          )}

          {/* Custom Color Section */}
          <div className="pt-4 border-t border-gray-200">
            {!showCustomInput ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCustomInput(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Color
              </Button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="customColorName">Color Name</Label>
                    <Input
                      id="customColorName"
                      placeholder="e.g., Forest Green"
                      value={customColorName}
                      onChange={(e) => setCustomColorName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customColorHex">Hex Code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="customColorHex"
                        type="color"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={customColorHex}
                        onChange={(e) => setCustomColorHex(e.target.value)}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleAddCustomColor}
                    className="flex-1"
                  >
                    Add Color
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCustomInput(false)
                      setCustomColorName('')
                      setCustomColorHex('#000000')
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
