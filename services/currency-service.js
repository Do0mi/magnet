/**
 * Currency Service
 * 
 * This service handles currency conversion with intelligent caching to minimize API calls.
 * 
 * CACHING STRATEGY:
 * - Exchange rates are fetched from exchangerate.host API once per hour
 * - Rates are stored in-memory (or Redis if configured) with a timestamp
 * - All conversions use cached rates (never calls API per request)
 * - Cache automatically refreshes when older than 1 hour
 * - On server restart, cache auto-loads latest rates on startup
 * 
 * API OPTIMIZATION:
 * - Only one API call per hour regardless of request volume
 * - Supports thousands of requests per hour without additional API calls
 * - Fallback to USD (rate = 1) if API fails or rate is missing
 * 
 * @module services/currency-service
 */

const axios = require('axios');

// Base currency (all product prices are stored in this currency)
const BASE_CURRENCY = 'USD';

// Exchange rate API endpoints (with fallback)
// Using exchangerate-api.com which is more reliable and supports all currencies including EGP
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/USD';
const FALLBACK_API = 'https://api.exchangerate.host/latest'; // Fallback to exchangerate.host

// Cache configuration
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * In-memory cache for exchange rates
 * Structure: { rates: { USD: 1, EGP: 30.5, ... }, lastUpdated: timestamp }
 */
let exchangeRateCache = {
  rates: {},
  lastUpdated: null
};

/**
 * Redis client (optional - set via setRedisClient)
 * If Redis is configured, it will be used instead of in-memory cache
 */
let redisClient = null;

/**
 * Country to Currency Mapping
 * Maps ISO country codes to their respective currencies
 */
const COUNTRY_TO_CURRENCY = {
  // United States
  'US': 'USD',
  // Middle East
  'EG': 'EGP',  // Egypt
  'AE': 'AED',  // United Arab Emirates
  'SA': 'SAR',  // Saudi Arabia
  'KW': 'KWD',  // Kuwait
  'QA': 'QAR',  // Qatar
  'BH': 'BHD',  // Bahrain
  'OM': 'OMR',  // Oman
  'JO': 'JOD',  // Jordan
  'LB': 'LBP',  // Lebanon
  'IQ': 'IQD',  // Iraq
  'YE': 'YER',  // Yemen
  'SY': 'SYP',  // Syria
  'PS': 'ILS',  // Palestine (uses Israeli Shekel)
  // Europe
  'GB': 'GBP',  // United Kingdom
  'DE': 'EUR',  // Germany
  'FR': 'EUR',  // France
  'IT': 'EUR',  // Italy
  'ES': 'EUR',  // Spain
  'NL': 'EUR',  // Netherlands
  'BE': 'EUR',  // Belgium
  'AT': 'EUR',  // Austria
  'CH': 'CHF',  // Switzerland
  'SE': 'SEK',  // Sweden
  'NO': 'NOK',  // Norway
  'DK': 'DKK',  // Denmark
  'PL': 'PLN',  // Poland
  'RU': 'RUB',  // Russia
  // Asia
  'CN': 'CNY',  // China
  'JP': 'JPY',  // Japan
  'IN': 'INR',  // India
  'KR': 'KRW',  // South Korea
  'SG': 'SGD',  // Singapore
  'MY': 'MYR',  // Malaysia
  'TH': 'THB',  // Thailand
  'ID': 'IDR',  // Indonesia
  'PH': 'PHP',  // Philippines
  'VN': 'VND',  // Vietnam
  'PK': 'PKR',  // Pakistan
  'BD': 'BDT',  // Bangladesh
  'LK': 'LKR',  // Sri Lanka
  'NP': 'NPR',  // Nepal
  // Africa
  'ZA': 'ZAR',  // South Africa
  'NG': 'NGN',  // Nigeria
  'KE': 'KES',  // Kenya
  'GH': 'GHS',  // Ghana
  'MA': 'MAD',  // Morocco
  'TN': 'TND',  // Tunisia
  'DZ': 'DZD',  // Algeria
  'SD': 'SDG',  // Sudan
  'ET': 'ETB',  // Ethiopia
  // Americas
  'CA': 'CAD',  // Canada
  'MX': 'MXN',  // Mexico
  'BR': 'BRL',  // Brazil
  'AR': 'ARS',  // Argentina
  'CL': 'CLP',  // Chile
  'CO': 'COP',  // Colombia
  'PE': 'PEN',  // Peru
  // Oceania
  'AU': 'AUD',  // Australia
  'NZ': 'NZD',  // New Zealand
};

