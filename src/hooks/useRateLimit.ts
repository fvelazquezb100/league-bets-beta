import { useState, useCallback, useRef } from 'react';
import { logger } from '@/utils/logger';

interface RateLimitOptions {
  maxAttempts: number;
  windowMs: number;
  key?: string;
}

interface RateLimitState {
  attempts: number;
  resetTime: number;
  isBlocked: boolean;
}

export const useRateLimit = (options: RateLimitOptions) => {
  const { maxAttempts, windowMs, key = 'default' } = options;
  const [state, setState] = useState<RateLimitState>({
    attempts: 0,
    resetTime: 0,
    isBlocked: false,
  });
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    
    // Reset if window has passed
    if (now > state.resetTime) {
      setState({
        attempts: 0,
        resetTime: 0,
        isBlocked: false,
      });
      return true;
    }

    // Check if blocked
    if (state.attempts >= maxAttempts) {
      logger.warn(`Rate limit exceeded for key: ${key}`, {
        component: 'useRateLimit',
        action: 'rate_limit_exceeded',
        additionalData: { key, attempts: state.attempts, maxAttempts }
      });
      return false;
    }

    return true;
  }, [state, maxAttempts, key]);

  const recordAttempt = useCallback((): boolean => {
    const now = Date.now();
    
    // If this is the first attempt or window has passed, start new window
    if (state.attempts === 0 || now > state.resetTime) {
      const newResetTime = now + windowMs;
      
      setState({
        attempts: 1,
        resetTime: newResetTime,
        isBlocked: false,
      });

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set timeout to reset attempts
      timeoutRef.current = setTimeout(() => {
        setState(prev => ({
          ...prev,
          attempts: 0,
          isBlocked: false,
        }));
      }, windowMs);

      return true;
    }

    // Increment attempts
    const newAttempts = state.attempts + 1;
    const isBlocked = newAttempts >= maxAttempts;

    setState(prev => ({
      ...prev,
      attempts: newAttempts,
      isBlocked,
    }));

    if (isBlocked) {
      logger.warn(`Rate limit exceeded for key: ${key}`, {
        component: 'useRateLimit',
        action: 'rate_limit_exceeded',
        additionalData: { key, attempts: newAttempts, maxAttempts }
      });
    }

    return !isBlocked;
  }, [state, maxAttempts, windowMs, key]);

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setState({
      attempts: 0,
      resetTime: 0,
      isBlocked: false,
    });
  }, []);

  const getRemainingTime = useCallback((): number => {
    const now = Date.now();
    return Math.max(0, state.resetTime - now);
  }, [state.resetTime]);

  const getRemainingAttempts = useCallback((): number => {
    return Math.max(0, maxAttempts - state.attempts);
  }, [state.attempts, maxAttempts]);

  return {
    checkRateLimit,
    recordAttempt,
    reset,
    getRemainingTime,
    getRemainingAttempts,
    isBlocked: state.isBlocked,
    attempts: state.attempts,
  };
};

// Predefined rate limit configurations
export const RATE_LIMITS = {
  LOGIN: { maxAttempts: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  SIGNUP: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  PASSWORD_RESET: { maxAttempts: 3, windowMs: 60 * 60 * 1000 }, // 3 attempts per hour
  BET_PLACEMENT: { maxAttempts: 10, windowMs: 60 * 1000 }, // 10 bets per minute
  API_CALLS: { maxAttempts: 100, windowMs: 60 * 1000 }, // 100 API calls per minute
} as const;
