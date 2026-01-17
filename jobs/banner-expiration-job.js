/**
 * Banner Expiration Cron Job
 * 
 * This job automatically disables expired banners by setting isAllowed to false.
 * It uses node-cron to schedule the updates.
 * 
 * SCHEDULE:
 * - Runs every 15 minutes
 * - Cron expression: '*\/15 * * * *' (every 15 minutes)
 * 
 * BEHAVIOR:
 * - Finds all banners where isAllowed is true and 'to' date has passed
 * - Sets isAllowed to false for expired banners
 * - Logs success/failure for monitoring
 * - Continues running even if one update fails
 * 
 * ERROR HANDLING:
 * - Catches and logs errors without stopping the cron job
 * - Continues to next run if current run fails
 * 
 * @module jobs/banner-expiration-job
 */

const cron = require('node-cron');
const { disableExpiredBanners } = require('../utils/banner-helpers');

let cronJob = null;

/**
 * Initialize and start the banner expiration cron job
 * 
 * @returns {Object} Cron job instance
 */
const startBannerExpirationJob = () => {
  // Schedule: Run every 15 minutes
  // Cron expression: '*/15 * * * *' means:
  // - */15: every 15 minutes
  // - *: every hour
  // - *: every day of month
  // - *: every month
  // - *: every day of week
  const cronExpression = '*/15 * * * *'; // Every 15 minutes

  console.log('[Banner Expiration Job] Starting banner expiration check job...');

  cronJob = cron.schedule(cronExpression, async () => {
    console.log('[Banner Expiration Job] Running scheduled banner expiration check...');
    
    try {
      const result = await disableExpiredBanners();
      if (result.disabledCount > 0) {
        console.log(`[Banner Expiration Job] Disabled ${result.disabledCount} expired banner(s)`);
      } else {
        console.log('[Banner Expiration Job] No expired banners found');
      }
    } catch (error) {
      console.error('[Banner Expiration Job] Failed to check banner expiration:', error.message);
      // Don't throw - let the job continue running
    }
  }, {
    scheduled: true,
    timezone: 'UTC' // Use UTC timezone for consistency
  });

  console.log('[Banner Expiration Job] Cron job scheduled successfully');
  console.log('[Banner Expiration Job] Will check for expired banners every 15 minutes');

  return cronJob;
};

/**
 * Stop the banner expiration cron job
 */
const stopBannerExpirationJob = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('[Banner Expiration Job] Cron job stopped');
  }
};

/**
 * Manually trigger a banner expiration check (for testing or manual refresh)
 * 
 * @returns {Promise<Object>} Result with count of disabled banners
 */
const manualCheck = async () => {
  console.log('[Banner Expiration Job] Manual expiration check triggered...');
  try {
    const result = await disableExpiredBanners();
    console.log(`[Banner Expiration Job] Manual check completed. Disabled ${result.disabledCount} banner(s)`);
    return result;
  } catch (error) {
    console.error('[Banner Expiration Job] Manual check failed:', error.message);
    throw error;
  }
};

module.exports = {
  startBannerExpirationJob,
  stopBannerExpirationJob,
  manualCheck
};
