'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocationDetection, LocationData, LocationState } from '../hooks/useLocationDetection';

interface LocationContextType extends LocationState {
  autoDetectLocation: () => Promise<LocationData>;
  setLocationManually: (location: LocationData) => void;
  refreshLocation: () => Promise<LocationData>;
  isLocationStale: boolean;
  // Helper methods
  getCurrentCurrency: () => string;
  getCurrentCountry: () => string;
  getCurrentCountryCode: () => string;
  getShipToText: () => string;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

// Country to currency mapping for location-based currency detection
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // North America
  'US': 'USD',
  'CA': 'CAD',
  'MX': 'MXN',
  
  // Europe
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'AT': 'EUR',
  'PT': 'EUR',
  'IE': 'EUR',
  'CH': 'CHF',
  'NO': 'NOK',
  'SE': 'SEK',
  'DK': 'DKK',
  'PL': 'PLN',
  'CZ': 'CZK',
  'HU': 'HUF',
  
  // Asia Pacific
  'JP': 'JPY',
  'CN': 'CNY',
  'KR': 'KRW',
  'IN': 'INR',
  'AU': 'AUD',
  'NZ': 'NZD',
  'SG': 'SGD',
  'HK': 'HKD',
  'TH': 'THB',
  'MY': 'MYR',
  'PH': 'PHP',
  'ID': 'IDR',
  'VN': 'VND',
  
  // Middle East & Africa
  'AE': 'AED',
  'SA': 'SAR',
  'QA': 'QAR',
  'KW': 'KWD',
  'BH': 'BHD',
  'EG': 'EGP',
  'ZA': 'ZAR',
  'IL': 'ILS',
  'TR': 'TRY',
  
  // South America
  'BR': 'BRL',
  'AR': 'ARS',
  'CL': 'CLP',
  'CO': 'COP',
  'PE': 'PEN',
  
  // Default fallback
  'DEFAULT': 'USD'
};

// Country code to country name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'CA': 'Canada',
  'GB': 'United Kingdom',
  'DE': 'Germany',
  'FR': 'France',
  'IT': 'Italy',
  'ES': 'Spain',
  'JP': 'Japan',
  'CN': 'China',
  'AU': 'Australia',
  'BR': 'Brazil',
  'IN': 'India',
  'MX': 'Mexico',
  'NL': 'Netherlands',
  'CH': 'Switzerland',
  'SE': 'Sweden',
  'NO': 'Norway',
  'DK': 'Denmark',
  'KR': 'South Korea',
  'SG': 'Singapore',
  'HK': 'Hong Kong',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'EG': 'Egypt',
  'ZA': 'South Africa',
  'AR': 'Argentina',
  'CL': 'Chile',
  'CO': 'Colombia',
  'NZ': 'New Zealand',
  'TH': 'Thailand',
  'MY': 'Malaysia',
  'PH': 'Philippines',
  'ID': 'Indonesia',
  'VN': 'Vietnam',
  'TR': 'Turkey',
  'IL': 'Israel',
  'PL': 'Poland',
  'CZ': 'Czech Republic',
  'HU': 'Hungary',
  'AT': 'Austria',
  'BE': 'Belgium',
  'PT': 'Portugal',
  'IE': 'Ireland',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'BH': 'Bahrain',
  'PE': 'Peru',
};

export function LocationProvider({ children }: LocationProviderProps) {
  const locationHook = useLocationDetection();

  // Helper method to get current currency based on location
  const getCurrentCurrency = (): string => {
    if (!locationHook.location) return 'USD';
    
    // First check if location data already has currency
    if (locationHook.location.currency) {
      return locationHook.location.currency;
    }
    
    // Fallback to country code mapping
    const countryCode = locationHook.location.countryCode?.toUpperCase();
    return COUNTRY_CURRENCY_MAP[countryCode || 'DEFAULT'] || 'USD';
  };

  // Helper method to get current country name
  const getCurrentCountry = (): string => {
    if (!locationHook.location) return 'United States';
    
    // First check if location data already has country name
    if (locationHook.location.country) {
      return locationHook.location.country;
    }
    
    // Fallback to country code mapping
    const countryCode = locationHook.location.countryCode?.toUpperCase();
    return COUNTRY_NAMES[countryCode || 'US'] || 'United States';
  };

  // Helper method to get current country code
  const getCurrentCountryCode = (): string => {
    return locationHook.location?.countryCode?.toUpperCase() || 'US';
  };

  // Helper method to get formatted "Ship to" text
  const getShipToText = (): string => {
    const country = getCurrentCountry();
    const currency = getCurrentCurrency();
    
    // Show currency if it's different from USD or if explicitly requested
    if (currency !== 'USD') {
      return `Ship to: ${country} | ${currency}`;
    }
    
    return `Ship to: ${country}`;
  };

  // Context value with all methods and state
  const contextValue: LocationContextType = {
    ...locationHook,
    getCurrentCurrency,
    getCurrentCountry,
    getCurrentCountryCode,
    getShipToText,
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocation(): LocationContextType {
  const context = useContext(LocationContext);
  
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  
  return context;
}

// Helper hook for components that only need specific location data
export function useLocationData() {
  const { location, isLoading, error } = useLocation();
  
  return {
    location,
    isLoading,
    error,
    hasLocation: !!location,
  };
}

// Helper hook for currency-related functionality
export function useLocationCurrency() {
  const { getCurrentCurrency, location, isLoading } = useLocation();
  
  return {
    currency: getCurrentCurrency(),
    isLoading,
    location,
  };
}

// Helper hook for shipping/country display
export function useLocationShipping() {
  const { getCurrentCountry, getCurrentCountryCode, getShipToText, location, isLoading } = useLocation();
  
  return {
    country: getCurrentCountry(),
    countryCode: getCurrentCountryCode(),
    shipToText: getShipToText(),
    isLoading,
    location,
  };
}
