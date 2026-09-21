import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  login as loginUser,
  logout as logoutUser,
  getCurrentUser,
  getStoredUser,
  getAccessToken,
  clearAuth,
} from "../services/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  /*
   * Restore the user from localStorage when the application starts.
   *
   * The actual JWT access token is stored separately by auth.js.
   */
  const [user, setUser] = useState(() => {
    return getStoredUser();
  });

  const [loading, setLoading] = useState(true);

  /*
   * Check whether the stored JWT is still valid.
   *
   * If there is a token, ask Django for the current user.
   * This prevents relying only on old localStorage data.
   */
  useEffect(() => {
    let mounted = true;

    const restoreSession = async () => {
      const accessToken = getAccessToken();

      if (!accessToken) {
        if (mounted) {
          setUser(null);
          setLoading(false);
        }

        return;
      }

      try {
        const result = await getCurrentUser();

        if (!mounted) return;

        if (result?.success && result.user) {
          setUser(result.user);
        } else {
          /*
           * The token is no longer valid.
           */
          clearAuth();
          setUser(null);
        }
      } catch (error) {
        console.error("Session restore failed:", error);

        if (mounted) {
          clearAuth();
          setUser(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  /*
   * REAL LOGIN
   *
   * This calls Django through src/services/auth.js.
   *
   * No hard-coded:
   * - user ID
   * - name
   * - email
   * - role
   */
  const login = async (email, password) => {
    if (!email?.trim() || !password) {
      return {
        success: false,
        message: "Email and password are required.",
      };
    }

    try {
      const result = await loginUser(email.trim(), password);

      if (!result?.success) {
        return {
          success: false,
          message: result?.message || "Invalid email or password.",
        };
      }

      /*
       * If login response already contains the user,
       * use it immediately.
       */
      if (result.user) {
        setUser(result.user);

        return {
          success: true,
          user: result.user,
        };
      }

      /*
       * If login only returned JWT tokens,
       * retrieve the user from Django /auth/me/.
       */
      const currentUser = await getCurrentUser();

      if (currentUser?.success && currentUser.user) {
        setUser(currentUser.user);

        return {
          success: true,
          user: currentUser.user,
        };
      }

      /*
       * We received a token but could not retrieve
       * the authenticated user.
       */
      clearAuth();
      setUser(null);

      return {
        success: false,
        message: "Login succeeded, but the user account could not be loaded.",
      };
    } catch (error) {
      console.error("Authentication error:", error);

      return {
        success: false,
        message:
          error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Unable to sign in. Please try again.",
      };
    }
  };

  /*
   * REAL LOGOUT
   *
   * Clears the JWT tokens and stored user.
   */
  const logout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      clearAuth();
    }
  };

  /*
   * Useful permission helpers.
   *
   * These do not grant permissions.
   * They only read permissions/role returned by Django.
   */

  const hasRole = (role) => {
    if (!user || !role) return false;

    const userRole = user.role || user.role_name;

    if (typeof userRole === "object") {
      return (
        userRole.name === role ||
        userRole.code === role
      );
    }

    return userRole === role;
  };

  const hasPermission = (permission) => {
    if (!user || !permission) return false;

    /*
     * Support different possible API response structures.
     */
    const permissions =
      user.permissions ||
      user.user_permissions ||
      user.permission_codes ||
      [];

    if (!Array.isArray(permissions)) {
      return false;
    }

    return permissions.some((item) => {
      if (typeof item === "string") {
        return item === permission;
      }

      if (typeof item === "object") {
        return (
          item.codename === permission ||
          item.name === permission ||
          item.code === permission ||
          item.permission === permission
        );
      }

      return false;
    });
  };

  const isAuthenticated = Boolean(user && getAccessToken());

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider"
    );
  }

  return context;
};