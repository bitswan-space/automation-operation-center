import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface User {
  id: string;
  email: string;
  name: string;
  groups?: Array<{ name: string; id: string; path: string }>;
}

interface AuthContextType {
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('access_token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    
    // Redirect to login page
    window.location.href = '/login';
  };

  // Set up axios interceptor for authentication and base URL
  useEffect(() => {
    // Determine backend URL based on current hostname
    const currentHost = window.location.hostname;
    const protocol = window.location.protocol;
    const port = window.location.port;
    
    let backendUrl: string;
    
    // Production or domain-based development - replace aoc. with api.
    const backendHost = currentHost.replace(/^aoc\./, 'api.');
    backendUrl = `${protocol}//${backendHost}/api/frontend`;
    
    // Set axios base URL
    axios.defaults.baseURL = backendUrl;
    
    console.log(`Frontend running on: ${protocol}//${currentHost}${port ? ':' + port : ''}`);
    console.log(`Backend API URL: ${backendUrl}`);
    
    const token = localStorage.getItem('access_token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    // Add response interceptor to handle 401 errors
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const handleOAuthCallback = async () => {
    try {
      // Get parameters from URL - now includes success and access_token
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const access_token = urlParams.get('access_token');
      const error = urlParams.get('error');
      
      console.log('OAuth callback parameters:', { success, access_token: access_token ? 'present' : 'missing', error });
      
      // Handle error cases
      if (error) {
        console.error('OAuth callback error:', error);
        return false;
      }
      
      // Check if we have a successful callback with token
      if (success === 'true' && access_token) {
        console.log('Processing successful OAuth callback with token');
        // Store token
        localStorage.setItem('access_token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Get user info from backend using the token
        try {
          console.log('Fetching user info from backend...');
          const userResponse = await axios.get('/users/me/');
          console.log('User info received:', userResponse.data);
          setUser(userResponse.data);
        } catch (userError) {
          console.error('Failed to get user info:', userError);
          // Still consider it successful if we have the token
          setUser({ id: 'unknown', email: 'unknown', name: 'User' });
        }
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      }
      
      // Legacy handling for code/state flow (if still needed)
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state) {
        // Call the backend callback endpoint
        const response = await axios.get(`/auth/keycloak-callback/?code=${code}&state=${state}`);
        const { access_token: token, user } = response.data;
        
        // Store token
        localStorage.setItem('access_token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Set user info
        setUser(user);
        
        // Clean up URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('OAuth callback failed:', error);
      return false;
    }
  };

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Starting authentication check...');
      
      // First check if we're handling an OAuth callback
      const urlParams = new URLSearchParams(window.location.search);
      const success = urlParams.get('success');
      const access_token = urlParams.get('access_token');
      const error = urlParams.get('error');
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      console.log('URL parameters:', { success, access_token: access_token ? 'present' : 'missing', error, code: code ? 'present' : 'missing', state: state ? 'present' : 'missing' });
      
      // Check for new OAuth callback flow (success + access_token) or legacy flow (code + state)
      if ((success === 'true' && access_token) || (code && state) || error) {
        console.log('Handling OAuth callback...');
        // Handle OAuth callback
        const callbackSuccess = await handleOAuthCallback();
        if (callbackSuccess) {
          console.log('OAuth callback successful, setting loading to false');
          setIsLoading(false);
          return;
        } else {
          console.log('OAuth callback failed');
        }
      }
      
      // Check existing token
      const token = localStorage.getItem('access_token');
      console.log('Existing token check:', token ? 'present' : 'missing');
      if (token) {
        try {
          console.log('Verifying existing token with backend...');
          // Verify token with backend
          const response = await axios.get('/users/me/');
          console.log('Token verification successful, user:', response.data);
          setUser(response.data);
        } catch (error) {
          console.error('Token verification failed:', error);
          // Token is invalid, remove it
          localStorage.removeItem('access_token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      console.log('Authentication check complete, setting loading to false');
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async () => {
    try {
      // Get the Keycloak OAuth URL from the backend
      const response = await axios.get('/auth/keycloak-init/');
      const { auth_url } = response.data;
      
      // Redirect to Keycloak for authentication
      window.location.href = auth_url;
    } catch (error) {
      console.error('Failed to initiate Keycloak login:', error);
      throw new Error('Login failed');
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
