
import { MAX_RETRIES, RETRY_DELAY } from './config';

/**
 * Implements an exponential backoff delay strategy
 */
export const calculateBackoffDelay = (retryCount: number, baseDelay = RETRY_DELAY): number => {
  return baseDelay * Math.pow(1.5, retryCount - 1);
};

/**
 * Sleep for a specified time
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Handles rate limiting by implementing retry with exponential backoff
 */
export const handleRateLimiting = async (retryCount: number): Promise<number> => {
  if (retryCount >= MAX_RETRIES) {
    return -1; // Signal that we've exceeded max retries
  }
  
  const backoffDelay = calculateBackoffDelay(retryCount);
  console.log(`Waiting ${backoffDelay}ms before next attempt (${retryCount + 1}/${MAX_RETRIES})`);
  await sleep(backoffDelay);
  return retryCount + 1;
};

