// Brand Landing Page Editor
// Comprehensive editor for creating and managing brand landing pages

import React, { useState, useCallback, useEffect } from 'react';
import { BrandLandingPage, LandingPageSection, HeroSection } from '@/lib/brand-landing-service';

export interface BrandLandingPageEditorProps {
  brandId: string;
  initialPage?: BrandLandingPage;
  onSave?: (page: BrandLandingPage) => void;
  onPreview?: (page: BrandLandingPage) => void;
  className?: string;
  autoSave?: boolean;
  autoSaveInterval?: number; // in milliseconds
}

interface SectionTemplate {
  type: LandingPageSection['type'];
  name: string;
  description: string;
  icon: string;
  defaultContent: any;
}

const BrandLandingPageEditor: React.FC<BrandLandingPageEditorProps> = ({
  brandId,
  initialPage,
  onSave,
  onPreview,
  className = '',
  autoSave = false,
  autoSaveInterval = 30000
}) => {
  const [page, setPage] = useState<BrandLandingPage>(() => {
    if (initialPage) return initialPage;

    // Default page structure
    return {
      brandId,
      sections: [],
      hero: {
        title: 'Welcome to Our Brand',
        subtitle: 'Discover our premium collection',
        ctaText: 'Shop Now',
        ctaUrl: `/catalog?brand=${brandId}`
      },
      metadata: {
        title: 'Brand Landing Page',
        description: 'Welcome to our brand page',
        viewCount: 0
      },
      isActive: true,
      templateVersion: 'v1'
    };
  });

  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'settings' | 'preview'>('hero');
  const [selectedSection, setSelectedSection] = useState<LandingPageSection | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const interval = setInterval(() => {
      handleSave();
    }, autoSaveInterval);

    return () => clearInterval(interval);
  }, [page, autoSave, autoSaveInterval]);

  // Section templates available for adding
  const sectionTemplates: SectionTemplate[] = [
    {
      type: 'products',
      name: 'Product Grid',
      description: 'Showcase products in a grid layout',
      icon: 'grid',
      defaultContent: {
        productIds: [],
        layout: 'grid',
        columns: 3,
        showFilters: true,
        limit: 12
      }
    },
    {
      type: 'carousel',
      name: 'Image Carousel',
      description: 'Featured images or products in a carousel',
      icon: 'carousel',
      defaultContent: {
        slides: [],
        autoplay: true,
        interval: 5000,
        showDots: true,
        showArrows: true
      }
    },
    {
      type: 'features',
      name: 'Features',
      description: 'Highlight brand features and benefits',
      icon: 'star',
      defaultContent: {
        items: [
          { title: 'Quality', description: 'Premium materials', icon: 'shield' },
          { title: 'Service', description: 'Excellent support', icon: 'support' },
          { title: 'Value', description: 'Great prices', icon: 'price' }
        ],
        layout: 'grid',
        columns: 3
      }
    },
    {
      type: 'testimonial',
      name: 'Testimonials',
      description: 'Customer reviews and testimonials',
      icon: 'quote',
      defaultContent: {
        quotes: [
          { text: 'Great products and service!', author: 'Customer Name', role: 'Verified Buyer' }
        ],
        showRatings: true,
        autoplay: true
      }
    },
    {
      type: 'cta',
      name: 'Call to Action',
      description: 'Encourage visitors to take action',
      icon: 'arrow-right',
      defaultContent: {
        title: 'Ready to get started?',
        description: 'Join thousands of satisfied customers',
        buttonText: 'Get Started',
        buttonUrl: '/contact',
        backgroundColor: '#2563eb',
        textColor: '#ffffff'
      }
    }
  ];

  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    try {
      onSave?.(page);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving page:', error);
    } finally {
      setIsSaving(false);
    }
  }, [page, onSave, isSaving]);

  const handlePreview = useCallback(() => {
    onPreview?.(page);
  }, [page, onPreview]);

  const handleHeroUpdate = useCallback((updates: Partial<HeroSection>) => {
    setPage(prev => ({
      ...prev,
      hero: { ...prev.hero, ...updates }
    }));
  }, []);

  const handleAddSection = useCallback((template: SectionTemplate) => {
    const newSection: LandingPageSection = {
      id: `section_${Date.now()}`,
      type: template.type,
      title: template.name,
      content: template.defaultContent,
      images: [],
      isActive: true,
      order: page.sections.length
    };

    setPage(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
  }, [page.sections.length]);

  const handleUpdateSection = useCallback((sectionId: string, updates: Partial<LandingPageSection>) => {
    setPage(prev => ({
      ...prev,
      sections: prev.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  }, []);

  const handleDeleteSection = useCallback((sectionId: string) => {
    setPage(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));
    if (selectedSection?.id === sectionId) {
      setSelectedSection(null);
    }
  }, [selectedSection]);

  const handleReorderSections = useCallback((fromIndex: number, toIndex: number) => {
    setPage(prev => {
      const newSections = [...prev.sections];
      const [movedSection] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, movedSection);

      // Update order values
      return {
        ...prev,
        sections: newSections.map((section, index) => ({
          ...section,
          order: index
        }))
      };
    });
  }, []);

  const handleMetadataUpdate = useCallback((updates: Partial<BrandLandingPage['metadata']>) => {
    setPage(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates }
    }));
  }, []);

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Brand Landing Page Editor</h2>
            <p className="text-sm text-gray-600 mt-1">Brand ID: {brandId}</p>
          </div>

          <div className="flex items-center space-x-3">
            {lastSaved && (
              <span className="text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleTimeString()}
              </span>
            )}

            <button
              onClick={handlePreview}
              className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50"
            >
              Preview
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          {[
            { id: 'hero', label: 'Hero Section' },
            { id: 'sections', label: 'Page Sections' },
            { id: 'settings', label: 'Settings' },
            { id: 'preview', label: 'Live Preview' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* Hero Section Tab */}
        {activeTab === 'hero' && (
          <HeroSectionEditor
            hero={page.hero}
            onUpdate={handleHeroUpdate}
          />
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <SectionsEditor
            sections={page.sections}
            templates={sectionTemplates}
            selectedSection={selectedSection}
            onSelectSection={setSelectedSection}
            onAddSection={handleAddSection}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onReorderSections={handleReorderSections}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <SettingsEditor
            metadata={page.metadata}
            isActive={page.isActive}
            templateVersion={page.templateVersion}
            onMetadataUpdate={handleMetadataUpdate}
            onUpdate={(updates) => setPage(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <PreviewTab
            page={page}
          />
        )}
      </div>
    </div>
  );
};

// Hero Section Editor Component
interface HeroSectionEditorProps {
  hero: HeroSection;
  onUpdate: (updates: Partial<HeroSection>) => void;
}

const HeroSectionEditor: React.FC<HeroSectionEditorProps> = ({ hero, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hero Section</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={hero.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Welcome to our brand"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              value={hero.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              placeholder="Discover our premium collection"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call to Action Text
            </label>
            <input
              type="text"
              value={hero.ctaText || ''}
              onChange={(e) => onUpdate({ ctaText: e.target.value })}
              placeholder="Shop Now"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call to Action URL
            </label>
            <input
              type="url"
              value={hero.ctaUrl || ''}
              onChange={(e) => onUpdate({ ctaUrl: e.target.value })}
              placeholder="/catalog?brand=brand-slug"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Hero Preview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{hero.title || 'Hero Title'}</h1>
          {hero.subtitle && (
            <p className="text-xl mb-6 opacity-90">{hero.subtitle}</p>
          )}
          {hero.ctaText && hero.ctaUrl && (
            <a
              href={hero.ctaUrl}
              className="inline-block px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {hero.ctaText}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

// Sections Editor Component
interface SectionsEditorProps {
  sections: LandingPageSection[];
  templates: SectionTemplate[];
  selectedSection: LandingPageSection | null;
  onSelectSection: (section: LandingPageSection | null) => void;
  onAddSection: (template: SectionTemplate) => void;
  onUpdateSection: (sectionId: string, updates: Partial<LandingPageSection>) => void;
  onDeleteSection: (sectionId: string) => void;
  onReorderSections: (fromIndex: number, toIndex: number) => void;
}

const SectionsEditor: React.FC<SectionsEditorProps> = ({
  sections,
  templates,
  selectedSection,
  onSelectSection,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onReorderSections
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Available Sections */}
      <div className="lg:col-span-1">
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add Section</h3>
          <div className="space-y-3">
            {templates.map((template) => (
              <button
                key={template.type}
                onClick={() => onAddSection(template)}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">📄</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Sections */}
      <div className="lg:col-span-2">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Page Sections</h3>

          {sections.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No sections added yet.</p>
              <p className="text-sm text-gray-400 mt-1">Add sections from the left panel to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  index={index}
                  isSelected={selectedSection?.id === section.id}
                  onSelect={() => onSelectSection(section)}
                  onUpdate={(updates) => onUpdateSection(section.id, updates)}
                  onDelete={() => onDeleteSection(section.id)}
                  onMoveUp={index > 0 ? () => onReorderSections(index, index - 1) : undefined}
                  onMoveDown={index < sections.length - 1 ? () => onReorderSections(index, index + 1) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Section Item Component
interface SectionItemProps {
  section: LandingPageSection;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<LandingPageSection>) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

const SectionItem: React.FC<SectionItemProps> = ({
  section,
  index,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown
}) => {
  return (
    <div className={`border rounded-lg p-4 ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-600 text-sm">#{index + 1}</span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{section.title}</h4>
            <p className="text-sm text-gray-600 capitalize">{section.type.replace('-', ' ')}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={section.isActive}
              onChange={(e) => onUpdate({ isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>

          <div className="flex space-x-1">
            {onMoveUp && (
              <button
                onClick={onMoveUp}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Move up"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            )}

            {onMoveDown && (
              <button
                onClick={onMoveDown}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Move down"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-600"
            title="Delete section"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Settings Editor Component
interface SettingsEditorProps {
  metadata: BrandLandingPage['metadata'];
  isActive: boolean;
  templateVersion: string;
  onMetadataUpdate: (updates: Partial<BrandLandingPage['metadata']>) => void;
  onUpdate: (updates: Partial<BrandLandingPage>) => void;
}

const SettingsEditor: React.FC<SettingsEditorProps> = ({
  metadata,
  isActive,
  templateVersion,
  onMetadataUpdate,
  onUpdate
}) => {
  return (
    <div className="space-y-6">
      {/* Page Settings */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Page Settings</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Page Title
            </label>
            <input
              type="text"
              value={metadata.title || ''}
              onChange={(e) => onMetadataUpdate({ title: e.target.value })}
              placeholder="Brand Landing Page"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Version
            </label>
            <select
              value={templateVersion}
              onChange={(e) => onUpdate({ templateVersion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="v1">Version 1</option>
              <option value="v2">Version 2</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={metadata.description || ''}
              onChange={(e) => onMetadataUpdate({ description: e.target.value })}
              placeholder="Brief description of the brand page"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => onUpdate({ isActive: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
              Publish Page
            </label>
          </div>
        </div>
      </div>

      {/* Custom CSS */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Custom Styling</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom CSS (Optional)
          </label>
          <textarea
            placeholder="/* Add custom CSS here */"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

// Preview Tab Component
interface PreviewTabProps {
  page: BrandLandingPage;
}

const PreviewTab: React.FC<PreviewTabProps> = ({ page }) => {
  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm font-medium text-yellow-800">
            Preview Mode - This is how your page will look to visitors
          </span>
        </div>
      </div>

      {/* Hero Preview */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">{page.hero.title}</h1>
          {page.hero.subtitle && (
            <p className="text-xl mb-6 opacity-90">{page.hero.subtitle}</p>
          )}
          {page.hero.ctaText && page.hero.ctaUrl && (
            <a
              href={page.hero.ctaUrl}
              className="inline-block px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              {page.hero.ctaText}
            </a>
          )}
        </div>
      </div>

      {/* Sections Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Sections ({page.sections.length})</h3>

        {page.sections.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No sections added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {page.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 text-sm">#{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600 capitalize">{section.type.replace('-', ' ')}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      section.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {section.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandLandingPageEditor;