/**
 * Secure HTTP client for making API requests
 * Includes CSRF protection, request timeout, and proper error handling
 */

import { logError } from './errorLogger';

// Interface for HTTP request options
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  mode?: RequestMode;
}

// Default request options
const DEFAULT_OPTIONS: RequestOptions = {
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // Helps prevent CSRF
  },
  timeout: 30000, // 30 seconds
  credentials: 'same-origin', // Include cookies for same-origin requests
  cache: 'no-cache',
  mode: 'cors',
};

/**
 * Add CSRF token to request headers if available
 */
const addCsrfToken = (headers: Record<string, string>): Record<string, string> => {
  // Look for CSRF token in meta tag (common practice)
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  if (csrfToken) {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    };
  }
  
  return headers;
};

/**
 * Create a request with timeout capability
 */
const fetchWithTimeout = async (url: string, options: RequestInit & { timeout?: number }): Promise<Response> => {
  const { timeout, ...fetchOptions } = options;
  
  if (!timeout) {
    return fetch(url, fetchOptions);
  }
  
  // Create an abort controller to handle timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as any).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Process response based on content type
 */
const processResponse = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    return response.json();
  } else if (contentType.includes('text/')) {
    return response.text();
  } else {
    return response.blob();
  }
};

/**
 * Handle HTTP errors with proper logging
 */
const handleHttpError = (error: any, url: string, method: string): never => {
  // Create a more descriptive error
  const httpError = new Error(
    `HTTP ${method} request to ${url} failed: ${error.message || 'Unknown error'}`
  );
  
  // Log the error with our error logger
  logError(httpError, 'SecureHttpClient', {
    url,
    method,
    originalError: error.message,
  });
  
  throw httpError;
};

/**
 * Make a GET request
 */
export const secureGet = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  try {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      method: 'GET',
      headers: addCsrfToken({
        ...DEFAULT_OPTIONS.headers,
        ...options.headers,
      }),
    };
    
    const response = await fetchWithTimeout(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return processResponse(response);
  } catch (error) {
    return handleHttpError(error, url, 'GET');
  }
};

/**
 * Make a POST request
 */
export const securePost = async <T>(url: string, data: any, options: RequestOptions = {}): Promise<T> => {
  try {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      method: 'POST',
      headers: addCsrfToken({
        ...DEFAULT_OPTIONS.headers,
        ...options.headers,
      }),
      body: JSON.stringify(data),
    };
    
    const response = await fetchWithTimeout(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return processResponse(response);
  } catch (error) {
    return handleHttpError(error, url, 'POST');
  }
};

/**
 * Make a PUT request
 */
export const securePut = async <T>(url: string, data: any, options: RequestOptions = {}): Promise<T> => {
  try {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      method: 'PUT',
      headers: addCsrfToken({
        ...DEFAULT_OPTIONS.headers,
        ...options.headers,
      }),
      body: JSON.stringify(data),
    };
    
    const response = await fetchWithTimeout(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return processResponse(response);
  } catch (error) {
    return handleHttpError(error, url, 'PUT');
  }
};

/**
 * Make a DELETE request
 */
export const secureDelete = async <T>(url: string, options: RequestOptions = {}): Promise<T> => {
  try {
    const mergedOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      method: 'DELETE',
      headers: addCsrfToken({
        ...DEFAULT_OPTIONS.headers,
        ...options.headers,
      }),
    };
    
    const response = await fetchWithTimeout(url, mergedOptions);
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    return processResponse(response);
  } catch (error) {
    return handleHttpError(error, url, 'DELETE');
  }
};
