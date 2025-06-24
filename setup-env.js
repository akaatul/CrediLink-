const fs = require('fs');
const path = require('path');

// Define the content for .env.local file
const envContent = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Firebase Admin (Service Account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI Services
NEXT_PUBLIC_GEMINI_API_KEY=
`;

// Path to the .env.local file
const envPath = path.join(__dirname, '.env.local');

// Check if file already exists
if (fs.existsSync(envPath)) {
  console.log('.env.local file already exists. Skipping creation to avoid overwriting.');
} else {
  // Write the file
  fs.writeFileSync(envPath, envContent);
  console.log('.env.local file has been created successfully!');
  console.log('Please fill in the empty values with your Firebase configuration.');
}

// Display instructions
console.log('\nSetup Instructions:');
console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
console.log('2. Create a new project or select an existing one');
console.log('3. Add a web app to your project');
console.log('4. Copy the Firebase config values to your .env.local file');
console.log('5. Enable Authentication methods (Email/Password, Google, Facebook, GitHub)');
console.log('6. Create a Firestore database');
console.log('7. Set up OAuth providers in their respective developer consoles');
console.log('8. Get a Gemini API key from https://ai.google.dev/ and add it to .env.local');
console.log('\nFor detailed instructions, refer to FIREBASE_SETUP.md'); 