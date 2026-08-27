import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginApi,
  getMe,
} from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const token =
        localStorage.getItem("marineguard_token") ||
        sessionStorage.getItem("marineguard_token");

      if (!token) {
        setUser(null);
        return;
      }

      const response = await getMe();

      setUser(response.data?.data?.user || null);
    } catch {
      localStorage.removeItem("marineguard_token");
      sessionStorage.removeItem("marineguard_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(credentials) {
    const response = await loginApi(credentials);

    const data = response.data?.data;

    const token = data?.token;
    const loggedInUser = data?.user;

    if (!token) {
      throw new Error("Login response did not contain a token.");
    }

    localStorage.setItem(
      "marineguard_token",
      token
    );

    if (loggedInUser) {
      localStorage.setItem(
        "marineguard_user",
        JSON.stringify(loggedInUser)
      );
    }

    setUser(loggedInUser || null);

    return response;
  }

  function logout() {
    localStorage.removeItem("marineguard_token");
    sessionStorage.removeItem("marineguard_token");
    localStorage.removeItem("marineguard_user");

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}