import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getMQTTTokens, type TokenData } from '@/data/mqtt';
import { useAuth } from './AuthContext';

interface MQTTTokensContextType {
  tokens: TokenData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const MQTTTokensContext = createContext<MQTTTokensContextType | undefined>(undefined);

export const useMQTTTokens = () => {
  const context = useContext(MQTTTokensContext);
  if (context === undefined) {
    throw new Error('useMQTTTokens must be used within a MQTTTokensProvider');
  }
  return context;
};

interface MQTTTokensProviderProps {
  children: ReactNode;
}

export const MQTTTokensProvider: React.FC<MQTTTokensProviderProps> = ({ children }) => {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchTokens = async () => {
    if (!isAuthenticated) {
      setTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching MQTT tokens...');
      const tokensData = await getMQTTTokens();
      console.log('MQTT tokens received:', tokensData);
      setTokens(tokensData);
    } catch (err) {
      console.error('Failed to fetch MQTT tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch MQTT tokens');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tokens immediately when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      console.log('User authenticated, fetching MQTT tokens immediately');
      fetchTokens();
    } else {
      console.log('User not authenticated, clearing MQTT tokens');
      setTokens([]);
      setError(null);
    }
  }, [isAuthenticated]);

  const value = {
    tokens,
    isLoading,
    error,
    refetch: fetchTokens,
  };

  return (
    <MQTTTokensContext.Provider value={value}>
      {children}
    </MQTTTokensContext.Provider>
  );
};
