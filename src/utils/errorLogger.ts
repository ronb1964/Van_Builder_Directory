/**
 * Secure error logging utility
 * Provides centralized error handling with sanitization and rate limiting
 */

import { sanitizeInput } from './apiUtils';

// Interface for error log entry
interface ErrorLogEntry {
  timestamp: string;
  message: string;
  stack?: string;
  component?: string;
  additionalInfo?: Record<string, any>;
  userAgent: string;
  url: string;
}

// Rate limiting to prevent log flooding
const ERROR_RATE_LIMIT = {
  maxErrors: 10,
  timeWindowMs: 60000, // 1 minute
  errors: [] as number[],
};

/**
 * Check if we've exceeded the error rate limit
 */
const isRateLimited = (): boolean => {
  const now = Date.now();
  
  // Remove errors outside the time window
  ERROR_RATE_LIMIT.errors = ERROR_RATE_LIMIT.errors.filter(
    timestamp => now - timestamp < ERROR_RATE_LIMIT.timeWindowMs
  );
  
  // Check if we've hit the limit
  if (ERROR_RATE_LIMIT.errors.length >= ERROR_RATE_LIMIT.maxErrors) {
    return true;
  }
  
  // Add current error timestamp
  ERROR_RATE_LIMIT.errors.push(now);
  return false;
};

/**
 * Sanitize error data to prevent sensitive information leakage
 */
const sanitizeErrorData = (data: Record<string, any>): Record<string, any> => {
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential', 'apiKey'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    // Check if this is a sensitive field
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
    } 
    // Sanitize string values to prevent XSS
    else if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeInput(sanitized[key]);
    }
    // Recursively sanitize nested objects
    else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeErrorData(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Log an error with proper sanitization and rate limiting
 */
export const logError = (
  error: Error | string,
  component?: string,
  additionalInfo?: Record<string, any>
): void => {
  try {
    // Check rate limiting
    if (isRateLimited()) {
      console.warn('Error logging rate limit exceeded');
      return;
    }
    
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorStack = typeof error === 'string' ? undefined : error.stack;
    
    // Create error log entry
    const logEntry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      message: sanitizeInput(errorMessage),
      stack: errorStack ? sanitizeInput(errorStack) : undefined,
      component,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    
    // Add sanitized additional info if provided
    if (additionalInfo) {
      logEntry.additionalInfo = sanitizeErrorData(additionalInfo);
    }
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 ERROR LOG:', logEntry);
    }
    
    // In production, you would send this to your error tracking service
    // For example: Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: send to a logging endpoint
      // sendToErrorService(logEntry);
      
      // For now, just log to console in a condensed format
      console.error(
        `🚨 ERROR [${logEntry.component || 'App'}]: ${logEntry.message}`
      );
    }
    
    // Store in session for debugging
    const errorLogs = JSON.parse(sessionStorage.getItem('error_logs') || '[]');
    errorLogs.push(logEntry);
    
    // Keep only the last 50 errors
    if (errorLogs.length > 50) {
      errorLogs.shift();
    }
    
    sessionStorage.setItem('error_logs', JSON.stringify(errorLogs));
    
  } catch (loggingError) {
    // Fallback if our error logger itself fails
    console.error('Error in error logger:', loggingError);
    console.error('Original error:', error);
  }
};

/**
 * Global error handler to catch unhandled errors
 */
export const setupGlobalErrorHandling = (): void => {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, 'GlobalErrorHandler', {
      fileName: event.filename,
      lineNumber: event.lineno,
      columnNumber: event.colno,
    });
    
    // Don't prevent default behavior
    return false;
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason instanceof Error 
      ? event.reason 
      : new Error(String(event.reason));
    
    logError(error, 'UnhandledPromiseRejection');
    
    // Don't prevent default behavior
    return false;
  });
};
