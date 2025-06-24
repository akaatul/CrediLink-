# CrediLink+ Learning Platform

A modern, engaging e-learning platform powered by Web3 technologies, offering blockchain-verified certificates, curated learning paths, and direct job market connections.

## Key Features

1. **Blockchain-Verified Certificates**
   - Immutable proof of skill acquisition
   - Easily shareable with potential employers
   - Verification through blockchain explorer

2. **Curated Learning Paths**
   - Industry-aligned course sequences
   - Modern curriculum focused on Web3 and blockchain technologies
   - Progress tracking and achievement badges

3. **AI-Generated Quizzes & Assessments**
   - Automatic quiz generation from video content using Firebase AI Logic
   - Personalized feedback based on performance
   - Adaptive learning suggestions

4. **Direct Job Market Connection**
   - Job board with positions requiring verified skills
   - Direct application using platform credentials
   - Employer verification of skills

## Technology Stack

- **[Next.js 14](https://nextjs.org/)** - React framework for building modern web applications
- **[TypeScript](https://www.typescriptlang.org/)** - Statically typed JavaScript for improved developer experience
- **[TailwindCSS](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Firebase](https://firebase.google.com/)** - Application development platform providing Authentication, Firestore Database and Storage services
- **[Firebase AI Logic](https://firebase.google.com/products/firebase-ai-logic)** - AI services for generating quizzes and final tests
- **[NextAuth.js](https://next-auth.js.org/)** - Authentication for Next.js applications
- **[Framer Motion](https://www.framer.com/motion/)** - Animation library for React

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase project with Firestore, Authentication, and Storage enabled
- Gemini API key (for Firebase AI Logic)

### Environment Setup

1. Clone the repository
2. Create a `.env.local` file in the project root with the following variables:

```
# Firebase Configuration
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

# OAuth Providers (optional)
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
```

3. Run `npm install` or `yarn` to install dependencies
4. Run `npm run dev` or `yarn dev` to start the development server

### Firebase AI Logic Setup

CrediLink+ uses Firebase AI Logic (previously known as Vertex AI in Firebase) to generate quizzes from course video content. To set this up:

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Navigate to your project
3. Select "AI Logic" from the left sidebar
4. Follow the setup steps for the Gemini API
5. Copy your API key and add it to `.env.local` as `NEXT_PUBLIC_GEMINI_API_KEY`

For more details, see the [GEMINI_SETUP.md](./GEMINI_SETUP.md) file.

## Development Guidelines

- Follow the Next.js 13+ App Router structure
- Use TypeScript for type safety
- Implement responsive design with Tailwind CSS
- Follow atomic design principles for components
- Add comprehensive JSDoc comments for documentation

## Deployment

1. Set up Firebase hosting
2. Configure environment variables in Firebase
3. Run `npm run build` or `yarn build`
4. Deploy using `firebase deploy`

## Certificate Migration

If you are experiencing issues with certificate generation or viewing after completing courses, you can run the certificate migration script to transfer certificates from the legacy 'certificates' collection to the new 'credentials' collection:

1. Add the following script to your package.json:
   ```json
   "scripts": {
     // ... other scripts
     "migrate-certificates": "node -r dotenv/config migrate-certificates.js"
   }
   ```

2. Run the migration script:
   ```
   npm run migrate-certificates
   ```

The script will transfer all certificate data from the old collection to the new one, ensuring compatibility with the updated schema. This process is safe and won't delete original data.

## License

[MIT](LICENSE) 