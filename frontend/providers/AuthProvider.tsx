'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, setAccessToken, getAccessToken } from '@/lib/api-client';

interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    try {
      let token = getAccessToken();

      // If we don't have a token in localStorage, try silent refresh
      if (!token) {
        const refreshResponse = await apiClient.post('/auth/refresh');
        const { accessToken } = refreshResponse.data.data;
        setAccessToken(accessToken);
        token = accessToken;
      }

      if (token) {
        // Fetch and verify user info using current token
        const meResponse = await apiClient.get('/auth/me');
        setUser(meResponse.data.data.user);
      } else {
        throw new Error('No access token available');
      }
    } catch (error) {
      // Session expired or invalid
      setUser(null);
      setAccessToken('');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Protect route redirects
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = pathname === '/login' || pathname === '/signup';
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user && isPublicPath) {
        router.push('/dashboard');
      }
    }
  }, [user, isLoading, pathname, router]);

  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        usernameOrEmail,
        password,
      });
      const { user: loggedInUser, accessToken } = response.data.data;
      setAccessToken(accessToken);
      setUser(loggedInUser);
      router.push('/dashboard');
    } catch (error: any) {
      setUser(null);
      setAccessToken('');
      throw error.response?.data?.message || 'Login failed. Please check your credentials.';
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error on server', err);
    } finally {
      setAccessToken('');
      setUser(null);
      router.push('/login');
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
