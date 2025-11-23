/**
 * Manual Currency Rates Refresh Script
 * 
 * Use this script to manually refresh exchange rates
 * Run: node scripts/refresh-currency-rates.js
 * 
 * This is useful when:
 * - Rates are missing (like EGP)
 * - You want to test the API
 * - Cache needs immediate update
 */

require('dotenv').config();
const { forceRefreshRates, getExchangeRates } = require('../services/currency-service');

async function main() {
  console.log('='.repeat(50));
  console.log('Manual Currency Rates Refresh');
  console.log('='.repeat(50));
  
  try {
    // Check current rates
    console.log('\n[1] Checking current rates...');
    const currentRates = await getExchangeRates();
    const currencies = Object.keys(currentRates.rates);
    console.log(`Current rates count: ${currencies.length}`);
    console.log(`EGP available: ${currentRates.rates.EGP ? 'YES (' + currentRates.rates.EGP + ')' : 'NO'}`);
    
    // Force refresh
    console.log('\n[2] Force refreshing rates...');
    const newRates = await forceRefreshRates();
    const newCurrencies = Object.keys(newRates.rates);
    console.log(`New rates count: ${newCurrencies.length}`);
    console.log(`EGP available: ${newRates.rates.EGP ? 'YES (' + newRates.rates.EGP + ')' : 'NO'}`);
    
    // Show sample rates
    console.log('\n[3] Sample rates:');
    const sampleCurrencies = ['USD', 'EGP', 'AED', 'SAR', 'EUR', 'GBP'];
    sampleCurrencies.forEach(currency => {
      if (newRates.rates[currency]) {
        console.log(`  ${currency}: ${newRates.rates[currency]}`);
      } else {
        console.log(`  ${currency}: NOT AVAILABLE`);
      }
    });
    
    console.log('\n' + '='.repeat(50));
    console.log('Refresh completed successfully!');
    console.log('='.repeat(50));
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    process.exit(1);
  }
}

main();

