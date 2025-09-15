/**
 * Centralized logging utility
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  endpoint?: string;
  method?: string;
  additionalData?: Record<string, any>;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  userAgent: string;
  url: string;
  stack?: string;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error) {
    if (!this.shouldLog(level)) return;

    const logEntry: LogEntry = {
      ...this.formatMessage(level, message, context),
      stack: error?.stack,
    };

    // Console logging
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(`[${LogLevel[level]}] ${message}`, logEntry);

    // In production, send to logging service
    if (!this.isDevelopment) {
      this.sendToLoggingService(logEntry);
    }
  }

  private getConsoleMethod(level: LogLevel) {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private async sendToLoggingService(logEntry: LogEntry) {
    try {
      // In a real application, you would send this to your logging service
      // Example: Sentry, LogRocket, DataDog, etc.
      
      // For now, we'll just store in localStorage for debugging
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logEntry);
      
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to send log to service:', error);
    }
  }

  debug(message: string, context: LogContext = {}) {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}) {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}) {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context: LogContext = {}, error?: Error) {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Utility methods for common scenarios
  logUserAction(action: string, context: LogContext = {}) {
    this.info(`User action: ${action}`, { ...context, action });
  }

  logApiCall(endpoint: string, method: string, context: LogContext = {}) {
    this.debug(`API call: ${method} ${endpoint}`, { ...context, action: 'api_call', endpoint, method });
  }

  logApiError(endpoint: string, method: string, error: Error, context: LogContext = {}) {
    this.error(`API error: ${method} ${endpoint}`, { ...context, action: 'api_error', endpoint, method }, error);
  }

  logBettingAction(action: string, betData: any, context: LogContext = {}) {
    this.info(`Betting action: ${action}`, { 
      ...context, 
      action: 'betting', 
      additionalData: { bettingAction: action, betData } 
    });
  }

  logAuthAction(action: string, context: LogContext = {}) {
    this.info(`Auth action: ${action}`, { ...context, action: 'auth' });
  }

  // Get logs for debugging
  getLogs(): LogEntry[] {
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  // Clear logs
  clearLogs() {
    localStorage.removeItem('app_logs');
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types
export type { LogContext, LogEntry };
