import { createContext, useState, type ReactNode } from "react";

type User = {
  id: string;
  username: string;
  email: string;
  password: string;
};

// describes everything the context will hand out
export type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void; // a function that takes a token and user, returns nothing
  logout: () => void;
  isAuthenticated: boolean;
};
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("al_token"));
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("al_user");
    return stored ? JSON.parse(stored) : null; // convert user object to json
  });

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("al_token", newToken);
    localStorage.setItem("al_user", JSON.stringify(newUser)); // convert user back to string
  };
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("al_token");
    localStorage.removeItem("al_user");
  };
  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}
