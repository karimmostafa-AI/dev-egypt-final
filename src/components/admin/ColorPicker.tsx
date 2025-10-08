// Color Picker Component for Admin Interface
// Provides color selection with predefined palette and custom color picker

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

export interface ColorOption {
  id: string;
  name: string;
  hexCode: string;
  category?: string;
  isCustom?: boolean;
}

export interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  allowCustom?: boolean;
  predefinedColors?: ColorOption[];
  showHexInput?: boolean;
  className?: string;
  disabled?: boolean;
}

interface ColorResult {
  hex: string;
  name?: string;
  source: 'picker' | 'predefined' | 'custom';
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  value = '#000000',
  onChange,
  allowCustom = true,
  predefinedColors = [],
  showHexInput = true,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value);
  const [customColorName, setCustomColorName] = useState('');
  const [activeTab, setActiveTab] = useState<'predefined' | 'custom'>('predefined');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Default color palette if none provided
  const defaultColors: ColorOption[] = [
    { id: 'navy-blue', name: 'Navy Blue', hexCode: '#1e3a8a', category: 'blue' },
    { id: 'royal-blue', name: 'Royal Blue', hexCode: '#2563eb', category: 'blue' },
    { id: 'sky-blue', name: 'Sky Blue', hexCode: '#0ea5e9', category: 'blue' },
    { id: 'white', name: 'White', hexCode: '#ffffff', category: 'neutral' },
    { id: 'black', name: 'Black', hexCode: '#000000', category: 'neutral' },
    { id: 'gray', name: 'Gray', hexCode: '#6b7280', category: 'neutral' },
    { id: 'red', name: 'Red', hexCode: '#dc2626', category: 'red' },
    { id: 'green', name: 'Green', hexCode: '#16a34a', category: 'green' },
    { id: 'yellow', name: 'Yellow', hexCode: '#eab308', category: 'yellow' },
    { id: 'purple', name: 'Purple', hexCode: '#9333ea', category: 'purple' },
    { id: 'pink', name: 'Pink', hexCode: '#ec4899', category: 'pink' },
    { id: 'orange', name: 'Orange', hexCode: '#f97316', category: 'orange' },
    { id: 'brown', name: 'Brown', hexCode: '#92400e', category: 'brown' },
    { id: 'beige', name: 'Beige', hexCode: '#f5f5dc', category: 'neutral' },
    { id: 'cream', name: 'Cream', hexCode: '#fef7ed', category: 'neutral' }
  ];

  const colors = predefinedColors.length > 0 ? predefinedColors : defaultColors;

  // Group colors by category
  const colorsByCategory = colors.reduce((acc, color) => {
    const category = color.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(color);
    return acc;
  }, {} as Record<string, ColorOption[]>);

  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleColorSelect = useCallback((color: string, source: ColorResult['source']) => {
    setCurrentColor(color);
    onChange(color);
    if (source === 'predefined') {
      setIsOpen(false);
    }
  }, [onChange]);

  const handleCustomColorChange = useCallback((color: string) => {
    setCurrentColor(color);
    onChange(color);
  }, [onChange]);

  const handleHexInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex)) {
      setCurrentColor(hex);
      onChange(hex);
    }
  }, [onChange]);

  const validateColorContrast = useCallback((hexColor: string): boolean => {
    // Simple contrast validation - in production, use a proper contrast calculation
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5; // Light background, dark text
  }, []);

  const suggestAccessibleColors = useCallback((baseColor: string): string[] => {
    // Simple color suggestions - in production, use a more sophisticated algorithm
    const suggestions = [
      '#000000', // Black
      '#ffffff', // White
      '#2563eb', // Blue
      '#dc2626', // Red
      '#16a34a', // Green
    ];

    return suggestions.filter(color => validateColorContrast(color));
  }, [validateColorContrast]);

  if (disabled) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div
          className="w-8 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-sm text-gray-500">{currentColor}</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Color Display Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Open color picker"
      >
        <div
          className="w-8 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: currentColor }}
        />
        <span className="text-sm font-mono">{currentColor}</span>
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('predefined')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'predefined'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Predefined
            </button>
            {allowCustom && (
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`flex-1 px-4 py-2 text-sm font-medium ${
                  activeTab === 'custom'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === 'predefined' && (
              <div className="space-y-4">
                {/* Colors by Category */}
                {Object.entries(colorsByCategory).map(([category, categoryColors]) => (
                  <div key={category}>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                      {category}
                    </h4>
                    <div className="grid grid-cols-7 gap-2">
                      {categoryColors.map((color) => (
                        <button
                          key={color.id}
                          type="button"
                          onClick={() => handleColorSelect(color.hexCode, 'predefined')}
                          className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                            currentColor === color.hexCode
                              ? 'border-gray-800'
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color.hexCode }}
                          title={color.name}
                          aria-label={`Select ${color.name}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Accessibility Suggestions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Accessible Colors
                  </h4>
                  <div className="grid grid-cols-7 gap-2">
                    {suggestAccessibleColors(currentColor).map((color, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleColorSelect(color, 'predefined')}
                        className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                          currentColor === color
                            ? 'border-gray-800'
                            : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={`Accessible color ${color}`}
                        aria-label={`Select accessible color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'custom' && allowCustom && (
              <div className="space-y-4">
                {/* Color Picker */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Pick a Color
                  </h4>
                  <div className="flex justify-center">
                    <HexColorPicker
                      color={currentColor}
                      onChange={handleCustomColorChange}
                    />
                  </div>
                </div>

                {/* Custom Color Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={customColorName}
                    onChange={(e) => setCustomColorName(e.target.value)}
                    placeholder="e.g., Ocean Blue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Hex Input */}
                {showHexInput && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hex Color
                    </label>
                    <input
                      type="text"
                      value={currentColor}
                      onChange={handleHexInputChange}
                      pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
                      placeholder="#000000"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* Contrast Validation */}
                <div className="text-xs text-gray-600">
                  <span className={validateColorContrast(currentColor) ? 'text-green-600' : 'text-red-600'}>
                    {validateColorContrast(currentColor)
                      ? '✓ Good contrast for accessibility'
                      : '⚠ Consider a different color for better accessibility'
                    }
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center p-4 border-t border-gray-200">
            <div className="flex items-center space-x-2">
              <div
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: currentColor }}
              />
              <span className="text-sm font-mono">{currentColor}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;