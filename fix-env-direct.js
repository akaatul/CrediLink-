const fs = require('fs');
const path = require('path');

// Path to the .env.local file
const envPath = path.join(__dirname, '.env.local');

// Function to directly fix the .env.local file
function fixEnvDirect() {
  try {
    // Define the corrected content
    const content = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-firebase-auth-domain"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-firebase-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-firebase-storage-bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-firebase-messaging-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-firebase-app-id"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="your-firebase-measurement-id"

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Firebase Admin (Service Account)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# AI Services
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key`;
    
    // Write the corrected content to the file
    fs.writeFileSync(envPath, content, 'utf-8');
    
    console.log('✅ Fixed .env.local file');
    console.log('⚠️ Please replace "your-gemini-api-key" with your actual Gemini API key');
    console.log('   Get your API key from: https://ai.google.dev/');
    
  } catch (error) {
    console.error('Error fixing .env.local file:', error);
  }
}

// Run the function
fixEnvDirect(); 