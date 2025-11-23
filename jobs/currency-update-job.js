/**
 * Currency Update Cron Job
 * 
 * This job automatically updates exchange rates every hour.
 * It uses node-cron to schedule the updates.
 * 
 * SCHEDULE:
 * - Runs every hour at minute 0 (e.g., 1:00, 2:00, 3:00, etc.)
 * - Cron expression: '0 * * * *' (minute 0 of every hour)
 * 
 * BEHAVIOR:
 * - Fetches fresh exchange rates from API
 * - Updates the cache (in-memory or Redis)
 * - Logs success/failure for monitoring
 * - Continues running even if one update fails
 * 
 * ERROR HANDLING:
 * - Catches and logs errors without stopping the cron job
 * - Falls back to existing cache if update fails
 * 
 * @module jobs/currency-update-job
 */

const cron = require('node-cron');
const { initializeRates } = require('../services/currency-service');

let cronJob = null;

/**
 * Initialize and start the currency update cron job
 * 
 * @returns {Object} Cron job instance
 */
const startCurrencyUpdateJob = () => {
  // Schedule: Run every hour at minute 0
  // Cron expression: '0 * * * *' means:
  // - 0: minute 0
  // - *: every hour
  // - *: every day of month
  // - *: every month
  // - *: every day of week
  const cronExpression = '0 * * * *'; // Every hour

  console.log('[Currency Update Job] Starting hourly exchange rate update job...');

  cronJob = cron.schedule(cronExpression, async () => {
    console.log('[Currency Update Job] Running scheduled exchange rate update...');
    
    try {
      await initializeRates();
      console.log('[Currency Update Job] Exchange rates updated successfully');
    } catch (error) {
      console.error('[Currency Update Job] Failed to update exchange rates:', error.message);
      // Don't throw - let the job continue running
    }
  }, {
    scheduled: true,
    timezone: 'UTC' // Use UTC timezone for consistency
  });

  console.log('[Currency Update Job] Cron job scheduled successfully');
  console.log('[Currency Update Job] Next update will run at the top of the next hour');

  return cronJob;
};

/**
 * Stop the currency update cron job
 */
const stopCurrencyUpdateJob = () => {
  if (cronJob) {
    cronJob.stop();
    console.log('[Currency Update Job] Cron job stopped');
  }
};

/**
 * Manually trigger an exchange rate update (for testing or manual refresh)
 * 
 * @returns {Promise<void>}
 */
const manualUpdate = async () => {
  console.log('[Currency Update Job] Manual update triggered...');
  try {
    await initializeRates();
    console.log('[Currency Update Job] Manual update completed successfully');
  } catch (error) {
    console.error('[Currency Update Job] Manual update failed:', error.message);
    throw error;
  }
};

module.exports = {
  startCurrencyUpdateJob,
  stopCurrencyUpdateJob,
  manualUpdate
};

