import { useState, useEffect } from 'react';

interface VersionInfo {
  aoc?: string;
  'bitswan-backend'?: string;
  keycloak?: string;
}

export function useVersion() {
  const [version, setVersion] = useState<VersionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Construct the backend URL similar to api-client.ts
        const currentHost = window.location.hostname;
        const protocol = "https:";
        const backendHost = currentHost.replace(/^aoc\./, 'api.');
        const backendUrl = `${protocol}//${backendHost}/api/version`;
        
        const response = await fetch(backendUrl);
        if (!response.ok) {
          throw new Error('Failed to fetch version');
        }
        const data = await response.json();
        setVersion(data);
      } catch (err) {
        setError('Failed to fetch version');
        console.error('Error fetching version:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVersion();
  }, []);

  return { version, isLoading, error };
}