/**
 * Set Redis client for distributed caching (optional)
 * If Redis is provided, it will be used instead of in-memory cache
 * 
 * @param {Object} client - Redis client instance
 */
const setRedisClient = (client) => {
  redisClient = client;
};

/**
 * Get cache key for Redis
 * @returns {string} Cache key
 */
const getCacheKey = () => {
  return 'exchange_rates_cache';
};

/**
 * Check if cache is valid (not expired)
 * 
 * @param {number} lastUpdated - Timestamp of last update
 * @returns {boolean} True if cache is still valid
 */
const isCacheValid = (lastUpdated) => {
  if (!lastUpdated) return false;
  const now = Date.now();
  return (now - lastUpdated) < CACHE_DURATION_MS;
};

/**
 * Fetch exchange rates from API
 * Fetches all rates relative to USD (base currency)
 * 
 * @returns {Promise<Object>} Object with rates and timestamp
 * @throws {Error} If API request fails
 */
/**
 * Fetch exchange rates from primary API (exchangerate-api.com)
 * This API supports all currencies including EGP
 * 
 * @returns {Promise<Object>} Object with rates
 * @throws {Error} If API request fails
 */
const fetchFromPrimaryAPI = async () => {
  console.log('[Currency Service] Trying primary API: exchangerate-api.com');
  
  const response = await axios.get(EXCHANGE_RATE_API, {
    timeout: 10000
  });

  if (!response.data || !response.data.rates) {
    throw new Error('Invalid response from primary API');
  }

  return response.data.rates;
};

/**
 * Fetch exchange rates from fallback API (exchangerate.host)
 * 
 * @returns {Promise<Object>} Object with rates
 * @throws {Error} If API request fails
 */
const fetchFromFallbackAPI = async () => {
  console.log('[Currency Service] Trying fallback API: exchangerate.host');
  
  const response = await axios.get(FALLBACK_API, {
    params: {
      base: BASE_CURRENCY
    },
    timeout: 10000
  });

  if (!response.data || !response.data.rates) {
    throw new Error('Invalid response from fallback API');
  }

  return response.data.rates;
};

/**
 * Fetch exchange rates from API
 * Tries primary API first, then fallback if primary fails
 * 
 * @returns {Promise<Object>} Object with rates and timestamp
 * @throws {Error} If both APIs fail
 */
const fetchExchangeRates = async () => {
  try {
    console.log('[Currency Service] Fetching exchange rates from API...');
    
    let rates = {};
    let apiUsed = 'unknown';

    // Try primary API first
    try {
      rates = await fetchFromPrimaryAPI();
      apiUsed = 'exchangerate.host';
    } catch (primaryError) {
      console.warn('[Currency Service] Primary API failed:', primaryError.message);
      console.log('[Currency Service] Attempting fallback API...');
      
      // Try fallback API
      try {
        rates = await fetchFromFallbackAPI();
        apiUsed = 'frankfurter.app';
      } catch (fallbackError) {
        console.error('[Currency Service] Fallback API also failed:', fallbackError.message);
        throw new Error('Both APIs failed');
      }
    }

    // Log available currencies for debugging
    const availableCurrencies = Object.keys(rates);
    console.log(`[Currency Service] Fetched ${availableCurrencies.length} exchange rates from ${apiUsed}`);
    console.log(`[Currency Service] Sample currencies: ${availableCurrencies.slice(0, 10).join(', ')}`);
    
    // Check if EGP is in the response
    if (rates.EGP) {
      console.log(`[Currency Service] ✓ EGP rate found: ${rates.EGP}`);
    } else {
      console.warn('[Currency Service] ⚠ WARNING: EGP rate NOT found in API response');
      console.log(`[Currency Service] Available currencies (${availableCurrencies.length}): ${availableCurrencies.slice(0, 30).join(', ')}...`);
      
      // Try to manually add common Middle Eastern currencies if missing
      // This is a temporary fix - ideally the API should include all currencies
      if (!rates.EGP && availableCurrencies.length > 0) {
        console.warn('[Currency Service] EGP not available from API. Prices will not be converted for EGP.');
      }
    }

    // Add USD rate (base currency, always 1)
    const finalRates = {
      [BASE_CURRENCY]: 1,
      ...rates
    };

    const result = {
      rates: finalRates,
      lastUpdated: Date.now(),
      apiSource: apiUsed
    };

    console.log(`[Currency Service] ✓ Successfully fetched exchange rates from ${apiUsed}`);
    console.log(`[Currency Service] Total rates in cache: ${Object.keys(finalRates).length}`);
    return result;
  } catch (error) {
    console.error('[Currency Service] ✗ Error fetching exchange rates:', error.message);
    if (error.response) {
      console.error('[Currency Service] API Response Status:', error.response.status);
      console.error('[Currency Service] API Response Data:', JSON.stringify(error.response.data).substring(0, 200));
    }
    throw error;
  }
};

