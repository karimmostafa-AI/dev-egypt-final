import { NextRequest, NextResponse } from 'next/server';

// Simple IP-based location detection using ipapi.co (free tier)
// You can replace this with other services like IPGeolocation, GeoJS, etc.

interface IPLocationResponse {
  ip: string;
  country: string;
  country_code: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  error?: boolean;
  reason?: string;
}

// Fallback location data
const FALLBACK_LOCATION = {
  country: 'United States',
  countryCode: 'US',
  region: 'New York',
  city: 'New York',
  currency: 'USD',
  timezone: 'America/New_York',
};

// Country code to currency mapping for backup
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

function getClientIP(request: NextRequest): string {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to request IP (might be localhost in development)
  return request.ip || 'unknown';
}

export async function GET(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    
    // Skip location detection for localhost/development
    if (clientIP === 'unknown' || clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.')) {
      return NextResponse.json({
        ...FALLBACK_LOCATION,
        ip: clientIP,
        detectionMethod: 'fallback',
        message: 'Development environment detected, using fallback location'
      });
    }

    // Try multiple IP geolocation services for reliability
    const locationData = await detectLocationFromIP(clientIP);
    
    if (locationData) {
      return NextResponse.json({
        country: locationData.country,
        countryCode: locationData.country_code?.toUpperCase(),
        region: locationData.region,
        city: locationData.city,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        currency: locationData.currency || COUNTRY_CURRENCY_MAP[locationData.country_code?.toUpperCase() || 'US'] || 'USD',
        timezone: locationData.timezone,
        ip: locationData.ip,
        detectionMethod: 'ip'
      });
    }

    // If all services fail, return fallback
    return NextResponse.json({
      ...FALLBACK_LOCATION,
      ip: clientIP,
      detectionMethod: 'fallback',
      message: 'IP geolocation failed, using fallback location'
    });

  } catch (error) {
    console.error('Location detection error:', error);
    
    return NextResponse.json({
      ...FALLBACK_LOCATION,
      detectionMethod: 'fallback',
      error: 'Location detection failed',
    });
  }
}

async function detectLocationFromIP(ip: string): Promise<IPLocationResponse | null> {
  const services = [
    // Primary service: ipapi.co (free tier: 1000 requests/day)
    {
      name: 'ipapi.co',
      url: `https://ipapi.co/${ip}/json/`,
      transform: (data: any): IPLocationResponse => ({
        ip: data.ip,
        country: data.country_name,
        country_code: data.country_code,
        region: data.region,
        city: data.city,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        currency: data.currency,
      })
    },
    
    // Backup service: ip-api.com (free tier: 1000 requests/month)
    {
      name: 'ip-api.com',
      url: `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,city,lat,lon,timezone,currency,query`,
      transform: (data: any): IPLocationResponse => {
        if (data.status === 'fail') {
          throw new Error(data.message || 'IP API failed');
        }
        return {
          ip: data.query,
          country: data.country,
          country_code: data.countryCode,
          region: data.region,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
          currency: data.currency,
        };
      }
    },
    
    // Backup service: geojs.io (free tier)
    {
      name: 'geojs.io',
      url: `https://get.geojs.io/v1/ip/geo/${ip}.json`,
      transform: (data: any): IPLocationResponse => ({
        ip: data.ip,
        country: data.country,
        country_code: data.country_code,
        region: data.region,
        city: data.city,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        timezone: data.timezone,
        currency: COUNTRY_CURRENCY_MAP[data.country_code?.toUpperCase()] || 'USD',
      })
    }
  ];

  for (const service of services) {
    try {
      console.log(`Trying location detection with ${service.name}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
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
      if (data.error || (data.status && data.status === 'fail')) {
        throw new Error(data.reason || data.message || 'API returned error status');
      }
      
      const transformed = service.transform(data);
      
      // Validate that we got essential data
      if (transformed.country && transformed.country_code) {
        console.log(`Successfully detected location using ${service.name}:`, transformed);
        return transformed;
      } else {
        throw new Error('Incomplete location data received');
      }
      
    } catch (error: any) {
      console.warn(`${service.name} failed:`, error.message);
      
      // If this was an abort due to timeout, try next service
      if (error.name === 'AbortError') {
        console.warn(`${service.name} timed out, trying next service...`);
        continue;
      }
      
      // For other errors, also try next service
      continue;
    }
  }

  console.error('All IP geolocation services failed');
  return null;
}
