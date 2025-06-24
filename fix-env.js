const fs = require('fs');
const path = require('path');

// Path to the .env.local file
const envPath = path.join(__dirname, '.env.local');

// Function to fix the .env.local file
function fixEnvFile() {
  try {
    // Check if .env.local exists
    if (!fs.existsSync(envPath)) {
      console.log('.env.local file does not exist.');
      return;
    }

    // Read the existing content
    const content = fs.readFileSync(envPath, 'utf-8');
    
    // Count occurrences of GEMINI key
    const keyCount = (content.match(/NEXT_PUBLIC_GEMINI_API_KEY=/g) || []).length;
    
    if (keyCount <= 1) {
      console.log('No duplicate keys found in .env.local');
      return;
    }
    
    // Process the content line by line
    const lines = content.split('\n');
    let updatedLines = [];
    let foundFirstKey = false;
    let keyValue = '';
    
    for (const line of lines) {
      // If it's a GEMINI key line
      if (line.trim().startsWith('NEXT_PUBLIC_GEMINI_API_KEY=')) {
        // If it's the first occurrence, save it and add to output
        if (!foundFirstKey) {
          foundFirstKey = true;
          updatedLines.push(line);
          
          // Extract the value if it exists
          keyValue = line.substring(line.indexOf('=') + 1).trim();
        }
        // Skip all other occurrences
      } else if (line.trim() === '# AI Services' && foundFirstKey) {
        // Skip the duplicate section header
      } else {
        updatedLines.push(line);
      }
    }
    
    // Write back the updated content
    fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8');
    
    console.log('✅ Fixed duplicate entries in .env.local');
    if (!keyValue || keyValue === 'your-gemini-api-key') {
      console.log('⚠️ Remember to add your actual Gemini API key to NEXT_PUBLIC_GEMINI_API_KEY in .env.local');
    }
  } catch (error) {
    console.error('Error fixing .env.local file:', error);
  }
}

// Run the function
fixEnvFile(); 