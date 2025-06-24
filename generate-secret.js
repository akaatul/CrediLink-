const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure random string
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Path to the .env.local file
const envPath = path.join(__dirname, '.env.local');

// Check if file exists
if (!fs.existsSync(envPath)) {
  console.error('Error: .env.local file not found. Run setup-env.js first.');
  process.exit(1);
}

// Read the current .env.local file
let envContent = fs.readFileSync(envPath, 'utf8');

// Generate a new secret
const newSecret = generateSecureSecret();

// Update the NEXTAUTH_SECRET in the .env.local file
envContent = envContent.replace(/NEXTAUTH_SECRET=.*/, `NEXTAUTH_SECRET=${newSecret}`);

// Write the updated content back to the file
fs.writeFileSync(envPath, envContent);

console.log('=== NextAuth Secret Generator ===');
console.log('A secure random string has been generated and set as your NEXTAUTH_SECRET.');
console.log('Your .env.local file has been updated successfully!');
console.log('\nSecret: ' + newSecret);
console.log('\nNote: Keep this secret safe and do not share it publicly.'); 