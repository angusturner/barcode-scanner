// Inventory item model
export interface InventoryItem {
    id: string;
    barcode?: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    expirationDate?: Date;
    purchasedDate?: Date;
    notes?: string;
    imageUrl?: string;
  }
  
  // Product from Open Food Facts API
  export interface OpenFoodProduct {
    code: string;
    product: {
      product_name: string;
      brands: string;
      categories: string;
      image_url: string;
      nutriments: {
        [key: string]: number | string;
      };
      ingredients_text: string;
      quantity: string;
    };
  }
  
  // Recipe suggestion model
  export interface Recipe {
    id: string;
    title: string;
    ingredients: string[];
    instructions: string[];
    prepTimeMinutes: number;
    cookTimeMinutes: number;
    servings: number;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tags: string[];
  }
  
  // User settings
  export interface UserSettings {
    id: string;
    displayName: string;
    dietaryPreferences: string[];
    allergies: string[];
    theme: 'light' | 'dark' | 'system';
  }