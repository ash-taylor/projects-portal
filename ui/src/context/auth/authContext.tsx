import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient } from '../../api';
import type { MessageResponse } from '../../components/auth/models/MessageResponse';
import type { User } from '../../models/User';

type AuthContextType = {
  user?: User;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<User | undefined>;
  logout: () => Promise<MessageResponse | undefined>;
  isLoggedIn: () => boolean;
  updateUser: (user: User) => void;
  error?: Error;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loading: true,
  login: () => new Promise(() => {}),
  logout: () => new Promise(() => {}),
  isLoggedIn: () => false,
  updateUser: () => {},
  error: undefined,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User>();
  const [error, setError] = useState<Error>();

  const login = async ({ email, password }: { email: string; password: string }) => {
    try {
      const loginResponse = await apiClient.makeRequest<User>(
        '/auth/signin',
        { method: 'post', data: { email, password } },
        true,
      );

      const userResponse = await getUser();
      setUser(userResponse.data);

      return loginResponse.data;
    } catch (error) {
      setError(error as Error);
    }
  };

  const logout = async () => {
    try {
      const response = await apiClient.makeRequest<MessageResponse>('/auth/logout', { method: 'post' }, true);
      return response.data;
    } catch (error) {
      setError(error as Error);
    } finally {
      setUser(undefined);
    }
  };

  const getUser = useCallback(async () => await apiClient.makeRequest<User>('/auth/me', { method: 'get' }, true), []);

  const isLoggedIn = () => !loading && user !== undefined;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const user = await getUser();
        setUser(user.data);
      } catch (error) {
        setError(error as Error);
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [getUser]);

  const updateUser = (user: User) => setUser(user);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn, loading, error, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
