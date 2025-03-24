import axios from 'axios';
import { InventoryItem, Recipe } from '../types';

// API Endpoint URL for the Claude Proxy
// For local development with Firebase Emulators, use the exact path from the emulator output
// For production, use the relative path /api/claude
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'barcode-scanner-f7aa1';
const IS_EMULATOR = import.meta.env.VITE_USE_EMULATOR === 'true';

// Determine the right endpoint based on environment
const CLAUDE_PROXY_URL = IS_EMULATOR 
  ? `http://127.0.0.1:5001/${FIREBASE_PROJECT_ID}/us-central1/api/claude` 
  : '/api/claude';

console.log('Using Claude API endpoint:', CLAUDE_PROXY_URL);

// Function to generate recipe suggestions based on inventory
export const generateRecipeSuggestions = async (
  items: InventoryItem[],
  apiKey: string = '', // API key is optional, Firebase function will use its config if missing
  dietaryPreferences: string[] = [],
  allergies: string[] = [],
  recipeCount: number = 3
): Promise<Recipe[]> => {
  try {    
    // Format inventory items for the prompt
    const inventoryText = items.map(item => 
      `${item.name}: ${item.quantity} ${item.unit}`
    ).join('\n');
    
    // Construct the prompt for Claude
    const prompt = `Given the following ingredients in my kitchen, suggest ${recipeCount} recipes I can make.

${dietaryPreferences.length ? '⚠️ IMPORTANT: I have the following dietary preferences that MUST be followed: ' + dietaryPreferences.join(', ') : ''}
${allergies.length ? '⚠️ CRITICAL: I have the following allergies that MUST be avoided: ' + allergies.join(', ') : ''}

${dietaryPreferences.length || allergies.length ? 'Please ensure ALL recipes strictly adhere to these restrictions. Do not include ANY recipe that contains allergens or violates my dietary preferences.' : ''}

Please format each recipe with a title, ingredients list with quantities, step-by-step instructions, preparation time, cooking time, servings, and difficulty level.

My ingredients:
${inventoryText}

For each recipe, please include relevant tags indicating dietary attributes (e.g., "vegetarian", "vegan", "gluten-free", "dairy-free") and other characteristics (e.g., "quick", "easy", "healthy").

Please respond with recipes in JSON format like this:
[
  {
    "title": "Recipe name",
    "ingredients": ["1 cup flour", "2 eggs", ...],
    "instructions": ["Step 1...", "Step 2...", ...],
    "prepTimeMinutes": 10,
    "cookTimeMinutes": 20,
    "servings": 4,
    "difficulty": "Easy",
    "tags": ["quick", "vegetarian", ...]
  },
  ...
]`;

    // Prepare the payload for our proxy server
    const payload = {
      apiKey, // The Firebase function will use its own config if this is empty
      data: {
        model: "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }
    };

    // Make API request through Firebase Function
    console.log('Sending request to Claude API via Firebase Function');
    const response = await axios.post(CLAUDE_PROXY_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      withCredentials: false
    });

    // Extract JSON response from Claude
    const assistantMessage = response.data.content[0].text;
    const jsonMatch = assistantMessage.match(/\[\s*\{.*\}\s*\]/s);
    
    if (jsonMatch) {
      const jsonStr = jsonMatch[0];
      const recipes = JSON.parse(jsonStr);
      
      // Add unique IDs to each recipe if they don't already have them
      return recipes.map((recipe: any, index: number) => ({
        ...recipe,
        id: `recipe-${Date.now()}-${index}`
      })) as Recipe[];
    }
    
    // If parsing fails, return an empty array
    console.error('Failed to parse recipe JSON from Claude response');
    return [];
  } catch (error) {
    console.error('Error generating recipe suggestions:', error);
    
    // Provide more meaningful error message
    if (axios.isAxiosError(error)) {
      if (error.code === 'ERR_NETWORK') {
        throw new Error('Network error: Cannot reach Firebase Function. Make sure the emulator is running in development.');
      }
      if (error.response) {
        console.error('Response data:', error.response.data);
        
        // Try to extract the detailed error message
        let errorMessage = 'Unknown error';
        if (error.response.data && error.response.data.error) {
          if (typeof error.response.data.error === 'string') {
            errorMessage = error.response.data.error;
          } else if (error.response.data.error.message) {
            errorMessage = error.response.data.error.message;
          }
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        
        throw new Error(`Claude API error (${error.response.status}): ${errorMessage}`);
      }
    }
    throw error; // Re-throw any other errors
  }
};