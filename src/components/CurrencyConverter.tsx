'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { useLocationCurrency } from '../contexts/LocationContext';

interface CurrencyData {
  [key: string]: string;
}

interface ConversionResponse {
  meta: {
    timestamp: number;
    rate: number;
    source?: string;
    warning?: string;
  };
  request: {
    to: string;
    query: string;
    from: string;
    amount: number;
  };
  response: number;
}

interface CurrencyConverterProps {
  basePrice: number;
  baseCurrency?: string;
  className?: string;
}

const popularCurrencies = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'JPY', symbol: '¥' },
  { code: 'CAD', symbol: 'C$' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CHF', symbol: 'CHF' },
  { code: 'CNY', symbol: '¥' },
  { code: 'EGP', symbol: 'E£' },
  { code: 'SAR', symbol: '﷼' },
  { code: 'AED', symbol: 'د.إ' },
];

export default function CurrencyConverter({ 
  basePrice, 
  baseCurrency = 'USD', 
  className = '' 
}: CurrencyConverterProps) {
  const { currency: detectedCurrency, isLoading: locationLoading } = useLocationCurrency();
  const [currencies, setCurrencies] = useState<CurrencyData>({});
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [convertedPrice, setConvertedPrice] = useState(basePrice);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAutoDetected, setHasAutoDetected] = useState(false);
  const [conversionSource, setConversionSource] = useState<string | null>(null);
  const [conversionWarning, setConversionWarning] = useState<string | null>(null);

  // Auto-detect currency based on location
  useEffect(() => {
    if (!locationLoading && detectedCurrency && !hasAutoDetected) {
      setSelectedCurrency(detectedCurrency);
      setHasAutoDetected(true);
    }
  }, [detectedCurrency, locationLoading, hasAutoDetected]);

  // Fetch available currencies on mount
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await fetch('/api/currency/currencies');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCurrencies(data);
      } catch (error) {
        console.error('Failed to fetch currencies:', error);
        setError('Failed to load currencies');
        
        // Fallback currencies if API fails
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
        };
        setCurrencies(fallbackCurrencies);
      }
    };

    fetchCurrencies();
  }, []);

  // Convert currency when selection changes
  useEffect(() => {
    if (selectedCurrency === baseCurrency) {
      setConvertedPrice(basePrice);
      setConversionSource(null);
      setConversionWarning(null);
      return;
    }

    const convertCurrency = async () => {
      setIsLoading(true);
      setError(null);
      setConversionSource(null);
      setConversionWarning(null);

      try {
        const response = await fetch(
          `/api/currency/convert?amount=${basePrice}&from=${baseCurrency}&to=${selectedCurrency}`
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to convert currency');
        }

        const data: ConversionResponse = await response.json();
        setConvertedPrice(data.response);
        setConversionSource(data.meta.source || null);
        setConversionWarning(data.meta.warning || null);
      } catch (error) {
        console.error('Currency conversion failed:', error);
        setError('Conversion failed');
        setConvertedPrice(basePrice); // Fallback to base price
        setConversionSource(null);
        setConversionWarning(null);
      } finally {
        setIsLoading(false);
      }
    };

    convertCurrency();
  }, [selectedCurrency, basePrice, baseCurrency]);

  const getCurrencySymbol = (code: string) => {
    const currency = popularCurrencies.find(c => c.code === code);
    return currency?.symbol || code;
  };

  const formatPrice = (price: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(price);
    } catch (error) {
      // Fallback formatting if currency is not supported by Intl
      return `${getCurrencySymbol(currencyCode)} ${price.toFixed(2)}`;
    }
  };

  const handleCurrencyChange = (currencyCode: string) => {
    setSelectedCurrency(currencyCode);
    setIsDropdownOpen(false);
  };

  const refreshConversion = () => {
    if (selectedCurrency !== baseCurrency) {
      setSelectedCurrency(selectedCurrency); // Trigger useEffect
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">Currency Converter</h3>
          {hasAutoDetected && selectedCurrency === detectedCurrency && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded" title="Auto-detected based on your location">
              Auto
            </span>
          )}
        </div>
        <button
          onClick={refreshConversion}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="Refresh conversion"
        >
          <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Currency Selector */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#173a6a] focus:border-transparent"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedCurrency}</span>
            <span className="text-sm text-gray-600">
              {currencies[selectedCurrency] || 'Loading...'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {/* Popular Currencies Section */}
            <div className="p-2 border-b bg-gray-50">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                Popular Currencies
              </p>
              <div className="grid grid-cols-3 gap-1">
                {popularCurrencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencyChange(currency.code)}
                    className={`p-2 text-left text-sm rounded hover:bg-gray-100 transition-colors ${
                      selectedCurrency === currency.code ? 'bg-[#173a6a] text-white' : ''
                    }`}
                  >
                    <div className="font-medium">{currency.code}</div>
                    <div className="text-xs opacity-75">{currency.symbol}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Currencies Section */}
            <div className="p-2">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                All Currencies
              </p>
              {Object.entries(currencies).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => handleCurrencyChange(code)}
                  className={`w-full p-2 text-left text-sm rounded hover:bg-gray-100 transition-colors ${
                    selectedCurrency === code ? 'bg-[#173a6a] text-white' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{code}</span>
                    <span className="text-xs opacity-75 truncate ml-2">{name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Converted Price Display */}
      <div className="bg-white rounded-md p-4 border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Price in {selectedCurrency}</p>
            <div className="flex items-baseline gap-2">
              {isLoading ? (
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              ) : error ? (
                <span className="text-sm text-red-600">Error loading price</span>
              ) : (
                <span className="text-xl font-bold text-[#173a6a]">
                  {formatPrice(convertedPrice, selectedCurrency)}
                </span>
              )}
            </div>
          </div>
          
          {selectedCurrency !== baseCurrency && !isLoading && !error && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Original price</p>
              <p className="text-sm text-gray-700 font-medium">
                {formatPrice(basePrice, baseCurrency)}
              </p>
            </div>
          )}
        </div>

        {/* Exchange Rate Info */}
        {selectedCurrency !== baseCurrency && !isLoading && !error && (
          <div className="mt-3 pt-3 border-t text-xs text-gray-500">
            <p>
              1 {baseCurrency} = {(convertedPrice / basePrice).toFixed(4)} {selectedCurrency}
            </p>
            <div className="mt-1 space-y-1">
              <p>
                Exchange rates provided by{' '}
                {conversionSource === 'exchangerate-api.com' && (
                  <a 
                    href="https://exchangerate-api.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#173a6a] hover:underline"
                  >
                    ExchangeRate-API
                  </a>
                )}
                {conversionSource === 'moneymorph.dev' && (
                  <a 
                    href="https://moneymorph.dev" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#173a6a] hover:underline"
                  >
                    MoneyMorph
                  </a>
                )}
                {conversionSource === 'fallback-rates' && (
                  <span className="text-amber-600 font-medium">Cached Rates</span>
                )}
                {!conversionSource && (
                  <span>Multiple sources</span>
                )}
              </p>
              {conversionWarning && (
                <p className="text-amber-600 font-medium">
                  ⚠️ {conversionWarning}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-2 text-xs text-red-600 text-center">
          {error}. Showing original price.
        </div>
      )}
    </div>
  );
}
