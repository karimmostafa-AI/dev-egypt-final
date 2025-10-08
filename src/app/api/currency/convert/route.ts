import { NextRequest, NextResponse } from 'next/server';

// Supported currencies - only currencies we have reliable fallback rates for
const SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 
  'EGP', 'SAR', 'AED', 'KWD', 'QAR', 'OMR', 'BHD'
]);

// Error types for better categorization
enum ErrorType {
  VALIDATION = 'VALIDATION',
  API_UNAVAILABLE = 'API_UNAVAILABLE',
  RATE_NOT_FOUND = 'RATE_NOT_FOUND',
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK'
}

class CurrencyError extends Error {
  constructor(
    message: string, 
    public type: ErrorType, 
    public statusCode: number = 500,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'CurrencyError';
  }
}

// Static fallback rates for emergency use (updated periodically)
const FALLBACK_RATES: { [key: string]: { [key: string]: number } } = {
  'USD': {
    'EUR': 0.85,
    'GBP': 0.73,
    'JPY': 110.0,
    'CAD': 1.25,
    'AUD': 1.35,
    'CHF': 0.92,
    'CNY': 6.45,
    'EGP': 31.0,
    'SAR': 3.75,
    'AED': 3.67,
    'KWD': 0.30,
    'QAR': 3.64,
    'OMR': 0.38,
    'BHD': 0.38,
  },
  'EUR': {
    'USD': 1.18,
    'GBP': 0.86,
    'JPY': 129.5,
    'EGP': 36.5,
  },
  'GBP': {
    'USD': 1.37,
    'EUR': 1.16,
    'EGP': 42.5,
  },
  'EGP': {
    'USD': 0.032,
    'EUR': 0.027,
    'GBP': 0.024,
    'SAR': 0.12,
    'AED': 0.12,
  }
};

// Helper function to log errors without stack traces for expected failures
function logCurrencyError(message: string, error: any, level: 'info' | 'warn' | 'error' = 'warn') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] Currency API ${level.toUpperCase()}: ${message}`;
  
  if (level === 'info') {
    console.info(logMessage);
  } else if (level === 'warn') {
    console.warn(logMessage);
  } else {
    console.error(logMessage, error instanceof Error ? error.message : error);
  }
}

// Validate currency codes
function validateCurrencyCode(code: string): boolean {
  const upperCode = code.toUpperCase();
  return /^[A-Z]{3}$/.test(upperCode) && SUPPORTED_CURRENCIES.has(upperCode);
}

async function tryExchangeRateAPI(from: string, to: string, amount: number) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${from.toUpperCase()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new CurrencyError(
          `Currency pair ${from}/${to} not supported by ExchangeRate API`,
          ErrorType.RATE_NOT_FOUND,
          404,
          false
        );
      }
      throw new CurrencyError(
        `ExchangeRate API unavailable (HTTP ${response.status})`,
        ErrorType.API_UNAVAILABLE,
        response.status,
        response.status >= 500
      );
    }

    const data = await response.json();
    const rate = data.rates[to.toUpperCase()];
    
    if (!rate) {
      throw new CurrencyError(
        `Exchange rate not available for ${from} to ${to}`,
        ErrorType.RATE_NOT_FOUND,
        404,
        false
      );
    }

    const convertedAmount = amount * rate;
    logCurrencyError(`Successfully converted ${amount} ${from} to ${convertedAmount.toFixed(2)} ${to} via ExchangeRate API`, null, 'info');

    return {
      meta: {
        timestamp: Math.floor(Date.now() / 1000),
        rate: rate,
        source: 'exchangerate-api.com'
      },
      request: {
        to: to.toUpperCase(),
        query: `/convert/${amount}/${from.toUpperCase()}/${to.toUpperCase()}`,
        from: from.toUpperCase(),
        amount: amount
      },
      response: convertedAmount
    };
  } catch (error) {
    if (error instanceof CurrencyError) {
      logCurrencyError(`ExchangeRate API: ${error.message}`, null, error.retryable ? 'warn' : 'info');
      throw error;
    }
    
    if (error.name === 'AbortError') {
      const timeoutError = new CurrencyError(
        'ExchangeRate API request timed out',
        ErrorType.TIMEOUT,
        408,
        true
      );
      logCurrencyError(timeoutError.message, null, 'warn');
      throw timeoutError;
    }
    
    const networkError = new CurrencyError(
      'ExchangeRate API network error',
      ErrorType.NETWORK,
      503,
      true
    );
    logCurrencyError(networkError.message, error);
    throw networkError;
  }
}

async function tryMoneyMorphAPI(from: string, to: string, amount: number) {
  try {
    const response = await fetch(
      `https://moneymorph.dev/api/convert/${amount}/${from.toUpperCase()}/${to.toUpperCase()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(6000) // 6 second timeout
      }
    );

    if (!response.ok) {
      if (response.status === 400) {
        throw new CurrencyError(
          `Invalid currency pair ${from}/${to} for MoneyMorph API`,
          ErrorType.VALIDATION,
          400,
          false
        );
      }
      if (response.status === 404) {
        throw new CurrencyError(
          `Currency pair ${from}/${to} not found in MoneyMorph API`,
          ErrorType.RATE_NOT_FOUND,
          404,
          false
        );
      }
      throw new CurrencyError(
        `MoneyMorph API unavailable (HTTP ${response.status})`,
        ErrorType.API_UNAVAILABLE,
        response.status,
        response.status >= 500
      );
    }

    const data = await response.json();
    logCurrencyError(`Successfully converted ${amount} ${from} to ${data.response.toFixed(2)} ${to} via MoneyMorph API`, null, 'info');

    return {
      ...data,
      meta: {
        ...data.meta,
        source: 'moneymorph.dev'
      }
    };
  } catch (error) {
    if (error instanceof CurrencyError) {
      logCurrencyError(`MoneyMorph API: ${error.message}`, null, error.retryable ? 'warn' : 'info');
      throw error;
    }
    
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      const timeoutError = new CurrencyError(
        'MoneyMorph API request timed out',
        ErrorType.TIMEOUT,
        408,
        true
      );
      logCurrencyError(timeoutError.message, null, 'warn');
      throw timeoutError;
    }
    
    const networkError = new CurrencyError(
      'MoneyMorph API network error',
      ErrorType.NETWORK,
      503,
      true
    );
    logCurrencyError(networkError.message, error);
    throw networkError;
  }
}

