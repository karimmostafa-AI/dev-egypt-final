import { useState } from 'react';
import ColorSwatch from './ColorSwatch';
import type { ColorOption } from '@/types/product-catalog';

// Example color data
const exampleColors: ColorOption[] = [
  { name: 'Crimson Red', hex: '#DC143C', imageUrl: '/red.jpg' },
  { name: 'Ocean Blue', hex: '#006994', imageUrl: '/blue.jpg' },
  { name: 'Forest Green', hex: '#228B22', imageUrl: '/green.jpg' },
  { name: 'Sunset Orange', hex: '#FF8C00', imageUrl: '/orange.jpg' },
  { name: 'Royal Purple', hex: '#7851A9', imageUrl: '/purple.jpg' },
  { name: 'Golden Yellow', hex: '#FFD700', imageUrl: '/yellow.jpg' },
  { name: 'Hot Pink', hex: '#FF69B4', imageUrl: '/pink.jpg' },
  { name: 'Charcoal Gray', hex: '#36454F', imageUrl: '/gray.jpg' },
  { name: 'Pure White', hex: '#FFFFFF', imageUrl: '/white.jpg' },
  { name: 'Midnight Black', hex: '#000000', imageUrl: '/black.jpg' },
  { name: 'Coral Pink', hex: '#FF7F7F', imageUrl: '/coral.jpg' },
  { name: 'Teal Blue', hex: '#008080', imageUrl: '/teal.jpg' },
];

const ColorSwatchExample = () => {
  const [selectedColor, setSelectedColor] = useState<string>('Crimson Red');

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          ColorSwatch Component Examples
        </h1>

        {/* Basic Example */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Basic Color Swatches</h2>
          <p className="text-gray-600 mb-4">
            Selected color: <span className="font-medium">{selectedColor}</span>
          </p>
          <ColorSwatch
            colors={exampleColors.slice(0, 5)}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </div>

        {/* Many Colors Example */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Many Colors (with +X more indicator)</h2>
          <p className="text-gray-600 mb-4">
            Shows first 8 colors with "+X more" indicator for remaining colors
          </p>
          <ColorSwatch
            colors={exampleColors}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            maxVisible={8}
          />
        </div>

        {/* Custom Max Visible */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Custom Max Visible (5 colors)</h2>
          <p className="text-gray-600 mb-4">
            Limited to showing only 5 colors with custom maxVisible prop
          </p>
          <ColorSwatch
            colors={exampleColors}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
            maxVisible={5}
          />
        </div>

        {/* Single Color */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Single Color</h2>
          <p className="text-gray-600 mb-4">
            Product with only one color option
          </p>
          <ColorSwatch
            colors={[exampleColors[0]]}
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </div>

        {/* No Colors */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">No Colors Available</h2>
          <p className="text-gray-600 mb-4">
            When no colors are provided, the component renders nothing
          </p>
          <div className="border-2 border-dashed border-gray-300 p-4 rounded">
            <ColorSwatch
              colors={[]}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
            <p className="text-gray-500 text-sm">
              (Component renders nothing when colors array is empty)
            </p>
          </div>
        </div>

        {/* Interactive Demo */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Interactive Demo</h2>
          <p className="text-gray-600 mb-4">
            Click on colors to select them, hover for tooltips
          </p>
          <div className="space-y-4">
            <ColorSwatch
              colors={exampleColors}
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />
            
            {/* Selected Color Display */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
              <div
                className="w-12 h-12 rounded-full border-2 border-gray-300"
                style={{ 
                  backgroundColor: exampleColors.find(c => c.name === selectedColor)?.hex || '#000000' 
                }}
              />
              <div>
                <p className="font-medium">{selectedColor}</p>
                <p className="text-sm text-gray-600">
                  {exampleColors.find(c => c.name === selectedColor)?.hex}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Component Features</h2>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Circular color swatches with hover effects
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Tooltips showing color names on hover
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Click handling to change product images
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              "+X more" indicator for products with many colors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Configurable maximum visible colors
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Accessibility support with ARIA labels
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Keyboard focus management
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Responsive design with proper scaling
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ColorSwatchExample;