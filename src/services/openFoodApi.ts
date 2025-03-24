/*
 * This service connects directly to the Open Food Facts public API and 
 * doesn't need to be modified for Firebase deployment as it doesn't
 * require a server proxy or authentication.
 */
import axios from 'axios';
import { OpenFoodProduct } from '../types';

const API_BASE_URL = 'https://world.openfoodfacts.org/api/v0';

/**
 * Searches for a product using its barcode via the Open Food Facts API.
 * 
 * This function will attempt to find a real product, but returns null if
 * the product is not found or the API fails.
 */
export const searchProductByBarcode = async (barcode: string): Promise<OpenFoodProduct | null> => {
  try {
    // Try to get real data from the API
    const response = await axios.get(`${API_BASE_URL}/product/${barcode}.json`);
    
    if (response.data.status === 1) {
      return response.data as OpenFoodProduct;
    } 
    
    // If no product found, return null
    console.log('Product not found in API');
    return null;
  } catch (error) {
    console.error('Error fetching product data:', error);
    
    // Return null if API call fails
    return null;
  }
};

export const searchProductsByName = async (name: string): Promise<OpenFoodProduct[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/search.json`, {
      params: {
        search_terms: name,
        page_size: 5,
      }
    });
    
    if (response.data.products && response.data.products.length > 0) {
      return response.data.products.map((product: any) => ({
        code: product.code,
        product: {
          product_name: product.product_name,
          brands: product.brands,
          categories: product.categories,
          image_url: product.image_url,
          nutriments: product.nutriments || {},
          ingredients_text: product.ingredients_text || '',
          quantity: product.quantity || '',
        }
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error searching for products:', error);
    return [];
  }
};