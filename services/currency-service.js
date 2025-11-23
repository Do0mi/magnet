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

// Exchange rate API endpoint
const EXCHANGE_RATE_API = 'https://api.exchangerate.host/latest';

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
const fetchExchangeRates = async () => {
  try {
    console.log('[Currency Service] Fetching exchange rates from API...');
    
    const response = await axios.get(EXCHANGE_RATE_API, {
      params: {
        base: BASE_CURRENCY
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || !response.data.rates) {
      throw new Error('Invalid API response structure');
    }

    // Add USD rate (base currency, always 1)
    const rates = {
      [BASE_CURRENCY]: 1,
      ...response.data.rates
    };

    const result = {
      rates,
      lastUpdated: Date.now()
    };

    console.log('[Currency Service] Successfully fetched exchange rates');
    return result;
  } catch (error) {
    console.error('[Currency Service] Error fetching exchange rates:', error.message);
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

  // Get rate for target currency
  const rate = rates[targetCurrency];

  // If rate is missing, return original amount (fallback)
  if (!rate || rate === 0) {
    console.warn(`[Currency Service] Rate not found for ${targetCurrency}, using 1 (no conversion)`);
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

module.exports = {
  // Main functions
  convertCurrency,
  getCurrencyFromCountry,
  initializeRates,
  getExchangeRates,
  
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

