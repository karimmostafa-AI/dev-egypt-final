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

// Predefined color palette
const PREDEFINED_COLORS = [
  { name: 'Black', hexCode: '#000000' },
  { name: 'White', hexCode: '#FFFFFF' },
  { name: 'Red', hexCode: '#DC2626' },
  { name: 'Blue', hexCode: '#2563EB' },
  { name: 'Navy', hexCode: '#1E3A8A' },
  { name: 'Royal Blue', hexCode: '#3B82F6' },
  { name: 'Sky Blue', hexCode: '#0EA5E9' },
  { name: 'Green', hexCode: '#16A34A' },
  { name: 'Yellow', hexCode: '#EAB308' },
  { name: 'Orange', hexCode: '#F97316' },
  { name: 'Purple', hexCode: '#9333EA' },
  { name: 'Pink', hexCode: '#EC4899' },
  { name: 'Gray', hexCode: '#6B7280' },
  { name: 'Brown', hexCode: '#92400E' },
  { name: 'Beige', hexCode: '#F5F5DC' },
  { name: 'Cream', hexCode: '#FEF7ED' },
  { name: 'Teal', hexCode: '#14B8A6' },
  { name: 'Maroon', hexCode: '#991B1B' },
]

export default function ColorSelector({
  selectedColors,
  onColorsChange,
  maxColors = 10
}: ColorSelectorProps) {
  const [customColorName, setCustomColorName] = useState('')
  const [customColorHex, setCustomColorHex] = useState('#000000')
  const [showCustomInput, setShowCustomInput] = useState(false)

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

      {/* Predefined Color Palette */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Colors</CardTitle>
          <CardDescription>
            Select from our color palette or add a custom color
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-6 gap-3">
            {PREDEFINED_COLORS.map((color) => {
              const selected = isColorSelected(color.hexCode)
              return (
                <button
                  key={color.hexCode}
                  type="button"
                  onClick={() => !selected && handleColorSelect(color.name, color.hexCode)}
                  disabled={selected}
                  className={`
                    relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all
                    ${selected 
                      ? 'border-green-500 bg-green-50 cursor-not-allowed opacity-60' 
                      : 'border-gray-200 hover:border-gray-400 hover:shadow-md'
                    }
                  `}
                  title={color.name}
                >
                  <div
                    className="w-12 h-12 rounded-full border-2 border-gray-300 shadow-sm"
                    style={{ backgroundColor: color.hexCode }}
                  />
                  {selected && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className="text-xs font-medium text-center leading-tight">
                    {color.name}
                  </span>
                </button>
              )
            })}
          </div>

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
