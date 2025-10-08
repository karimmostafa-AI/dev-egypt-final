// Product Variation Management Interface
// Allows admins to manage product colors, sizes, and variations

import React, { useState, useCallback, useEffect } from 'react';
import ColorPicker, { ColorOption } from './ColorPicker';
import { ProductColor, ProductSize, ProductVariation } from '@/lib/product-variation-service';

export interface ProductVariationManagerProps {
  productId: string;
  initialColors?: ProductColor[];
  initialSizes?: ProductSize[];
  initialVariations?: ProductVariation[];
  onColorsChange?: (colors: ProductColor[]) => void;
  onSizesChange?: (sizes: ProductSize[]) => void;
  onVariationsChange?: (variations: ProductVariation[]) => void;
  className?: string;
}

interface ImageUploadProps {
  onImageUpload: (files: File[]) => Promise<string[]>;
  currentImages?: string[];
  maxImages?: number;
}

const ProductVariationManager: React.FC<ProductVariationManagerProps> = ({
  productId,
  initialColors = [],
  initialSizes = [],
  initialVariations = [],
  onColorsChange,
  onSizesChange,
  onVariationsChange,
  className = ''
}) => {
  const [colors, setColors] = useState<ProductColor[]>(initialColors);
  const [sizes, setSizes] = useState<ProductSize[]>(initialSizes);
  const [variations, setVariations] = useState<ProductVariation[]>(initialVariations);
  const [activeTab, setActiveTab] = useState<'colors' | 'sizes' | 'variations'>('colors');

  // Color Management
  const [newColor, setNewColor] = useState({
    name: '',
    hexCode: '#000000',
    sku: '',
    stock: 0
  });

  // Size Management
  const [newSize, setNewSize] = useState({
    name: '',
    sku: '',
    stock: 0,
    price: 0
  });

  // Notify parent components of changes
  useEffect(() => {
    onColorsChange?.(colors);
  }, [colors, onColorsChange]);

  useEffect(() => {
    onSizesChange?.(sizes);
  }, [sizes, onSizesChange]);

  useEffect(() => {
    onVariationsChange?.(variations);
  }, [variations, onVariationsChange]);

  const handleAddColor = useCallback(() => {
    if (!newColor.name.trim()) return;

    const color: ProductColor = {
      id: `color_${Date.now()}`,
      name: newColor.name.trim(),
      hexCode: newColor.hexCode,
      images: [],
      isActive: true,
      order: colors.length,
      sku: newColor.sku.trim() || undefined,
      stock: newColor.stock
    };

    setColors(prev => [...prev, color]);
    setNewColor({ name: '', hexCode: '#000000', sku: '', stock: 0 });
  }, [newColor, colors.length]);

  const handleUpdateColor = useCallback((colorId: string, updates: Partial<ProductColor>) => {
    setColors(prev => prev.map(color =>
      color.id === colorId ? { ...color, ...updates } : color
    ));
  }, []);

  const handleDeleteColor = useCallback((colorId: string) => {
    setColors(prev => prev.filter(color => color.id !== colorId));
  }, []);

  const handleAddSize = useCallback(() => {
    if (!newSize.name.trim()) return;

    const size: ProductSize = {
      id: `size_${Date.now()}`,
      name: newSize.name.trim(),
      sku: newSize.sku.trim(),
      stock: newSize.stock,
      price: newSize.price > 0 ? newSize.price : undefined,
      isActive: true,
      order: sizes.length
    };

    setSizes(prev => [...prev, size]);
    setNewSize({ name: '', sku: '', stock: 0, price: 0 });
  }, [newSize, sizes.length]);

  const handleUpdateSize = useCallback((sizeId: string, updates: Partial<ProductSize>) => {
    setSizes(prev => prev.map(size =>
      size.id === sizeId ? { ...size, ...updates } : size
    ));
  }, []);

  const handleDeleteSize = useCallback((sizeId: string) => {
    setSizes(prev => prev.filter(size => size.id !== sizeId));
  }, []);

  const generateVariations = useCallback(() => {
    const newVariations: ProductVariation[] = [];

    for (const color of colors.filter(c => c.isActive)) {
      for (const size of sizes.filter(s => s.isActive)) {
        const existingVariation = variations.find(
          v => v.colorId === color.id && v.sizeId === size.id
        );

        if (!existingVariation) {
          newVariations.push({
            id: `var_${color.id}_${size.id}`,
            colorId: color.id,
            sizeId: size.id,
            sku: `${productId}-${color.name.toLowerCase().replace(/\s+/g, '-')}-${size.name.toLowerCase()}`,
            stock: (color.stock || 0) + (size.stock || 0),
            price: size.price,
            images: color.images || [],
            isActive: true
          });
        }
      }
    }

    setVariations(prev => [...prev, ...newVariations]);
  }, [colors, sizes, variations, productId]);

  const handleUpdateVariation = useCallback((variationId: string, updates: Partial<ProductVariation>) => {
    setVariations(prev => prev.map(variation =>
      variation.id === variationId ? { ...variation, ...updates } : variation
    ));
  }, []);

  const handleDeleteVariation = useCallback((variationId: string) => {
    setVariations(prev => prev.filter(variation => variation.id !== variationId));
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'colors', label: 'Colors', count: colors.length },
            { id: 'sizes', label: 'Sizes', count: sizes.length },
            { id: 'variations', label: 'Variations', count: variations.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* Add New Color */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Color</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Name
                  </label>
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Navy Blue"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color Value
                  </label>
                  <ColorPicker
                    value={newColor.hexCode}
                    onChange={(color) => setNewColor(prev => ({ ...prev, hexCode: color }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU (Optional)
                  </label>
                  <input
                    type="text"
                    value={newColor.sku}
                    onChange={(e) => setNewColor(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., NB-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newColor.stock}
                    onChange={(e) => setNewColor(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleAddColor}
                  disabled={!newColor.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Color
                </button>
              </div>
            </div>

            {/* Existing Colors */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Colors</h3>
              {colors.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No colors added yet.</p>
              ) : (
                <div className="space-y-3">
                  {colors.map((color) => (
                    <ColorItem
                      key={color.id}
                      color={color}
                      onUpdate={(updates) => handleUpdateColor(color.id, updates)}
                      onDelete={() => handleDeleteColor(color.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sizes Tab */}
        {activeTab === 'sizes' && (
          <div className="space-y-6">
            {/* Add New Size */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Size</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Size Name
                  </label>
                  <input
                    type="text"
                    value={newSize.name}
                    onChange={(e) => setNewSize(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Small, Medium, Large"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    value={newSize.sku}
                    onChange={(e) => setNewSize(prev => ({ ...prev, sku: e.target.value }))}
                    placeholder="e.g., SZ-S"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    value={newSize.stock}
                    onChange={(e) => setNewSize(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Override (Optional)
                  </label>
                  <input
                    type="number"
                    value={newSize.price}
                    onChange={(e) => setNewSize(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    step="0.01"
                    placeholder="Leave 0 for default"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleAddSize}
                  disabled={!newSize.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Add Size
                </button>
              </div>
            </div>

            {/* Existing Sizes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Sizes</h3>
              {sizes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No sizes added yet.</p>
              ) : (
                <div className="space-y-3">
                  {sizes.map((size) => (
                    <SizeItem
                      key={size.id}
                      size={size}
                      onUpdate={(updates) => handleUpdateSize(size.id, updates)}
                      onDelete={() => handleDeleteSize(size.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Variations Tab */}
        {activeTab === 'variations' && (
          <div className="space-y-6">
            {/* Generate Variations Button */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900">Generate Variations</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Automatically create variations for all color-size combinations
                  </p>
                </div>
                <button
                  onClick={generateVariations}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  Generate Variations
                </button>
              </div>
            </div>

            {/* Existing Variations */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Product Variations</h3>
              {variations.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No variations generated yet.</p>
              ) : (
                <div className="space-y-3">
                  {variations.map((variation) => (
                    <VariationItem
                      key={variation.id}
                      variation={variation}
                      colors={colors}
                      sizes={sizes}
                      onUpdate={(updates) => handleUpdateVariation(variation.id, updates)}
                      onDelete={() => handleDeleteVariation(variation.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Color Item Component
interface ColorItemProps {
  color: ProductColor;
  onUpdate: (updates: Partial<ProductColor>) => void;
  onDelete: () => void;
}

const ColorItem: React.FC<ColorItemProps> = ({ color, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div
          className="w-8 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: color.hexCode }}
        />
        <div>
          <h4 className="font-medium text-gray-900">{color.name}</h4>
          <p className="text-sm text-gray-500 font-mono">{color.hexCode}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Stock: {color.stock || 0}</span>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={color.isActive}
            onChange={(e) => onUpdate({ isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Size Item Component
interface SizeItemProps {
  size: ProductSize;
  onUpdate: (updates: Partial<ProductSize>) => void;
  onDelete: () => void;
}

const SizeItem: React.FC<SizeItemProps> = ({ size, onUpdate, onDelete }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">{size.name}</span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">{size.name}</h4>
          <p className="text-sm text-gray-500">SKU: {size.sku}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Stock: {size.stock}</span>
        {size.price && size.price > 0 && (
          <span className="text-sm text-gray-600">Price: ${size.price}</span>
        )}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={size.isActive}
            onChange={(e) => onUpdate({ isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Variation Item Component
interface VariationItemProps {
  variation: ProductVariation;
  colors: ProductColor[];
  sizes: ProductSize[];
  onUpdate: (updates: Partial<ProductVariation>) => void;
  onDelete: () => void;
}

const VariationItem: React.FC<VariationItemProps> = ({
  variation,
  colors,
  sizes,
  onUpdate,
  onDelete
}) => {
  const color = colors.find(c => c.id === variation.colorId);
  const size = sizes.find(s => s.id === variation.sizeId);

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        {color && (
          <div
            className="w-8 h-8 rounded border-2 border-gray-300"
            style={{ backgroundColor: color.hexCode }}
            title={color.name}
          />
        )}
        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">{size?.name}</span>
        </div>
        <div>
          <h4 className="font-medium text-gray-900">
            {color?.name} - {size?.name}
          </h4>
          <p className="text-sm text-gray-500">SKU: {variation.sku}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-600">Stock: {variation.stock}</span>
        {variation.price && variation.price > 0 && (
          <span className="text-sm text-gray-600">Price: ${variation.price}</span>
        )}
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={variation.isActive}
            onChange={(e) => onUpdate({ isActive: e.target.checked })}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-700">Active</span>
        </label>
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default ProductVariationManager;