import { useEffect } from 'react';

/**
 * Custom hook to redirect from HTTP to HTTPS
 * Only redirects in production environment and when not on localhost
 */
export function useHttpsRedirect() {
  useEffect(() => {
    // Only redirect in production environment
    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check if we're currently on HTTP
    if (window.location.protocol === 'http:') {
      // Don't redirect if we're on localhost (development)
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return;
      }

      // Redirect to HTTPS
      const httpsUrl = window.location.href.replace('http:', 'https:');
      window.location.replace(httpsUrl);
    }
  }, []);
}
