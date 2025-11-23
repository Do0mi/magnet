/**
 * Detect Country Middleware
 * 
 * This middleware detects the user's country from their IP address.
 * It uses a free IP geolocation service to determine the country code.
 * 
 * HOW IT WORKS:
 * - Extracts IP address from request headers (handles proxies/load balancers)
 * - Calls ip-api.com (free, no API key required) to get country code
 * - Attaches country code and currency to req object: req.userCountry, req.userCurrency
 * - Falls back to 'US' (USD) if geolocation fails
 * 
 * IP EXTRACTION:
 * - Checks X-Forwarded-For header (for proxies/load balancers)
 * - Checks X-Real-IP header
 * - Falls back to req.connection.remoteAddress or req.socket.remoteAddress
 * 
 * CACHING:
 * - Optionally caches IP-to-country mappings to reduce API calls
 * - Cache duration: 24 hours per IP
 * 
 * @module middleware/detect-country-middleware
 */

const axios = require('axios');
const { getCurrencyFromCountry } = require('../services/currency-service');

// IP geolocation API (free, no API key required)
const IP_GEOLOCATION_API = 'http://ip-api.com/json';

// Cache for IP-to-country mappings (optional optimization)
// Structure: { 'ip': { countryCode: 'US', cachedAt: timestamp } }
const ipCountryCache = {};
const IP_CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Extract IP address from request
 * Handles various proxy and load balancer scenarios
 * 
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
const extractIP = (req) => {
  // Check X-Forwarded-For header (most common for proxies/load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }

  // Check X-Real-IP header (nginx proxy)
  if (req.headers['x-real-ip']) {
    return req.headers['x-real-ip'];
  }

  // Check CF-Connecting-IP (Cloudflare)
  if (req.headers['cf-connecting-ip']) {
    return req.headers['cf-connecting-ip'];
  }

  // Fallback to connection remote address
  return req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.ip || 
         '127.0.0.1';
};

/**
 * Check if IP country cache is valid
 * 
 * @param {string} ip - IP address
 * @returns {boolean} True if cache is valid
 */
const isIPCacheValid = (ip) => {
  const cached = ipCountryCache[ip];
  if (!cached) return false;
  
  const now = Date.now();
  return (now - cached.cachedAt) < IP_CACHE_DURATION_MS;
};

/**
 * Get country code from IP address
 * Uses ip-api.com free service (no API key required)
 * 
 * @param {string} ip - IP address
 * @returns {Promise<string>} Country code (e.g., 'US', 'EG', 'AE')
 */
const getCountryFromIP = async (ip) => {
  // Skip geolocation for localhost/private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    console.log(`[Country Detection] Local/private IP detected: ${ip}, defaulting to US`);
    return 'US';
  }

  // Check cache first
  if (isIPCacheValid(ip)) {
    const cached = ipCountryCache[ip];
    console.log(`[Country Detection] Using cached country for IP ${ip}: ${cached.countryCode}`);
    return cached.countryCode;
  }

  try {
    console.log(`[Country Detection] Fetching country for IP: ${ip}`);
    
    const response = await axios.get(`${IP_GEOLOCATION_API}/${ip}`, {
      timeout: 5000, // 5 second timeout
      params: {
        fields: 'countryCode' // Only request country code to minimize response size
      }
    });

    if (response.data && response.data.countryCode) {
      const countryCode = response.data.countryCode;
      
      // Cache the result
      ipCountryCache[ip] = {
        countryCode,
        cachedAt: Date.now()
      };

      console.log(`[Country Detection] Detected country for IP ${ip}: ${countryCode}`);
      return countryCode;
    } else {
      throw new Error('Invalid API response');
    }
  } catch (error) {
    console.error(`[Country Detection] Error detecting country for IP ${ip}:`, error.message);
    
    // On error, return default (US)
    // Cache the default to avoid repeated API calls for same IP
    ipCountryCache[ip] = {
      countryCode: 'US',
      cachedAt: Date.now()
    };
    
    return 'US';
  }
};

/**
 * Middleware to detect user country from IP address
 * 
 * Attaches to request:
 * - req.userCountry: ISO country code (e.g., 'US', 'EG', 'AE')
 * - req.userCurrency: Currency code (e.g., 'USD', 'EGP', 'AED')
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const detectCountry = async (req, res, next) => {
  try {
    // Extract IP address
    const ip = extractIP(req);
    
    // Get country code from IP
    const countryCode = await getCountryFromIP(ip);
    
    // Get currency from country
    const currency = getCurrencyFromCountry(countryCode);
    
    // Attach to request object
    req.userCountry = countryCode;
    req.userCurrency = currency;
    
    // Log for debugging (can be removed in production)
    // console.log(`[Country Detection] IP: ${ip}, Country: ${countryCode}, Currency: ${currency}`);
    
    next();
  } catch (error) {
    console.error('[Country Detection] Middleware error:', error);
    
    // Fallback to default values
    req.userCountry = 'US';
    req.userCurrency = 'USD';
    
    next(); // Continue even on error
  }
};

module.exports = detectCountry;