/**
 * Save exchange rates to cache (in-memory or Redis)
 * 
 * @param {Object} cacheData - Object with rates and lastUpdated
 * @returns {Promise<void>}
 */
const saveToCache = async (cacheData) => {
  if (redisClient) {
    // Use Redis cache
    try {
      await redisClient.setex(
        getCacheKey(),
        3600, // 1 hour TTL
        JSON.stringify(cacheData)
      );
      console.log('[Currency Service] Saved rates to Redis cache');
    } catch (error) {
      console.error('[Currency Service] Error saving to Redis:', error.message);
      // Fallback to in-memory cache
      exchangeRateCache = cacheData;
    }
  } else {
    // Use in-memory cache
    exchangeRateCache = cacheData;
    console.log('[Currency Service] Saved rates to in-memory cache');
  }
};

/**
 * Load exchange rates from cache (in-memory or Redis)
 * 
 * @returns {Promise<Object|null>} Cached data or null if not found/invalid
 */
const loadFromCache = async () => {
  if (redisClient) {
    // Load from Redis
    try {
      const cached = await redisClient.get(getCacheKey());
      if (cached) {
        const cacheData = JSON.parse(cached);
        if (isCacheValid(cacheData.lastUpdated)) {
          console.log('[Currency Service] Loaded rates from Redis cache');
          return cacheData;
        } else {
          console.log('[Currency Service] Redis cache expired, will refresh');
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('[Currency Service] Error loading from Redis:', error.message);
      // Fallback to in-memory cache
      if (isCacheValid(exchangeRateCache.lastUpdated)) {
        return exchangeRateCache;
      }
      return null;
    }
  } else {
    // Load from in-memory cache
    if (isCacheValid(exchangeRateCache.lastUpdated)) {
      console.log('[Currency Service] Loaded rates from in-memory cache');
      return exchangeRateCache;
    }
    return null;
  }
};

/**
 * Initialize exchange rates cache
 * Fetches rates from API and stores in cache
 * Called on server startup and by cron job
 * 
 * @returns {Promise<void>}
 */
const initializeRates = async () => {
  try {
    const cacheData = await fetchExchangeRates();
    await saveToCache(cacheData);
  } catch (error) {
    console.error('[Currency Service] Failed to initialize rates:', error.message);
    // Set default rates (USD only) if API fails
    const defaultCache = {
      rates: { [BASE_CURRENCY]: 1 },
      lastUpdated: Date.now()
    };
    await saveToCache(defaultCache);
    console.log('[Currency Service] Using default rates (USD only)');
  }
};

/**
 * Get exchange rates (from cache or fetch if expired)
 * 
 * @returns {Promise<Object>} Object with rates and lastUpdated
 */
const getExchangeRates = async () => {
  // Try to load from cache
  let cacheData = await loadFromCache();

  // If cache is invalid or missing, fetch fresh rates
  if (!cacheData) {
    try {
      cacheData = await fetchExchangeRates();
      await saveToCache(cacheData);
    } catch (error) {
      console.error('[Currency Service] Failed to fetch rates, using stale cache if available');
      // If fetch fails, try to use stale cache as fallback
      if (redisClient) {
        try {
          const stale = await redisClient.get(getCacheKey());
          if (stale) {
            cacheData = JSON.parse(stale);
            console.log('[Currency Service] Using stale cache as fallback');
          }
        } catch (e) {
          // Ignore Redis errors
        }
      } else if (exchangeRateCache.lastUpdated) {
        cacheData = exchangeRateCache;
        console.log('[Currency Service] Using stale in-memory cache as fallback');
      }

      // Ultimate fallback: USD only
      if (!cacheData) {
        cacheData = {
          rates: { [BASE_CURRENCY]: 1 },
          lastUpdated: Date.now()
        };
      }
    }
  }

  return cacheData;
};

/**
 * Convert amount from base currency (USD) to target currency
 * 
 * @param {number} amount - Amount in base currency (USD)
 * @param {string} targetCurrency - Target currency code (e.g., 'EGP', 'AED')
 * @returns {Promise<number>} Converted amount
 */
const convertCurrency = async (amount, targetCurrency) => {
  // If target is base currency, no conversion needed
  if (targetCurrency === BASE_CURRENCY) {
    return amount;
  }

  // Get exchange rates
  const { rates } = await getExchangeRates();

  // Debug: Log available currencies if rate is missing
  if (!rates[targetCurrency]) {
    const availableCurrencies = Object.keys(rates);
    console.warn(`[Currency Service] Rate not found for ${targetCurrency}`);
    console.warn(`[Currency Service] Available currencies (${availableCurrencies.length}): ${availableCurrencies.slice(0, 20).join(', ')}...`);
    console.warn(`[Currency Service] Using rate = 1 (no conversion) for ${targetCurrency}`);
    return amount;
  }

  // Get rate for target currency
  const rate = rates[targetCurrency];

  // If rate is invalid, return original amount (fallback)
  if (!rate || rate === 0 || isNaN(rate)) {
    console.warn(`[Currency Service] Invalid rate for ${targetCurrency}: ${rate}, using 1 (no conversion)`);
    return amount;
  }

  // Convert and round to 2 decimal places
  const converted = amount * rate;
  return Math.round(converted * 100) / 100;
};

/**
 * Get currency code from country code
 * 
 * @param {string} countryCode - ISO country code (e.g., 'US', 'EG', 'AE')
 * @returns {string} Currency code (e.g., 'USD', 'EGP', 'AED')
 */
const getCurrencyFromCountry = (countryCode) => {
  if (!countryCode) {
    return BASE_CURRENCY; // Default to USD
  }

  const upperCountryCode = countryCode.toUpperCase();
  return COUNTRY_TO_CURRENCY[upperCountryCode] || BASE_CURRENCY;
};

/**
 * Get all supported currencies
 * 
 * @returns {Array<string>} Array of currency codes
 */
const getSupportedCurrencies = () => {
  return Object.values(COUNTRY_TO_CURRENCY);
};

/**
 * Get all supported countries
 * 
 * @returns {Array<string>} Array of country codes
 */
const getSupportedCountries = () => {
  return Object.keys(COUNTRY_TO_CURRENCY);
};

/**
 * Get country to currency mapping
 * 
 * @returns {Object} Mapping object
 */
const getCountryCurrencyMap = () => {
  return { ...COUNTRY_TO_CURRENCY };
};

/**
 * Force refresh exchange rates (manual update)
 * Useful for testing or when cache needs immediate update
 * 
 * @returns {Promise<Object>} Updated rates
 */
const forceRefreshRates = async () => {
  console.log('[Currency Service] Force refreshing exchange rates...');
  try {
    const cacheData = await fetchExchangeRates();
    await saveToCache(cacheData);
    console.log('[Currency Service] Force refresh completed successfully');
    return cacheData;
  } catch (error) {
    console.error('[Currency Service] Force refresh failed:', error.message);
    throw error;
  }
};

module.exports = {
  // Main functions
  convertCurrency,
  getCurrencyFromCountry,
  initializeRates,
  getExchangeRates,
  forceRefreshRates,
  
  // Configuration
  setRedisClient,
  BASE_CURRENCY,
  
  // Utility functions
  getSupportedCurrencies,
  getSupportedCountries,
  getCountryCurrencyMap,
  
  // For testing/debugging
  isCacheValid,
  loadFromCache
};

