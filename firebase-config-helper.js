const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=== Firebase Configuration Helper ===');
console.log('This script will help you update your .env.local file with Firebase configuration.');
console.log('You can find your Firebase config in the Firebase console:');
console.log('1. Go to Firebase Console (https://console.firebase.google.com/)');
console.log('2. Select your project');
console.log('3. Click on the web app (</>) icon');
console.log('4. Click "Configuration" and copy the firebaseConfig object\n');

console.log('Paste your Firebase configuration object below (the part that looks like:');
console.log(`{
  apiKey: "xxx",
  authDomain: "xxx",
  projectId: "xxx",
  ...
}\n`);

let configInput = '';

rl.on('line', (line) => {
  if (line.trim() === '') {
    processConfig();
  } else {
    configInput += line + '\n';
  }
});

function processConfig() {
  try {
    // Clean up the input to make it valid JSON
    let jsonStr = configInput
      .replace(/const firebaseConfig = /, '')
      .replace(/var firebaseConfig = /, '')
      .replace(/firebaseConfig = /, '')
      .replace(/apiKey:/g, '"apiKey":')
      .replace(/authDomain:/g, '"authDomain":')
      .replace(/projectId:/g, '"projectId":')
      .replace(/storageBucket:/g, '"storageBucket":')
      .replace(/messagingSenderId:/g, '"messagingSenderId":')
      .replace(/appId:/g, '"appId":')
      .replace(/measurementId:/g, '"measurementId":')
      .replace(/,(\s*[}\]])/g, '$1')
      .replace(/([{,]\s*)"([^"]+)":/g, '$1$2:')
      .replace(/([{,]\s*)([a-zA-Z0-9_]+):/g, '$1"$2":');
    
    // Try to parse the JSON
    const config = JSON.parse(jsonStr);
    
    // Read the current .env.local file
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.error('Error: .env.local file not found. Run setup-env.js first.');
      rl.close();
      return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update the environment variables
    envContent = envContent
      .replace(/NEXT_PUBLIC_FIREBASE_API_KEY=.*/, `NEXT_PUBLIC_FIREBASE_API_KEY=${config.apiKey || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=.*/, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${config.authDomain || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_PROJECT_ID=.*/, `NEXT_PUBLIC_FIREBASE_PROJECT_ID=${config.projectId || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=.*/, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${config.storageBucket || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=.*/, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${config.messagingSenderId || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_APP_ID=.*/, `NEXT_PUBLIC_FIREBASE_APP_ID=${config.appId || ''}`)
      .replace(/NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=.*/, `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=${config.measurementId || ''}`);
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, envContent);
    
    console.log('\nFirebase configuration has been successfully updated in .env.local!');
    console.log('\nNext steps:');
    console.log('1. Set up OAuth providers (Google, Facebook, GitHub) in their respective developer consoles');
    console.log('2. Update the OAuth client IDs and secrets in your .env.local file');
    console.log('3. Generate a service account key for Firebase Admin SDK and update the related variables');
    console.log('4. Set NEXTAUTH_SECRET to a strong random string');
    console.log('\nFor detailed instructions, refer to FIREBASE_SETUP.md');
    
    rl.close();
  } catch (error) {
    console.error('Error processing the configuration:', error.message);
    console.log('Please check your input and try again.');
    configInput = '';
    rl.prompt();
  }
}

console.log('Paste your configuration and press Enter twice when done:');
rl.prompt(); 