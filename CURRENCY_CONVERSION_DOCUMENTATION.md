# Currency Conversion System Documentation

## Overview / نظرة عامة

This system automatically converts product prices based on the user's country, detected from their IP address. It uses intelligent caching to minimize API calls and ensure optimal performance.

هذا النظام يحول أسعار المنتجات تلقائياً بناءً على بلد المستخدم، الذي يتم اكتشافه من عنوان IP الخاص به. يستخدم تخزيناً مؤقتاً ذكياً لتقليل استدعاءات API وضمان الأداء الأمثل.

---

## Features / المميزات

### 1. Automatic Country Detection / اكتشاف البلد التلقائي
- Detects user country from IP address using free geolocation service
- Maps country to currency automatically
- Falls back to USD if detection fails

### 2. Intelligent Caching / التخزين المؤقت الذكي
- Exchange rates fetched only once per hour
- Stored in-memory (or Redis for distributed systems)
- All conversions use cached rates (no API calls per request)
- Auto-refreshes when cache expires

### 3. Hourly Auto-Updates / التحديثات التلقائية كل ساعة
- Cron job updates rates every hour automatically
- Runs in background without affecting requests
- Continues even if one update fails

### 4. Server Restart Handling / التعامل مع إعادة تشغيل الخادم
- Automatically loads rates on server startup
- Ensures cache is always available

---

## File Structure / هيكل الملفات

```
magnet/
├── services/
│   ├── currency-service.js          # Main currency service with caching
│   └── currency-service-redis.js    # Optional Redis configuration
├── middleware/
│   └── detect-country-middleware.js # IP-based country detection
├── jobs/
│   └── currency-update-job.js       # Hourly cron job
├── controllers/
│   └── user/
│       └── products/
│           └── products-controller.js # Updated with currency conversion
├── routes/
│   └── user/
│       └── products/
│           └── products-routes.js    # Updated with detectCountry middleware
└── index.js                          # Server startup with initialization
```

---

## How It Works / كيف يعمل النظام

### Step 1: Country Detection / الخطوة 1: اكتشاف البلد

When a user requests products from `/api/v1/user/products`:

1. **detectCountry middleware** extracts IP from request headers
2. Calls `ip-api.com` (free service) to get country code
3. Maps country code to currency using `COUNTRY_TO_CURRENCY` map
4. Attaches `req.userCountry` and `req.userCurrency` to request

**Example:**
- IP: `41.45.123.45` → Country: `EG` → Currency: `EGP`
- IP: `197.45.123.45` → Country: `AE` → Currency: `AED`

### Step 2: Price Conversion / الخطوة 2: تحويل السعر

In the products controller:

1. Gets user currency from `req.userCurrency` (set by middleware)
2. For each product, converts `pricePerUnit` from USD to user currency
3. Uses cached exchange rates (no API call)
4. Returns products with converted prices and currency code

**Example Response:**
```json
{
  "status": "success",
  "data": {
    "products": [
      {
        "id": "...",
        "name": {...},
        "pricePerUnit": "305.50",  // Converted from $10 USD to EGP
        ...
      }
    ],
    "currency": "EGP"
  }
}
```

### Step 3: Caching Strategy / الخطوة 3: استراتيجية التخزين المؤقت

**Cache Flow:**

```
Request 1 (Hour 0:00) → Cache Empty → Fetch from API → Store in Cache → Use
Request 2 (Hour 0:05) → Cache Valid → Use Cached Rates
Request 3 (Hour 0:30) → Cache Valid → Use Cached Rates
...
Request N (Hour 1:00) → Cache Expired → Fetch from API → Update Cache → Use
```

**Cache Structure:**
```javascript
{
  rates: {
    USD: 1,
    EGP: 30.55,
    AED: 3.67,
    SAR: 3.75,
    // ... all currencies
  },
  lastUpdated: 1704067200000  // Timestamp
}
```

### Step 4: Hourly Updates / الخطوة 4: التحديثات كل ساعة

**Cron Job Schedule:**
- Runs every hour at minute 0 (1:00, 2:00, 3:00, etc.)
- Cron expression: `'0 * * * *'`
- Fetches fresh rates and updates cache
- Continues running even if one update fails

---

## API Optimization / تحسين استخدام API

### Before / قبل:
- **1000 requests/hour** = **1000 API calls** ❌
- Each request calls exchange rate API
- High API usage, slower responses

### After / بعد:
- **1000 requests/hour** = **1 API call** ✅
- All requests use cached rates
- Minimal API usage, fast responses

### Cache Duration / مدة التخزين المؤقت:
- **1 hour** = Fresh rates, minimal API calls
- Cache auto-refreshes when expired
- Fallback to stale cache if API fails

---

## Configuration / الإعدادات

### Base Currency / العملة الأساسية
All product prices are stored in **USD** (base currency).

جميع أسعار المنتجات مخزنة بالدولار الأمريكي (العملة الأساسية).

### Supported Countries / البلدان المدعومة

The system supports **60+ countries** including:

- **Middle East:** Egypt (EGP), UAE (AED), Saudi Arabia (SAR), Kuwait (KWD), Qatar (QAR), etc.
- **Europe:** UK (GBP), Germany (EUR), France (EUR), etc.
- **Asia:** China (CNY), Japan (JPY), India (INR), etc.
- **Americas:** Canada (CAD), Mexico (MXN), Brazil (BRL), etc.
- **Africa:** South Africa (ZAR), Nigeria (NGN), etc.

