
/**
 * Configuration constants for Gemini API
 */

// Rate limiting constants
export const MAX_RETRIES = 5;
export const RETRY_DELAY = 1500; // milliseconds
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// API endpoints
export const getGeminiEndpoint = (modelVersion: string): string => 
  `https://generativelanguage.googleapis.com/v1beta/models/${modelVersion}:generateContent`;

// Default model version
export const DEFAULT_MODEL_VERSION = 'gemini-2.0-flash';

// Default temperature
export const DEFAULT_TEMPERATURE = 0.2;

