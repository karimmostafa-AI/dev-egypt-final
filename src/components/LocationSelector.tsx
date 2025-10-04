'use client';

import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, MapPin, RefreshCw } from 'lucide-react';
import { useLocation, LocationData } from '../contexts/LocationContext';

interface CountryOption {
  name: string;
  code: string;
  currency: string;
  flag: string;
}

// Popular countries with their details
const POPULAR_COUNTRIES: CountryOption[] = [
  { name: 'United States', code: 'US', currency: 'USD', flag: '🇺🇸' },
  { name: 'Canada', code: 'CA', currency: 'CAD', flag: '🇨🇦' },
  { name: 'United Kingdom', code: 'GB', currency: 'GBP', flag: '🇬🇧' },
  { name: 'Germany', code: 'DE', currency: 'EUR', flag: '🇩🇪' },
  { name: 'France', code: 'FR', currency: 'EUR', flag: '🇫🇷' },
  { name: 'Japan', code: 'JP', currency: 'JPY', flag: '🇯🇵' },
  { name: 'Australia', code: 'AU', currency: 'AUD', flag: '🇦🇺' },
  { name: 'Brazil', code: 'BR', currency: 'BRL', flag: '🇧🇷' },
  { name: 'India', code: 'IN', currency: 'INR', flag: '🇮🇳' },
  { name: 'China', code: 'CN', currency: 'CNY', flag: '🇨🇳' },
  { name: 'Mexico', code: 'MX', currency: 'MXN', flag: '🇲🇽' },
  { name: 'Egypt', code: 'EG', currency: 'EGP', flag: '🇪🇬' },
];

// All countries with their details (subset for this example)
const ALL_COUNTRIES: CountryOption[] = [
  ...POPULAR_COUNTRIES,
  { name: 'Argentina', code: 'AR', currency: 'ARS', flag: '🇦🇷' },
  { name: 'Austria', code: 'AT', currency: 'EUR', flag: '🇦🇹' },
  { name: 'Belgium', code: 'BE', currency: 'EUR', flag: '🇧🇪' },
  { name: 'Chile', code: 'CL', currency: 'CLP', flag: '🇨🇱' },
  { name: 'Colombia', code: 'CO', currency: 'COP', flag: '🇨🇴' },
  { name: 'Czech Republic', code: 'CZ', currency: 'CZK', flag: '🇨🇿' },
  { name: 'Denmark', code: 'DK', currency: 'DKK', flag: '🇩🇰' },
  { name: 'Finland', code: 'FI', currency: 'EUR', flag: '🇫🇮' },
  { name: 'Hong Kong', code: 'HK', currency: 'HKD', flag: '🇭🇰' },
  { name: 'Hungary', code: 'HU', currency: 'HUF', flag: '🇭🇺' },
  { name: 'Indonesia', code: 'ID', currency: 'IDR', flag: '🇮🇩' },
  { name: 'Ireland', code: 'IE', currency: 'EUR', flag: '🇮🇪' },
  { name: 'Israel', code: 'IL', currency: 'ILS', flag: '🇮🇱' },
  { name: 'Italy', code: 'IT', currency: 'EUR', flag: '🇮🇹' },
  { name: 'South Korea', code: 'KR', currency: 'KRW', flag: '🇰🇷' },
  { name: 'Malaysia', code: 'MY', currency: 'MYR', flag: '🇲🇾' },
  { name: 'Netherlands', code: 'NL', currency: 'EUR', flag: '🇳🇱' },
  { name: 'New Zealand', code: 'NZ', currency: 'NZD', flag: '🇳🇿' },
  { name: 'Norway', code: 'NO', currency: 'NOK', flag: '🇳🇴' },
  { name: 'Peru', code: 'PE', currency: 'PEN', flag: '🇵🇪' },
  { name: 'Philippines', code: 'PH', currency: 'PHP', flag: '🇵🇭' },
  { name: 'Poland', code: 'PL', currency: 'PLN', flag: '🇵🇱' },
  { name: 'Portugal', code: 'PT', currency: 'EUR', flag: '🇵🇹' },
  { name: 'Saudi Arabia', code: 'SA', currency: 'SAR', flag: '🇸🇦' },
  { name: 'Singapore', code: 'SG', currency: 'SGD', flag: '🇸🇬' },
  { name: 'South Africa', code: 'ZA', currency: 'ZAR', flag: '🇿🇦' },
  { name: 'Spain', code: 'ES', currency: 'EUR', flag: '🇪🇸' },
  { name: 'Sweden', code: 'SE', currency: 'SEK', flag: '🇸🇪' },
  { name: 'Switzerland', code: 'CH', currency: 'CHF', flag: '🇨🇭' },
  { name: 'Thailand', code: 'TH', currency: 'THB', flag: '🇹🇭' },
  { name: 'Turkey', code: 'TR', currency: 'TRY', flag: '🇹🇷' },
  { name: 'United Arab Emirates', code: 'AE', currency: 'AED', flag: '🇦🇪' },
  { name: 'Vietnam', code: 'VN', currency: 'VND', flag: '🇻🇳' },
];

