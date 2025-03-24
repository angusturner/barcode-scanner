import { create } from 'zustand';
import { InventoryItem, Recipe, UserSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';

// LocalStorage keys
const INVENTORY_STORAGE_KEY = 'kitchen_inventory_items';
const RECIPES_STORAGE_KEY = 'kitchen_inventory_recipes';

interface InventoryState {
  items: InventoryItem[];
  loading: boolean;
  error: string | null;
  recipes: Recipe[];
  userSettings: UserSettings | null;
  
  // Actions
  fetchInventory: () => Promise<void>;
  addItem: (item: Omit<InventoryItem, 'id'>) => Promise<void>;
  updateItem: (item: InventoryItem) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  searchByBarcode: (barcode: string) => Promise<InventoryItem | null>;
  fetchRecipes: () => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  loading: false,
  error: null,
  recipes: [],
  userSettings: null,
  
  fetchInventory: async () => {
    set({ loading: true, error: null });
    try {
      // Get inventory items from localStorage
      const storedItems = localStorage.getItem(INVENTORY_STORAGE_KEY);
      if (storedItems) {
        const inventoryItems = JSON.parse(storedItems) as InventoryItem[];
        set({ items: inventoryItems, loading: false });
      } else {
        set({ items: [], loading: false });
      }
    } catch (error) {
      console.error('Error fetching inventory from localStorage:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  addItem: async (item) => {
    set({ loading: true, error: null });
    try {
      // Generate a unique ID for the new item
      const newItem = { ...item, id: uuidv4() } as InventoryItem;
      
      // Update state
      set(state => {
        const updatedItems = [...state.items, newItem];
        
        // Save to localStorage
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedItems));
        
        return { 
          items: updatedItems,
          loading: false
        };
      });
    } catch (error) {
      console.error('Error adding item:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  updateItem: async (item) => {
    set({ loading: true, error: null });
    try {
      set(state => {
        // Update the item in the state
        const updatedItems = state.items.map(i => i.id === item.id ? item : i);
        
        // Save to localStorage
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedItems));
        
        return {
          items: updatedItems,
          loading: false
        };
      });
    } catch (error) {
      console.error('Error updating item:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  deleteItem: async (id) => {
    set({ loading: true, error: null });
    try {
      set(state => {
        // Filter out the deleted item
        const updatedItems = state.items.filter(item => item.id !== id);
        
        // Save to localStorage
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedItems));
        
        return {
          items: updatedItems,
          loading: false
        };
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },
  
  searchByBarcode: async (barcode) => {
    set({ loading: true, error: null });
    try {
      // Search for the item in the current state
      let foundItem: InventoryItem | null = null;
      
      set(state => {
        // Find the item with matching barcode
        foundItem = state.items.find(item => item.barcode === barcode) || null;
        return state; // Return unchanged state
      });
      
      set({ loading: false });
      return foundItem;
    } catch (error) {
      console.error('Error searching by barcode:', error);
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },
  
  fetchRecipes: async () => {
    set({ loading: true, error: null });
    try {
      // Get recipes from localStorage
      const storedRecipes = localStorage.getItem(RECIPES_STORAGE_KEY);
      if (storedRecipes) {
        const recipes = JSON.parse(storedRecipes) as Recipe[];
        set({ recipes, loading: false });
      } else {
        set({ recipes: [], loading: false });
      }
    } catch (error) {
      console.error('Error fetching recipes from localStorage:', error);
      set({ error: (error as Error).message, loading: false });
    }
  }
}));