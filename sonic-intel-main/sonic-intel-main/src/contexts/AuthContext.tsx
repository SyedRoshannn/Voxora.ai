import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// This is the actual implementation of the AuthProvider
export const AuthProviderContent = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  // Start in loading=true so ProtectedRoute can show a spinner while we validate the session
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const safeNavigate = useCallback((path: string) => {
    if (isMounted) {
      navigate(path);
    }
  }, [isMounted, navigate]);

  // Check for existing session on initial load and validate it with /auth/me
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (!storedToken) {
        // No token at all – nothing to validate
        setLoading(false);
        return;
      }

      // Optimistically set user from localStorage so UI has something immediately
      if (storedUser) {
        try {
          const parsedUser: User = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch {
          // If parsing fails, clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      try {
        // Validate token and refresh user data from backend
        const freshUser = await apiFetch<User>('/auth/me', {}, storedToken);
        setUser(freshUser);
        setToken(storedToken);
        localStorage.setItem('user', JSON.stringify(freshUser));
      } catch {
        // Token is invalid/expired – clear session and redirect to login if needed
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);

        if (location.pathname !== '/login' && location.pathname !== '/register') {
          safeNavigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    void initializeAuth();
  }, [location.pathname, safeNavigate]);


  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiFetch<TokenResponse>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );

      const { access_token, user } = data;

      // Update state and storage
      setUser(user);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Show success message
      toast({
        title: 'Login successful',
        description: `Welcome back, ${user.name}!`,
      });
      
      // Navigation is handled by the Login page using react-router
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await apiFetch<TokenResponse>(
        '/auth/register',
        {
          method: 'POST',
          body: JSON.stringify({ name, email, password }),
        }
      );

      const { access_token, user } = data;

      setUser(user);
      setToken(access_token);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      toast({
        title: 'Registration successful',
        description: 'Your account has been created!',
      });
      
      // Navigation is handled by the Register page using react-router
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Reset state
    setToken(null);
    setUser(null);
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
    
    safeNavigate('/login');
  };

  const contextValue = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    error
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
