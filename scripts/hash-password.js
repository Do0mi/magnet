/**
 * Simple CLI helper to hash passwords using the same bcrypt configuration
 * as the project (bcryptjs with 10 salt rounds).
 *
 * Usage:
 *   node scripts/hash-password.js "MySecurePassword"
 */
const bcrypt = require('bcryptjs');

const [, , rawPassword] = process.argv;

if (!rawPassword) {
  console.error('Usage: node scripts/hash-password.js "<password>"');
  process.exit(1);
}

(async () => {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(rawPassword, saltRounds);
    console.log(`Password: ${rawPassword}`);
    console.log(`Hash:     ${hash}`);
  } catch (error) {
    console.error('Error hashing password:', error.message);
    process.exit(1);
  }
})();