interface LocationSelectorProps {
  className?: string;
  compact?: boolean;
}

export default function LocationSelector({ className = '', compact = false }: LocationSelectorProps) {
  const {
    location,
    isLoading,
    error,
    isManualOverride,
    detectionMethod,
    setLocationManually,
    refreshLocation,
  } = useLocation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current country details
  const getCurrentCountry = (): CountryOption | null => {
    if (!location) return null;
    
    return ALL_COUNTRIES.find(
      country => 
        country.code === location.countryCode?.toUpperCase() ||
        country.name === location.country
    ) || null;
  };

  const currentCountry = getCurrentCountry();

  // Filter countries based on search term
  const filteredCountries = ALL_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.currency.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle country selection
  const handleCountrySelect = (country: CountryOption) => {
    const newLocation: LocationData = {
      country: country.name,
      countryCode: country.code,
      currency: country.currency,
    };

    setLocationManually(newLocation);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle auto-detection refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshLocation();
    } catch (error) {
      console.error('Failed to refresh location:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (compact) {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
          ) : currentCountry ? (
            <>
              <span>{currentCountry.flag}</span>
              <span>{currentCountry.code}</span>
            </>
          ) : (
            <>
              <Globe className="w-4 h-4" />
              <span>--</span>
            </>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="p-2">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Popular Countries */}
            {searchTerm === '' && (
              <div className="border-b">
                <p className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50">
                  Popular
                </p>
                {POPULAR_COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                      currentCountry?.code === country.code ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <span>{country.flag}</span>
                    <span className="flex-1 text-left">{country.name}</span>
                    <span className="text-xs text-gray-500">{country.currency}</span>
                  </button>
                ))}
              </div>
            )}

            {/* All Countries */}
            <div>
              {searchTerm === '' && (
                <p className="px-3 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50">
                  All Countries
                </p>
              )}
              {filteredCountries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    currentCountry?.code === country.code ? 'bg-blue-50 text-blue-700' : ''
                  }`}
                >
                  <span>{country.flag}</span>
                  <span className="flex-1 text-left">{country.name}</span>
                  <span className="text-xs text-gray-500">{country.currency}</span>
                </button>
              ))}
            </div>

            {/* Auto-detect option */}
            <div className="border-t p-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Auto-detect location
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Location</h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title="Auto-detect location"
        >
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Location Display */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          {isLoading ? (
            <>
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
              <div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </>
          ) : currentCountry ? (
            <>
              <span className="text-2xl">{currentCountry.flag}</span>
              <div>
                <div className="font-medium text-gray-900">{currentCountry.name}</div>
                <div className="text-sm text-gray-600">
                  Currency: {currentCountry.currency}
                  {location?.city && ` • ${location.city}`}
                </div>
              </div>
            </>
          ) : (
            <>
              <Globe className="w-8 h-8 text-gray-400" />
              <div>
                <div className="font-medium text-gray-900">Location Unknown</div>
                <div className="text-sm text-gray-600">Unable to detect location</div>
              </div>
            </>
          )}
        </div>

        {/* Detection Method Info */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          {isManualOverride ? (
            <span>Manually selected</span>
          ) : detectionMethod === 'browser' ? (
            <span>Detected via browser geolocation</span>
          ) : detectionMethod === 'ip' ? (
            <span>Detected via IP address</span>
          ) : (
            <span>Using default location</span>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Location Selector */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Change Location
        </label>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <div className="flex items-center gap-3">
            {currentCountry ? (
              <>
                <span>{currentCountry.flag}</span>
                <span>{currentCountry.name}</span>
              </>
            ) : (
              <>
                <Globe className="w-5 h-5 text-gray-400" />
                <span className="text-gray-500">Select a country</span>
              </>
            )}
          </div>
          <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-60 overflow-y-auto">
              {/* Popular Countries */}
              {searchTerm === '' && (
                <div className="border-b">
                  <p className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50">
                    Popular Countries
                  </p>
                  {POPULAR_COUNTRIES.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${
                        currentCountry?.code === country.code ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 text-left">{country.name}</span>
                      <span className="text-xs text-gray-500">{country.currency}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* All Countries */}
              <div>
                {searchTerm === '' && (
                  <p className="px-4 py-2 text-xs font-semibold text-gray-700 uppercase tracking-wide bg-gray-50">
                    All Countries
                  </p>
                )}
                {filteredCountries.length > 0 ? (
                  filteredCountries.map((country) => (
                    <button
                      key={country.code}
                      onClick={() => handleCountrySelect(country)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${
                        currentCountry?.code === country.code ? 'bg-blue-50 text-blue-700' : ''
                      }`}
                    >
                      <span className="text-lg">{country.flag}</span>
                      <span className="flex-1 text-left">{country.name}</span>
                      <span className="text-xs text-gray-500">{country.currency}</span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-gray-500">
                    No countries found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Auto-detect Option */}
            <div className="border-t p-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Auto-detect my location
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
