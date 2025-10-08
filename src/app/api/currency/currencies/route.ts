import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://moneymorph.dev/api/currencies', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    
    // Fallback data with popular currencies
    const fallbackCurrencies = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound Sterling',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar',
      'AUD': 'Australian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'EGP': 'Egyptian Pound',
      'SAR': 'Saudi Riyal',
      'AED': 'UAE Dirham',
      'INR': 'Indian Rupee',
      'BRL': 'Brazilian Real',
      'MXN': 'Mexican Peso',
      'KRW': 'South Korean Won',
      'SGD': 'Singapore Dollar',
      'HKD': 'Hong Kong Dollar',
      'NOK': 'Norwegian Krone',
      'SEK': 'Swedish Krona',
      'DKK': 'Danish Krone',
    };

    return NextResponse.json(fallbackCurrencies, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300', // Cache fallback for 5 minutes
      },
    });
  }
}
