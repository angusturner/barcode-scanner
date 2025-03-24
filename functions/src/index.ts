/**
 * Firebase Cloud Functions for Kitchen Inventory App
 * 
 * Environment variables:
 * - CLAUDE_API_KEY: The API key for Claude AI (loaded from .env file)
 */

import * as logger from "firebase-functions/logger";
import axios from 'axios';
import * as functions from 'firebase-functions';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Create a single handler for Claude proxy requests
const handleClaudeRequest = async (req, res) => {
  try {
    // Extract API key from request, or from environment variables
    let apiKey = req.body.apiKey;
    
    if (!apiKey) {
      // For Cloud Functions V2, use process.env which includes .env file variables
      if (process.env.CLAUDE_API_KEY) {
        apiKey = process.env.CLAUDE_API_KEY;
        logger.info('Using API key from environment variables');
      } 
      // For backward compatibility with emulator or V1 functions
      else if (process.env.FUNCTIONS_EMULATOR) {
        try {
          apiKey = functions.config().claude?.api_key;
          logger.info('Using API key from functions.config()');
        } catch (err) {
          logger.error('Error accessing functions.config():', err);
        }
      }
    }
    
    // Log configuration details
    logger.info('Checking for Claude API key...');
    logger.info(`API key from request: ${req.body.apiKey ? 'Provided' : 'Not provided'}`);
    logger.info(`Environment API key: ${process.env.CLAUDE_API_KEY ? 'Found in environment' : 'Not found'}`);
    
    if (!apiKey) {
      logger.error('Claude API key is missing - not found in request or environment variables');
      res.status(400).json({ 
        error: 'API key is required', 
        message: 'Claude API key not found. Please provide it in the request or set it in the environment.',
      });
      return;
    }

    // Remove API key from the forwarded payload
    const { apiKey: _, ...payload } = req.body;

    logger.info('Forwarding request to Anthropic API');
    
    // Forward the request to Anthropic
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      payload.data,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );

    logger.info('Received response from Anthropic API');
    res.status(200).json(response.data);
    return;
  } catch (error: any) {
    logger.error('Error:', error.message || 'Unknown error');
    
    // Return meaningful error response
    if (error.response) {
      res.status(error.response.status || 500).json({
        error: {
          message: error.response?.data?.error?.message || 'Error from Claude API',
          type: error.response?.data?.error?.type || 'unknown',
          status: error.response?.status || 500
        }
      });
      return;
    }
    
    res.status(500).json({
      error: {
        message: error.message || 'Internal Server Error',
        type: 'internal_error'
      }
    });
    return;
  }
};

// Create a single handler for health check
const handleHealthCheck = (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Claude proxy server is running' });
};

// Create a simple root handler for debugging
const handleRoot = (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Cloud Function API is running',
    endpoints: ['/claude', '/api/claude', '/healthcheck', '/api/healthcheck'],
    requestPath: req.path
  });
};

// Main API handler function
const apiHandler = (req, res) => {
  const path = req.path.toLowerCase();
  logger.info(`Received request for path: ${path}, method: ${req.method}`);
  
  // Set CORS headers for all requests
  const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000',
    'http://localhost:5173',
    'https://localhost:5173',
    'https://barcode-scanner-f7aa1.web.app',
    'null'  // For some environments like certain Chrome extensions
  ];

  // Get the Origin header
  const origin = req.headers.origin;
  
  // Always set permissive CORS headers for local development
  if (process.env.NODE_ENV !== 'production') {
    res.set('Access-Control-Allow-Origin', origin || '*');
    res.set('Access-Control-Allow-Credentials', 'false');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    // For other origins in production, use a wildcard
    res.set('Access-Control-Allow-Origin', '*');
  }
  
  // Set common CORS headers
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    logger.info('Responding to OPTIONS preflight request');
    res.status(204).send('');
    return;
  }
  
  // Match path to handlers
  if (path === '/claude' || path === '/api/claude') {
    logger.info('Routing to Claude handler');
    void handleClaudeRequest(req, res);
  } else if (path === '/healthcheck' || path === '/api/healthcheck') {
    logger.info('Routing to Healthcheck handler');
    handleHealthCheck(req, res);
  } else if (path === '/' || path === '/api') {
    logger.info('Routing to Root handler');
    handleRoot(req, res);
  } else {
    logger.warn(`No handler found for path: ${path}`);
    res.status(404).json({ error: `Not found: ${path}` });
  }
};

// Export the functions with HTTP triggers
export const api = functions.https.onRequest(apiHandler);
