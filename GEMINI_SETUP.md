# Setting Up Firebase AI Logic for Quiz Generation

CrediLink+ uses Firebase AI Logic (previously known as Vertex AI in Firebase) to generate quizzes and assessments from module content. Follow these steps to set up your API access:

## Step 1: Set Up a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or use an existing one
3. Follow the setup wizard to complete the project setup

## Step 2: Enable Firebase AI Logic

1. In the Firebase Console, select your project
2. Navigate to the "AI Logic" from the left sidebar
3. Follow the guided setup to enable Firebase AI Logic for your project

## Step 3: Choose Your API Provider

Firebase AI Logic offers two ways to access Gemini models:

- **Gemini Developer API**: Best for prototyping and small-scale applications
- **Vertex AI Gemini API**: For enterprise applications requiring high availability and scalability

CrediLink+ is configured to use either provider. For simplicity, we recommend starting with the Gemini Developer API.

## Step 4: Get Your API Key

### For Gemini Developer API (Recommended for Development):

1. Go to [Google AI Studio](https://ai.google.dev/)
2. Sign in with your Google account
3. Click on "Get API key" in the top-right corner
4. Create a new API key and copy it

### For Vertex AI Gemini API (Production):

1. In your Google Cloud Console, make sure the Vertex AI API is enabled
2. Set up service account credentials following Firebase documentation
3. Configure your project for Vertex AI integration

## Step 5: Add the API Key to Your Project

1. Open your `.env.local` file in the root of the CrediLink+ project
2. Find the line `NEXT_PUBLIC_GEMINI_API_KEY=`
3. Add your API key after the equals sign, with no spaces or quotes
4. Save the file

## Code Implementation Notes

CrediLink+ has been updated to use the Firebase AI Logic client SDK:

```javascript
import { getAI, getGenerativeModel, GoogleAIBackend } from '@firebase/ai';

// Initialize FirebaseApp (already done in your app)
const firebaseApp = getApp();

// Initialize AI with the Google AI backend
const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

// Get a generative model instance
const model = getGenerativeModel(ai, { model: "gemini-1.5-flash" });

// Generate content
const result = await model.generateContent("Your prompt here");
const text = result.response.text();
```

This approach replaces the previous direct usage of the Google Generative AI SDK and provides enhanced security through Firebase's authentication and rate limiting features.

## Troubleshooting

If you encounter any issues with the quiz generation feature:

1. **Check your API key**: Make sure your API key is correctly added to the `.env.local` file
2. **Check console errors**: Look for specific error messages in your browser console
3. **Verify Firebase setup**: Ensure that your Firebase project is correctly configured
4. **Check API quotas**: The Gemini Developer API has usage limits that might affect functionality

For more information, refer to the [Firebase AI Logic documentation](https://firebase.google.com/docs/ai-logic). 