See `COUNTRY_TO_CURRENCY` in `currency-service.js` for full list.

### Fallback Behavior / السلوك الاحتياطي

1. **Geolocation fails** → Use `USD`
2. **Country not mapped** → Use `USD`
3. **Exchange rate missing** → Use rate = 1 (no conversion)
4. **API fails** → Use cached rates (even if stale)

---

## Installation / التثبيت

### 1. Install Dependencies / تثبيت التبعيات

```bash
npm install axios node-cron
```

### 2. Files Already Created / الملفات تم إنشاؤها

All required files are already in place:
- ✅ `services/currency-service.js`
- ✅ `middleware/detect-country-middleware.js`
- ✅ `jobs/currency-update-job.js`
- ✅ Updated `controllers/user/products/products-controller.js`
- ✅ Updated `routes/user/products/products-routes.js`
- ✅ Updated `index.js`

### 3. Start Server / بدء الخادم

```bash
npm start
# or
npm run dev
```

The system will:
1. Initialize exchange rates on startup
2. Start hourly cron job
3. Begin detecting countries and converting prices

---

## Redis Configuration (Optional) / إعداد Redis (اختياري)

For distributed systems or persistent cache:

### 1. Install Redis

```bash
npm install redis
```

### 2. Configure Redis

Edit `services/currency-service-redis.js` and uncomment the code.

### 3. Update index.js

```javascript
// At the top
const { redisClient } = require('./services/currency-service-redis');

// The currency service will automatically use Redis if configured
```

### Benefits of Redis / فوائد Redis:
- **Distributed caching:** Shared cache across multiple server instances
- **Persistence:** Cache survives server restarts
- **Better performance:** For high-traffic applications

---

## API Endpoints / نقاط النهاية

### GET /api/v1/user/products

**Description:** Get all products with prices converted to user's currency

**Response:**
```json
{
  "status": "success",
  "data": {
    "products": [...],
    "currency": "EGP",
    "pagination": {...}
  }
}
```

### GET /api/v1/user/products/:id

**Description:** Get single product with converted price

**Response:**
```json
{
  "status": "success",
  "data": {
    "product": {...},
    "currency": "EGP"
  }
}
```

---

## Testing / الاختبار

### Test Currency Conversion

1. **From Egypt (EGP):**
   ```bash
   curl http://localhost:5000/api/v1/user/products
   # Should return currency: "EGP" with converted prices
   ```

2. **From UAE (AED):**
   ```bash
   # Use VPN or proxy from UAE
   curl http://localhost:5000/api/v1/user/products
   # Should return currency: "AED" with converted prices
   ```

### Test Cache

1. Make multiple requests quickly
2. Check logs - should see "Loaded rates from cache" after first request
3. Wait 1 hour - should see "Fetching exchange rates from API"

---

## Monitoring / المراقبة

### Log Messages / رسائل السجل

**Currency Service:**
- `[Currency Service] Fetching exchange rates from API...`
- `[Currency Service] Successfully fetched exchange rates`
- `[Currency Service] Loaded rates from in-memory cache`

**Country Detection:**
- `[Country Detection] Detected country for IP X.X.X.X: EG`
- `[Country Detection] Using cached country for IP X.X.X.X: EG`

**Cron Job:**
- `[Currency Update Job] Running scheduled exchange rate update...`
- `[Currency Update Job] Exchange rates updated successfully`

---

## Troubleshooting / استكشاف الأخطاء

### Issue: Prices not converting

**Solution:**
1. Check if `detectCountry` middleware is applied to routes
2. Verify `req.userCurrency` is set in controller
3. Check currency service logs

### Issue: API rate limit exceeded

**Solution:**
- Cache should prevent this (only 1 call/hour)
- If still happening, check cron job is running
- Verify cache is working (check logs)

### Issue: Wrong country detected

**Solution:**
- IP geolocation may be inaccurate for some IPs
- Check IP extraction logic in middleware
- Consider using paid geolocation service for better accuracy

---

## Performance / الأداء

### Cache Hit Rate / معدل نجاح التخزين المؤقت

- **Expected:** 99.9%+ (only 1 miss per hour)
- **API Calls:** 1 per hour (regardless of request volume)
- **Response Time:** < 5ms for conversion (using cache)

### Scalability / قابلية التوسع

- **In-memory cache:** Good for single server
- **Redis cache:** Recommended for multiple servers
- **Handles:** Thousands of requests per hour with 1 API call

---

## Security / الأمان

### IP Extraction / استخراج IP

The middleware handles:
- `X-Forwarded-For` header (proxies/load balancers)
- `X-Real-IP` header (nginx)
- `CF-Connecting-IP` header (Cloudflare)
- Direct connection IP

### API Security / أمان API

- Uses free, public APIs (no API keys required)
- No sensitive data transmitted
- All conversions happen server-side

---

## Future Enhancements / التحسينات المستقبلية

1. **User Preference:** Allow users to manually select currency
2. **Historical Rates:** Store rate history for analytics
3. **Multiple Base Currencies:** Support products in different base currencies
4. **Rate Alerts:** Notify when rates change significantly

---

## Support / الدعم

For issues or questions:
1. Check logs for error messages
2. Verify all dependencies are installed
3. Ensure MongoDB is connected (for server startup)
4. Check network connectivity for API calls

---

## License / الترخيص

This implementation uses:
- **exchangerate.host** - Free exchange rate API
- **ip-api.com** - Free IP geolocation API

Both services are free for reasonable usage.

---

**Last Updated:** 2024
**Version:** 1.0.0

