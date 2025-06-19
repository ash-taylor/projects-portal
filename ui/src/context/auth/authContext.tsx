import { type ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiClient, authSubject } from '../../api';
import { AuthEvents } from '../../components/auth/events/AuthEvents';
import type { IAuthObserver } from '../../components/auth/events/IAuthObserver';
import { buildError } from '../../helpers/buildError';
import type { MessageResponse } from '../../models/MessageResponse';
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
      const loginResponse = await apiClient.makeRequest<User, { email: string; password: string }>(
        '/auth/signin',
        { method: 'post', data: { email, password } },
        true,
      );

      const userResponse = await getUser();
      setUser(userResponse.data);

      return loginResponse.data;
    } catch (error) {
      setError(buildError(error));
      throw error;
    }
  };

  const logout = async () => {
    try {
      const response = await apiClient.makeRequest<MessageResponse>('/auth/logout', { method: 'post' }, true);
      return response.data;
    } catch (error) {
      setError(buildError(error));
    } finally {
      setUser(undefined);
    }
  };

  const getUser = useCallback(async () => await apiClient.makeRequest<User>('/auth/me', { method: 'get' }, true), []);

  const isLoggedIn = () => !loading && user !== undefined;

  const updateUser = (user: User) => setUser(user);

  useEffect(() => {
    const observer: IAuthObserver = {
      update(event: AuthEvents) {
        if (event === AuthEvents.AUTH_REFRESH_FAILED) setUser(undefined);
      },
    };

    authSubject.attach(observer);

    return () => authSubject.detach(observer);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const user = await getUser();
        setUser(user.data);
      } catch (error) {
        setError(buildError(error));
        setUser(undefined);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [getUser]);

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
