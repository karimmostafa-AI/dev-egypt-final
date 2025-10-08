# Location Detection Integration Guide

This guide shows how the location detection system works with your e-commerce application to automatically detect user location, change currency, and update shipping information.

## 🌍 What's Been Implemented

### 1. **Automatic Location Detection**
- **IP-based detection** (fallback method using multiple services)
- **Browser geolocation** (more accurate, requires user permission)
- **Persistent storage** in localStorage
- **Smart caching** (24-hour refresh cycle)

### 2. **Currency Auto-Detection**
- Automatically sets currency based on detected country
- Updates price displays in real-time
- Shows "Auto" indicator when currency is auto-detected
- Maintains manual override capability

### 3. **Navigation Integration**
- Updates "Ship to:" text dynamically in the top navigation bar
- Shows loading state while detecting location
- Displays both country and currency information

### 4. **Manual Override System**
- LocationSelector component for manual country/currency selection
- Compact mode for integration in navigation or other components
- Full mode for settings pages
- Maintains user preferences across sessions

## 🚀 How It Works

### Navigation Bar
The navigation now automatically shows:
```
Ship to: Egypt | EGP    // (if detected in Egypt)
Ship to: United States  // (if detected in US with USD)
Ship to: Canada | CAD   // (if detected in Canada)
```

### Currency Converter
The currency converter now:
- Auto-detects currency based on location
- Shows "Auto" badge when using detected currency
- Falls back to USD if detection fails
- Allows manual currency override

### Product Pages
All product pages with CurrencyConverter will:
- Show prices in the user's local currency
- Display original USD price for comparison
- Update automatically when location changes

## 🔧 API Endpoints Created

### `/api/location/detect`
**GET** - Detects user location via IP address
- Uses multiple geolocation services for reliability
- Returns country, currency, timezone, and coordinates
- Graceful fallback to default (US) location

### `/api/location/reverse-geocode`
**GET** - Converts coordinates to location data
- Used for browser geolocation results
- Query params: `lat` and `lng`
- Returns detailed location information

## 💡 Usage Examples

### Basic Usage (Already Integrated)
The system works automatically once the LocationProvider is added to your root layout. No additional setup needed for:
- Navigation bar updates
- Currency converter auto-detection
- Product page currency display

### Manual Location Selection
Add a location selector anywhere in your app:

```tsx
import LocationSelector from '../components/LocationSelector';

// Compact mode (for navigation dropdowns)
<LocationSelector compact className="ml-2" />

// Full mode (for settings pages)
<LocationSelector className="max-w-md" />
```

### Custom Location Integration
Use location data in your components:

```tsx
import { useLocationShipping, useLocationCurrency } from '../contexts/LocationContext';

function ShippingInfo() {
  const { country, countryCode, shipToText } = useLocationShipping();
  const { currency } = useLocationCurrency();
  
  return (
    <div>
      <p>Shipping to: {country}</p>
      <p>Currency: {currency}</p>
      <p>Full text: {shipToText}</p>
    </div>
  );
}
```

### Check Location Status
```tsx
import { useLocation } from '../contexts/LocationContext';

function LocationStatus() {
  const { 
    location, 
    isLoading, 
    error, 
    isManualOverride, 
    detectionMethod 
  } = useLocation();
  
  if (isLoading) return <div>Detecting location...</div>;
  if (error) return <div>Location detection failed: {error}</div>;
  
  return (
    <div>
      <p>Country: {location?.country}</p>
      <p>Currency: {location?.currency}</p>
      <p>Detection: {isManualOverride ? 'Manual' : detectionMethod}</p>
    </div>
  );
}
```

## 🎯 Key Features

### 1. **Automatic Currency Detection**
- Maps countries to their primary currencies
- Updates currency converter automatically
- Shows auto-detection indicator
- Maintains user manual selections

### 2. **Smart Fallbacks**
- Multiple IP geolocation services
- Graceful fallback to US/USD if all services fail
- Works in development environment
- Handles network timeouts and errors

### 3. **Performance Optimized**
- Caches location data for 24 hours
- Lazy loading of location detection
- Minimal API calls
- Client-side storage for instant loading

### 4. **User Experience**
- Loading states throughout the UI
- Clear indication of auto vs manual selection
- Easy manual override options
- Persistent user preferences

## 🔄 Location Detection Flow

1. **App loads** → LocationProvider initializes
2. **Check localStorage** → Use cached location if fresh (< 24 hours)
3. **Auto-detect** (if no cache or stale):
   - Try browser geolocation (requires permission)
   - Fallback to IP-based detection
   - Use default (US) if all fail
4. **Update UI** → Navigation, currency converter, etc.
5. **User override** → Manual selection saves preference

## 🌐 Supported Countries & Currencies

The system supports 40+ countries with proper currency mapping:
- **Americas**: US (USD), Canada (CAD), Mexico (MXN), Brazil (BRL), Argentina (ARS)
- **Europe**: UK (GBP), Germany (EUR), France (EUR), Switzerland (CHF), Sweden (SEK)
- **Asia Pacific**: Japan (JPY), China (CNY), Australia (AUD), Singapore (SGD), India (INR)
- **Middle East**: UAE (AED), Saudi Arabia (SAR), Egypt (EGP), Israel (ILS)
- **And many more...**

## 🛠️ Troubleshooting

### Location not detected?
- Check browser permissions for geolocation
- Verify internet connection
- Check browser console for API errors
- Try manual selection via LocationSelector

### Currency not updating?
- Location detection might still be loading
- Check if manual currency was previously selected
- Verify currency API endpoints are working
- Clear localStorage to reset preferences

### Development environment issues?
- System uses fallback location (US) for localhost
- IP detection won't work on local development
- Use manual selection for testing different countries

## 📝 Integration Checklist

✅ **LocationProvider added to root layout**  
✅ **Navigation updated with dynamic location text**  
✅ **CurrencyConverter auto-detects currency**  
✅ **API routes created for location detection**  
✅ **Manual override system available**  
✅ **Error handling and fallbacks implemented**  
✅ **Loading states throughout UI**  
✅ **Persistent user preferences**  

## 🎉 Result

Your e-commerce store now:
- Automatically detects user location on first visit
- Shows appropriate currency and shipping information
- Updates navigation to show "Ship to: [Country] | [Currency]"
- Allows users to manually override their location
- Provides a seamless, localized shopping experience

The system works immediately without any additional configuration needed!