function useFallbackRates(from: string, to: string, amount: number) {
  const fromUpper = from.toUpperCase();
  const toUpper = to.toUpperCase();
  
  // Direct rate lookup
  let rate = FALLBACK_RATES[fromUpper]?.[toUpper];
  
  // Try inverse rate
  if (!rate && FALLBACK_RATES[toUpper]?.[fromUpper]) {
    rate = 1 / FALLBACK_RATES[toUpper][fromUpper];
  }
  
  // Try USD as intermediate currency
  if (!rate) {
    const fromToUSD = FALLBACK_RATES[fromUpper]?.['USD'];
    const usdToTo = FALLBACK_RATES['USD']?.[toUpper];
    
    if (fromToUSD && usdToTo) {
      rate = fromToUSD * usdToTo;
    } else if (fromUpper === 'USD' && FALLBACK_RATES['USD']?.[toUpper]) {
      rate = FALLBACK_RATES['USD'][toUpper];
    } else if (toUpper === 'USD' && FALLBACK_RATES[fromUpper]?.['USD']) {
      rate = FALLBACK_RATES[fromUpper]['USD'];
    }
  }
  
  if (!rate) {
    throw new CurrencyError(
      `Conversion not supported: ${fromUpper} to ${toUpper}`,
      ErrorType.RATE_NOT_FOUND,
      404,
      false
    );
  }
  
  const convertedAmount = amount * rate;
  logCurrencyError(`Using fallback rate to convert ${amount} ${fromUpper} to ${convertedAmount.toFixed(2)} ${toUpper} (rate: ${rate})`, null, 'info');
  
  return {
    meta: {
      timestamp: Math.floor(Date.now() / 1000),
      rate: rate,
      source: 'fallback-rates',
      warning: 'Using cached exchange rates - may not be current'
    },
    request: {
      to: toUpper,
      query: `/convert/${amount}/${fromUpper}/${toUpper}`,
      from: fromUpper,
      amount: amount
    },
    response: convertedAmount
  };
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    // Validate required parameters
    if (!amount || !from || !to) {
      return NextResponse.json(
        { 
          error: 'Missing required parameters',
          message: 'Please provide amount, from, and to currency codes',
          details: 'Required: ?amount=<number>&from=<currency>&to=<currency>'
        },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { 
          error: 'Invalid amount',
          message: 'Amount must be a positive number'
        },
        { status: 400 }
      );
    }

    // Validate amount is not too large (prevent overflow)
    if (numAmount > 1000000000) {
      return NextResponse.json(
        { 
          error: 'Amount too large',
          message: 'Maximum amount allowed is 1 billion'
        },
        { status: 400 }
      );
    }

    // Validate currency codes
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    if (!validateCurrencyCode(fromUpper)) {
      return NextResponse.json(
        { 
          error: 'Invalid source currency',
          message: `Currency code '${from}' is not supported`,
          supportedCurrencies: Array.from(SUPPORTED_CURRENCIES).sort()
        },
        { status: 400 }
      );
    }

    if (!validateCurrencyCode(toUpper)) {
      return NextResponse.json(
        { 
          error: 'Invalid target currency',
          message: `Currency code '${to}' is not supported`,
          supportedCurrencies: Array.from(SUPPORTED_CURRENCIES).sort()
        },
        { status: 400 }
      );
    }

    // If converting to the same currency, return the same amount
    if (fromUpper === toUpper) {
      logCurrencyError(`Same currency conversion: ${numAmount} ${fromUpper}`, null, 'info');
      return NextResponse.json({
        meta: {
          timestamp: Math.floor(Date.now() / 1000),
          rate: 1,
          source: 'same-currency'
        },
        request: {
          to: toUpper,
          query: `/convert/${amount}/${fromUpper}/${toUpper}`,
          from: fromUpper,
          amount: numAmount
        },
        response: numAmount
      });
    }

    // Try multiple APIs in order of preference with retry logic
    let result;
    let lastError;
    const maxRetries = 2;

    // Try ExchangeRate API first (more reliable and free)
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        result = await tryExchangeRateAPI(fromUpper, toUpper, numAmount);
        break;
      } catch (error) {
        lastError = error;
        if (error instanceof CurrencyError && !error.retryable) {
          logCurrencyError(`ExchangeRate API failed permanently: ${error.message}`, null, 'info');
          break;
        }
        if (attempt < maxRetries) {
          logCurrencyError(`ExchangeRate API attempt ${attempt} failed, retrying...`, error, 'warn');
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
        }
      }
    }

    // Try MoneyMorph API as backup
    if (!result) {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          result = await tryMoneyMorphAPI(fromUpper, toUpper, numAmount);
          break;
        } catch (error) {
          lastError = error;
          if (error instanceof CurrencyError && !error.retryable) {
            logCurrencyError(`MoneyMorph API failed permanently: ${error.message}`, null, 'info');
            break;
          }
          if (attempt < maxRetries) {
            logCurrencyError(`MoneyMorph API attempt ${attempt} failed, retrying...`, error, 'warn');
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Progressive delay
          }
        }
      }
    }

    // Use fallback rates as last resort
    if (!result) {
      try {
        result = useFallbackRates(fromUpper, toUpper, numAmount);
      } catch (error) {
        logCurrencyError('All conversion methods failed', error, 'error');
        
        if (error instanceof CurrencyError) {
          return NextResponse.json(
            { 
              error: error.message,
              message: 'This currency conversion is not currently supported',
              supportedCurrencies: Array.from(SUPPORTED_CURRENCIES).sort()
            },
            { status: error.statusCode }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Currency conversion failed',
            message: 'All conversion services are currently unavailable. Please try again later.'
          },
          { status: 503 }
        );
      }
    }

    const processingTime = Date.now() - startTime;
    logCurrencyError(`Conversion completed in ${processingTime}ms: ${numAmount} ${fromUpper} = ${result.response.toFixed(2)} ${toUpper}`, null, 'info');

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'X-Processing-Time': `${processingTime}ms`
      },
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    logCurrencyError(`Unexpected error after ${processingTime}ms`, error, 'error');
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
