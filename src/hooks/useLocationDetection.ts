'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  country: string;
  countryCode: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  currency?: string;
  timezone?: string;
  ip?: string;
}

export interface LocationState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  isManualOverride: boolean;
  detectionMethod: 'ip' | 'browser' | 'manual' | null;
}

const DEFAULT_LOCATION: LocationData = {
  country: 'United States',
  countryCode: 'US',
  currency: 'USD',
  timezone: 'America/New_York'
};

export function useLocationDetection() {
  const [state, setState] = useState<LocationState>({
    location: null,
    isLoading: true,
    error: null,
    isManualOverride: false,
    detectionMethod: null,
  });

  // Load saved location from localStorage
  const loadSavedLocation = useCallback(() => {
    try {
      const saved = localStorage.getItem('userLocation');
      const savedOverride = localStorage.getItem('locationManualOverride');
      
      if (saved) {
        const locationData = JSON.parse(saved);
        const isManualOverride = savedOverride === 'true';
        
        setState(prev => ({
          ...prev,
          location: locationData,
          isManualOverride,
          detectionMethod: isManualOverride ? 'manual' : prev.detectionMethod,
          isLoading: false
        }));
        
        return true;
      }
    } catch (error) {
      console.error('Failed to load saved location:', error);
    }
    return false;
  }, []);

  // Save location to localStorage
  const saveLocation = useCallback((location: LocationData, isManual = false) => {
    try {
      localStorage.setItem('userLocation', JSON.stringify(location));
      localStorage.setItem('locationManualOverride', isManual.toString());
      localStorage.setItem('locationLastUpdated', new Date().toISOString());
    } catch (error) {
      console.error('Failed to save location:', error);
    }
  }, []);

  // Detect location via IP (fallback method)
  const detectLocationByIP = useCallback(async (): Promise<LocationData | null> => {
    try {
      const response = await fetch('/api/location/detect', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      return {
        country: data.country || DEFAULT_LOCATION.country,
        countryCode: data.countryCode || DEFAULT_LOCATION.countryCode,
        city: data.city,
        region: data.region,
        currency: data.currency || DEFAULT_LOCATION.currency,
        timezone: data.timezone || DEFAULT_LOCATION.timezone,
        ip: data.ip,
      };
    } catch (error) {
      console.error('IP-based location detection failed:', error);
      return null;
    }
  }, []);

  // Detect location via browser geolocation
  const detectLocationByBrowser = useCallback(async (): Promise<LocationData | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      const timeoutId = setTimeout(() => {
        resolve(null);
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          clearTimeout(timeoutId);
          
          try {
            const { latitude, longitude } = position.coords;
            
            // Reverse geocode the coordinates
            const response = await fetch(`/api/location/reverse-geocode?lat=${latitude}&lng=${longitude}`);
            
            if (!response.ok) {
              throw new Error('Reverse geocoding failed');
            }

            const data = await response.json();
            
            resolve({
              country: data.country || DEFAULT_LOCATION.country,
              countryCode: data.countryCode || DEFAULT_LOCATION.countryCode,
              city: data.city,
              region: data.region,
              latitude,
              longitude,
              currency: data.currency || DEFAULT_LOCATION.currency,
              timezone: data.timezone || DEFAULT_LOCATION.timezone,
            });
          } catch (error) {
            console.error('Browser location processing failed:', error);
            resolve(null);
          }
        },
        (error) => {
          clearTimeout(timeoutId);
          console.error('Browser geolocation failed:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 1000 * 60 * 5, // 5 minutes
        }
      );
    });
  }, []);

  // Auto-detect location using multiple methods
  const autoDetectLocation = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First try browser geolocation (more accurate)
      const browserLocation = await detectLocationByBrowser();
      
      if (browserLocation) {
        setState(prev => ({
          ...prev,
          location: browserLocation,
          detectionMethod: 'browser',
          isLoading: false,
          isManualOverride: false,
        }));
        
        saveLocation(browserLocation, false);
        return browserLocation;
      }

      // Fallback to IP-based detection
      const ipLocation = await detectLocationByIP();
      
      if (ipLocation) {
        setState(prev => ({
          ...prev,
          location: ipLocation,
          detectionMethod: 'ip',
          isLoading: false,
          isManualOverride: false,
        }));
        
        saveLocation(ipLocation, false);
        return ipLocation;
      }

      // Ultimate fallback to default location
      setState(prev => ({
        ...prev,
        location: DEFAULT_LOCATION,
        detectionMethod: 'ip',
        isLoading: false,
        isManualOverride: false,
        error: 'Could not detect location, using default',
      }));
      
      saveLocation(DEFAULT_LOCATION, false);
      return DEFAULT_LOCATION;

    } catch (error) {
      console.error('Auto-detection failed:', error);
      
      setState(prev => ({
        ...prev,
        location: DEFAULT_LOCATION,
        detectionMethod: null,
        isLoading: false,
        error: 'Location detection failed',
      }));
      
      return DEFAULT_LOCATION;
    }
  }, [detectLocationByBrowser, detectLocationByIP, saveLocation]);

  // Manually set location (user override)
  const setLocationManually = useCallback((location: LocationData) => {
    setState(prev => ({
      ...prev,
      location,
      isManualOverride: true,
      detectionMethod: 'manual',
      error: null,
    }));
    
    saveLocation(location, true);
  }, [saveLocation]);

  // Refresh location detection
  const refreshLocation = useCallback(async () => {
    // Clear manual override and re-detect
    localStorage.removeItem('locationManualOverride');
    return await autoDetectLocation();
  }, [autoDetectLocation]);

  // Check if location data is stale (older than 24 hours)
  const isLocationStale = useCallback(() => {
    try {
      const lastUpdated = localStorage.getItem('locationLastUpdated');
      if (!lastUpdated) return true;
      
      const lastUpdateTime = new Date(lastUpdated).getTime();
      const now = new Date().getTime();
      const hoursDiff = (now - lastUpdateTime) / (1000 * 60 * 60);
      
      return hoursDiff > 24;
    } catch {
      return true;
    }
  }, []);

  // Initialize location detection
  useEffect(() => {
    const initializeLocation = async () => {
      // First, try to load saved location
      const hasSavedLocation = loadSavedLocation();
      
      if (hasSavedLocation && !isLocationStale()) {
        // If we have a fresh saved location, use it
        return;
      }

      // If no saved location or it's stale, auto-detect
      if (!state.isManualOverride) {
        await autoDetectLocation();
      }
    };

    initializeLocation();
  }, []); // Only run once on mount

  return {
    ...state,
    autoDetectLocation,
    setLocationManually,
    refreshLocation,
    isLocationStale: isLocationStale(),
  };
}
