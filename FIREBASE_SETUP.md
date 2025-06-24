# Firebase Setup Guide for CrediLink+

This guide will help you set up Firebase Authentication and Firestore Database for the CrediLink+ application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics if desired

## Step 2: Register Your Web App

1. In the Firebase console, click on the gear icon (⚙️) next to "Project Overview" and select "Project settings"
2. Scroll down to "Your apps" section and click on the web icon (</>) to add a web app
3. Enter a nickname for your app (e.g., "CrediLink+ Web")
4. Check the "Also set up Firebase Hosting" option if desired
5. Click "Register app"
6. Copy the Firebase configuration object

## Step 3: Create Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Firebase Admin (Service Account)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

Replace the placeholder values with your actual Firebase configuration.

## Step 4: Enable Authentication Methods

1. In the Firebase console, navigate to "Authentication" from the left sidebar
2. Click on the "Sign-in method" tab
3. Enable the following authentication methods:
   - Email/Password
   - Google
   - Facebook
   - GitHub
   - (Optional) Twitter, Apple, etc.
4. For OAuth providers (Google, Facebook, GitHub), you'll need to configure OAuth consent screens and credentials in their respective developer consoles

## Step 5: Set Up Firestore Database

1. In the Firebase console, navigate to "Firestore Database" from the left sidebar
2. Click "Create database"
3. Choose "Start in production mode" or "Start in test mode" (for development)
4. Select a location for your database
5. Click "Enable"

## Step 6: Set Up Firestore Security Rules

1. In the Firestore Database section, go to the "Rules" tab
2. Update the security rules to match your application's requirements:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read and write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Add more rules as needed for your application
  }
}
```

## Step 7: Generate a Service Account (for Admin SDK)

1. In the Firebase console, go to "Project settings"
2. Navigate to the "Service accounts" tab
3. Click "Generate new private key"
4. Save the JSON file securely
5. Extract the following values from the JSON file:
   - `project_id` → FIREBASE_PROJECT_ID
   - `client_email` → FIREBASE_CLIENT_EMAIL
   - `private_key` → FIREBASE_PRIVATE_KEY

## Step 8: Configure OAuth Providers

### Google OAuth

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select your Firebase project
3. Navigate to "APIs & Services" > "Credentials"
4. Configure the OAuth consent screen
5. Create OAuth client ID credentials for a web application
6. Add your domain to the authorized JavaScript origins
7. Add your redirect URI (e.g., `http://localhost:3000/api/auth/callback/google`)
8. Copy the Client ID and Client Secret to your environment variables

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the Facebook Login product
4. Configure the OAuth redirect URI (e.g., `http://localhost:3000/api/auth/callback/facebook`)
5. Copy the App ID and App Secret to your environment variables

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set the Authorization callback URL (e.g., `http://localhost:3000/api/auth/callback/github`)
4. Copy the Client ID and Client Secret to your environment variables

## Step 9: Restart Your Development Server

After configuring all the environment variables, restart your development server:

```
npm run dev
```

Your CrediLink+ application should now be connected to Firebase Authentication and Firestore Database! 