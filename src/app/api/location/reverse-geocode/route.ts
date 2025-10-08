import { NextRequest, NextResponse } from 'next/server';

// Reverse geocoding API for converting coordinates to location data
// Uses OpenStreetMap Nominatim API (free) as primary service

interface ReverseGeocodeResponse {
  country: string;
  countryCode: string;
  region?: string;
  city?: string;
  currency?: string;
  timezone?: string;
}

// Country code to currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  'US': 'USD', 'CA': 'CAD', 'GB': 'GBP', 'DE': 'EUR', 'FR': 'EUR',
  'IT': 'EUR', 'ES': 'EUR', 'JP': 'JPY', 'CN': 'CNY', 'AU': 'AUD',
  'BR': 'BRL', 'IN': 'INR', 'MX': 'MXN', 'NL': 'EUR', 'CH': 'CHF',
  'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'KR': 'KRW', 'SG': 'SGD',
  'HK': 'HKD', 'AE': 'AED', 'SA': 'SAR', 'EG': 'EGP', 'ZA': 'ZAR',
  'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP', 'NZ': 'NZD', 'TH': 'THB',
  'MY': 'MYR', 'PH': 'PHP', 'ID': 'IDR', 'VN': 'VND', 'TR': 'TRY',
  'IL': 'ILS', 'PL': 'PLN', 'CZ': 'CZK', 'HU': 'HUF', 'AT': 'EUR',
  'BE': 'EUR', 'PT': 'EUR', 'IE': 'EUR', 'QA': 'QAR', 'KW': 'KWD',
  'BH': 'BHD', 'PE': 'PEN',
};

// Country code to timezone mapping (simplified)
const COUNTRY_TIMEZONE_MAP: Record<string, string> = {
  'US': 'America/New_York',
  'CA': 'America/Toronto',
  'GB': 'Europe/London',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'IT': 'Europe/Rome',
  'ES': 'Europe/Madrid',
  'JP': 'Asia/Tokyo',
  'CN': 'Asia/Shanghai',
  'AU': 'Australia/Sydney',
  'BR': 'America/Sao_Paulo',
  'IN': 'Asia/Kolkata',
  'MX': 'America/Mexico_City',
  'NL': 'Europe/Amsterdam',
  'CH': 'Europe/Zurich',
  'SE': 'Europe/Stockholm',
  'NO': 'Europe/Oslo',
  'DK': 'Europe/Copenhagen',
  'KR': 'Asia/Seoul',
  'SG': 'Asia/Singapore',
  'HK': 'Asia/Hong_Kong',
  'AE': 'Asia/Dubai',
  'SA': 'Asia/Riyadh',
  'EG': 'Africa/Cairo',
  'ZA': 'Africa/Johannesburg',
  'AR': 'America/Argentina/Buenos_Aires',
  'CL': 'America/Santiago',
  'CO': 'America/Bogota',
  'NZ': 'Pacific/Auckland',
  'TH': 'Asia/Bangkok',
  'MY': 'Asia/Kuala_Lumpur',
  'PH': 'Asia/Manila',
  'ID': 'Asia/Jakarta',
  'VN': 'Asia/Ho_Chi_Minh',
  'TR': 'Europe/Istanbul',
  'IL': 'Asia/Jerusalem',
  'PL': 'Europe/Warsaw',
  'CZ': 'Europe/Prague',
  'HU': 'Europe/Budapest',
  'AT': 'Europe/Vienna',
  'BE': 'Europe/Brussels',
  'PT': 'Europe/Lisbon',
  'IE': 'Europe/Dublin',
  'QA': 'Asia/Qatar',
  'KW': 'Asia/Kuwait',
  'BH': 'Asia/Bahrain',
  'PE': 'America/Lima',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing latitude or longitude parameters' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Coordinates out of valid range' },
        { status: 400 }
      );
    }

    const locationData = await reverseGeocode(latitude, longitude);

    if (locationData) {
      return NextResponse.json(locationData);
    }

    return NextResponse.json(
      { error: 'Could not determine location from coordinates' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Reverse geocoding failed' },
      { status: 500 }
    );
  }
}

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResponse | null> {
  const services = [
    // Primary service: OpenStreetMap Nominatim (free, no API key required)
    {
      name: 'nominatim',
      url: `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`,
      transform: (data: any): ReverseGeocodeResponse => {
        const address = data.address || {};
        const countryCode = address.country_code?.toUpperCase();
        
        return {
          country: address.country,
          countryCode: countryCode,
          region: address.state || address.region || address.province,
          city: address.city || address.town || address.village || address.municipality,
          currency: COUNTRY_CURRENCY_MAP[countryCode || 'US'] || 'USD',
          timezone: COUNTRY_TIMEZONE_MAP[countryCode || 'US'] || 'UTC',
        };
      }
    },
    
    // Backup service: BigDataCloud (free tier available)
    {
      name: 'bigdatacloud',
      url: `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
      transform: (data: any): ReverseGeocodeResponse => {
        const countryCode = data.countryCode?.toUpperCase();
        
        return {
          country: data.countryName,
          countryCode: countryCode,
          region: data.principalSubdivision,
          city: data.city || data.locality,
          currency: COUNTRY_CURRENCY_MAP[countryCode || 'US'] || 'USD',
          timezone: COUNTRY_TIMEZONE_MAP[countryCode || 'US'] || 'UTC',
        };
      }
    }
  ];

  for (const service of services) {
    try {
      console.log(`Trying reverse geocoding with ${service.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch(service.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LocationDetection/1.0)',
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check for API-specific error indicators
      if (data.error) {
        throw new Error(data.error);
      }
      
      const transformed = service.transform(data);
      
      // Validate that we got essential data
      if (transformed.country && transformed.countryCode) {
        console.log(`Successfully reverse geocoded using ${service.name}:`, transformed);
        return transformed;
      } else {
        throw new Error('Incomplete location data received');
      }
      
    } catch (error: any) {
      console.warn(`${service.name} reverse geocoding failed:`, error.message);
      
      // If this was an abort due to timeout, try next service
      if (error.name === 'AbortError') {
        console.warn(`${service.name} timed out, trying next service...`);
        continue;
      }
      
      // For other errors, also try next service
      continue;
    }
  }

  console.error('All reverse geocoding services failed');
  return null;
}
