import { type ReactNode, createContext, useContext, useEffect, useState } from 'react';

type User = {
  name: string;
  email: string;
};

type AuthContextType = {
  user: User | null;
  login: (tokens: { accessToken: string; idToken: string; refreshToken: string; email: string }) => void;
  logout: () => void;
  isLoggedIn: () => boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: () => {},
  logout: () => {},
  isLoggedIn: () => false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = ({
    accessToken,
    idToken,
    refreshToken,
    email,
  }: { accessToken: string; idToken: string; refreshToken: string; email: string }) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('refreshToken', refreshToken);
    setUser({ name: 'John Doe', email });
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const isLoggedIn = () => !!localStorage.getItem('idToken');

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (isLoggedIn()) setUser({ name: 'John Doe', email: 'john.doe@example.com' });
  }, []);

  return <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
