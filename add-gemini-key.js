const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Path to the .env.local file
const envPath = path.join(__dirname, '.env.local');

// Function to add Gemini API key to the .env.local file
async function addGeminiKey() {
  try {
    // Check if .env.local exists
    if (!fs.existsSync(envPath)) {
      console.log('.env.local file does not exist. Please run setup-env.js first.');
      return;
    }

    // Read the existing content
    const content = fs.readFileSync(envPath, 'utf-8');

    // Check if GEMINI key already exists
    if (content.includes('NEXT_PUBLIC_GEMINI_API_KEY=')) {
      console.log('NEXT_PUBLIC_GEMINI_API_KEY already exists in .env.local.');
      console.log('Please check GEMINI_SETUP.md for instructions on how to get and configure your API key.');
      return;
    }

    // Prompt for the API key
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n=== Add Google Gemini API Key ===');
    console.log('This is required for quiz generation functionality.');
    console.log('Get your API key from https://ai.google.dev/');
    
    // Update the file with the new content
    const updatedContent = content + '\n\n# AI Services\nNEXT_PUBLIC_GEMINI_API_KEY=\n';
    fs.writeFileSync(envPath, updatedContent);
    
    console.log('\n✅ NEXT_PUBLIC_GEMINI_API_KEY has been added to .env.local');
    console.log('Please edit the .env.local file and add your Gemini API key.');
    console.log('For detailed instructions, see GEMINI_SETUP.md');
    
    rl.close();
  } catch (error) {
    console.error('Error updating .env.local file:', error);
  }
}

// Run the function
addGeminiKey(); 