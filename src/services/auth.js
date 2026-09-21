import api from "./api";

const ACCESS_TOKEN_KEY = "kukufarm_access";
const REFRESH_TOKEN_KEY = "kukufarm_refresh";
const USER_KEY = "kukufarm_user";

/**
 * Login
 *
 * POST /api/auth/login/
 *
 * Request:
 * {
 *   username: "admin",
 *   password: "Admin@12345"
 * }
 *
 * Expected response:
 * {
 *   access: "...",
 *   refresh: "...",
 *   user: {...}
 * }
 */
export async function login(username, password) {
  try {
    if (!username?.trim()) {
      return {
        success: false,
        message: "Username is required.",
      };
    }

    if (!password) {
      return {
        success: false,
        message: "Password is required.",
      };
    }

    const response = await api.post("/auth/login/", {
      username: username.trim(),
      password,
    });

    const data = response.data || {};

    /*
     * Store JWT access token.
     */
    if (data.access) {
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        data.access
      );
    }

    /*
     * Store JWT refresh token.
     */
    if (data.refresh) {
      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        data.refresh
      );
    }

    /*
     * If login endpoint returns the user,
     * store it immediately.
     */
    if (data.user) {
      localStorage.setItem(
        USER_KEY,
        JSON.stringify(data.user)
      );
    }

    /*
     * If tokens were not returned, authentication
     * was not completed correctly.
     */
    if (!data.access) {
      clearAuth();

      return {
        success: false,
        message:
          "Login response did not contain an access token.",
      };
    }

    return {
      success: true,
      data,
      user: data.user || null,
    };
  } catch (error) {
    console.error("Login failed:", error);

    /*
     * Remove any stale authentication data after
     * an unsuccessful login.
     */
    clearAuth();

    const data = error?.response?.data;

    let message = "Invalid username or password.";

    if (data) {
      if (typeof data === "string") {
        message = data;
      } else if (data.detail) {
        message = Array.isArray(data.detail)
          ? data.detail[0]
          : data.detail;
      } else if (data.message) {
        message = Array.isArray(data.message)
          ? data.message[0]
          : data.message;
      } else if (data.non_field_errors) {
        message = Array.isArray(data.non_field_errors)
          ? data.non_field_errors[0]
          : data.non_field_errors;
      } else if (data.username) {
        message = Array.isArray(data.username)
          ? data.username[0]
          : data.username;
      } else if (data.password) {
        message = Array.isArray(data.password)
          ? data.password[0]
          : data.password;
      }
    } else if (error?.request) {
      message =
        "Unable to connect to the KukuFarm server. Please make sure the Django API is running.";
    }

    return {
      success: false,
      message,
      error,
    };
  }
}

/**
 * Refresh JWT access token.
 *
 * POST /api/auth/token/refresh/
 */
export async function refreshToken() {
  const refresh = getRefreshToken();

  if (!refresh) {
    return {
      success: false,
      message: "No refresh token found.",
    };
  }

  try {
    const response = await api.post(
      "/auth/token/refresh/",
      {
        refresh,
      }
    );

    const data = response.data || {};

    if (!data.access) {
      throw new Error(
        "No access token returned by refresh endpoint."
      );
    }

    localStorage.setItem(
      ACCESS_TOKEN_KEY,
      data.access
    );

    /*
     * SimpleJWT may rotate refresh tokens.
     */
    if (data.refresh) {
      localStorage.setItem(
        REFRESH_TOKEN_KEY,
        data.refresh
      );
    }

    return {
      success: true,
      access: data.access,
      refresh: data.refresh || refresh,
    };
  } catch (error) {
    console.error("Token refresh failed:", error);

    clearAuth();

    return {
      success: false,
      message:
        "Your session has expired. Please login again.",
      error,
    };
  }
}

/**
 * Get currently authenticated user.
 *
 * GET /api/auth/me/
 */
export async function getCurrentUser() {
  const access = getAccessToken();

  if (!access) {
    return {
      success: false,
      user: null,
    };
  }

  try {
    const response = await api.get("/auth/me/");

    const user = response.data;

    if (!user) {
      return {
        success: false,
        user: null,
        message: "User information was not returned.",
      };
    }

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error(
      "Unable to get current user:",
      error
    );

    return {
      success: false,
      user: null,
      error,
    };
  }
}

/**
 * Logout
 *
 * Currently logout is handled client-side by
 * removing the JWT tokens.
 *
 * If Django later implements SimpleJWT blacklist,
 * this function can also call:
 *
 * POST /api/auth/logout/
 */
export async function logout() {
  try {
    const refresh = getRefreshToken();

    /*
     * Reserved for future backend blacklist support.
     */
    void refresh;
  } catch (error) {
    console.error(
      "Logout API error:",
      error
    );
  } finally {
    clearAuth();
  }

  return {
    success: true,
  };
}

/**
 * Get access token.
 */
export function getAccessToken() {
  return localStorage.getItem(
    ACCESS_TOKEN_KEY
  );
}

/**
 * Get refresh token.
 */
export function getRefreshToken() {
  return localStorage.getItem(
    REFRESH_TOKEN_KEY
  );
}

/**
 * Get stored authenticated user.
 */
export function getStoredUser() {
  const user = localStorage.getItem(
    USER_KEY
  );

  if (!user) {
    return null;
  }

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error(
      "Invalid stored KukuFarm user:",
      error
    );

    localStorage.removeItem(USER_KEY);

    return null;
  }
}

/**
 * Check whether the user has an access token.
 */
export function isAuthenticated() {
  return Boolean(getAccessToken());
}

/**
 * Clear all authentication information.
 */
export function clearAuth() {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    USER_KEY
  );
}

/**
 * Authentication storage keys.
 */
export const AUTH_KEYS = {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
};

/**
 * Default export.
 *
 * Allows:
 *
 * import auth from "../services/auth";
 *
 * Named exports are also available.
 */
const auth = {
  login,
  refreshToken,
  getCurrentUser,
  logout,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  isAuthenticated,
  clearAuth,
  AUTH_KEYS,
};
