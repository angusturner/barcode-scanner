/**
 * Deploy script to set environment variables for Firebase Functions
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// First try to load from .env if it exists
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

try {
  let claudeApiKey = process.env.CLAUDE_API_KEY;
  
  // If not found in environment, try the legacy .runtimeconfig.json for backwards compatibility
  if (!claudeApiKey) {
    const runtimeConfigPath = path.join(__dirname, '../functions/.runtimeconfig.json');
    if (fs.existsSync(runtimeConfigPath)) {
      console.log('CLAUDE_API_KEY not found in environment, attempting to read from .runtimeconfig.json');
      const runtimeConfig = JSON.parse(fs.readFileSync(runtimeConfigPath, 'utf8'));
      claudeApiKey = runtimeConfig?.claude?.api_key;
    }
  }

  if (!claudeApiKey) {
    console.error('Error: Claude API key not found in environment or runtime config file.');
    console.error('Please set CLAUDE_API_KEY in your .env file or run "firebase functions:config:set claude.api_key=YOUR_KEY"');
    process.exit(1);
  }

  // Create a .env file in the functions directory to be used during deployment
  const envFilePath = path.join(__dirname, '../functions/.env');
  fs.writeFileSync(envFilePath, `CLAUDE_API_KEY=${claudeApiKey}\n`);
  
  console.log('Created .env file with Claude API key');
  
  console.log('Deploying Firebase Functions...');
  execSync('firebase deploy --only functions', { stdio: 'inherit' });
  
  // Remove the .env file after deployment for security
  fs.unlinkSync(envFilePath);
  console.log('Removed temporary .env file');
  
  console.log('Firebase Functions deployed successfully!');
} catch (error) {
  console.error('Error deploying Firebase Functions:', error.message);
  process.exit(1);
} 