import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "http://127.0.0.1:8000/api";

const ACCESS_TOKEN_KEY = "kukufarm_access";
const REFRESH_TOKEN_KEY = "kukufarm_refresh";

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
|
| Automatically attach the JWT access token to every API request.
|
*/

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem(
      ACCESS_TOKEN_KEY
    );

    if (accessToken) {
      config.headers = config.headers || {};

      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
|
| If Django returns 401:
|
| 1. Get refresh token
| 2. Request a new access token
| 3. Save the new token
| 4. Retry the original request
|
*/

let isRefreshing = false;

let refreshSubscribers = [];

/*
 * Add requests waiting for a refreshed token.
 */
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

/*
 * Notify waiting requests when a new token is available.
 */
const onRefreshed = (token) => {
  refreshSubscribers.forEach((callback) => {
    callback(token);
  });

  refreshSubscribers = [];
};

/*
 * Clear authentication information.
 */
const clearAuthentication = () => {
  localStorage.removeItem(
    ACCESS_TOKEN_KEY
  );

  localStorage.removeItem(
    REFRESH_TOKEN_KEY
  );

  localStorage.removeItem(
    "kukufarm_user"
  );
};

/*
 * Redirect to login.
 *
 * We use window.location instead of React Router here because
 * Axios exists outside React components.
 */
const redirectToLogin = () => {
  if (
    window.location.pathname !== "/login"
  ) {
    window.location.href = "/login";
  }
};

api.interceptors.response.use(
  (response) => {
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    /*
     * No response from server.
     */
    if (!error.response) {
      return Promise.reject(error);
    }

    /*
     * Only handle 401 Unauthorized.
     */
    if (
      error.response.status !== 401 ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    /*
     * Prevent infinite retry loops.
     */
    if (originalRequest._retry) {
      clearAuthentication();
      redirectToLogin();

      return Promise.reject(error);
    }

    /*
     * Don't try to refresh the token when the failed
     * request itself is the login/refresh endpoint.
     */
    if (
      originalRequest.url?.includes(
        "/auth/login/"
      ) ||
      originalRequest.url?.includes(
        "/auth/token/refresh/"
      )
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken =
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      );

    /*
     * No refresh token means the session has expired.
     */
    if (!refreshToken) {
      clearAuthentication();
      redirectToLogin();

      return Promise.reject(error);
    }

    /*
     * If another request is already refreshing,
     * wait for it.
     */
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((token) => {
          if (!token) {
            reject(error);
            return;
          }

          originalRequest.headers =
            originalRequest.headers || {};

          originalRequest.headers.Authorization =
            `Bearer ${token}`;

          resolve(api(originalRequest));
        });
      });
    }

    /*
     * Start token refresh.
     */
    isRefreshing = true;

    try {
      /*
       * IMPORTANT:
       * Use axios directly here instead of `api.post()`
       * to avoid triggering this interceptor again.
       */
      const response = await axios.post(
        `${API_BASE_URL}/auth/token/refresh/`,
        {
          refresh: refreshToken,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const newAccessToken =
        response.data?.access;

      if (!newAccessToken) {
        throw new Error(
          "No access token returned by refresh endpoint."
        );
      }

      /*
       * Save new access token.
       */
      localStorage.setItem(
        ACCESS_TOKEN_KEY,
        newAccessToken
      );

      /*
       * Some Django SimpleJWT configurations
       * rotate the refresh token.
       */
      if (response.data?.refresh) {
        localStorage.setItem(
          REFRESH_TOKEN_KEY,
          response.data.refresh
        );
      }

      /*
       * Notify all requests waiting for the token.
       */
      onRefreshed(newAccessToken);

      /*
       * Update original request.
       */
      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      /*
       * Retry original request.
       */
      return api(originalRequest);
    } catch (refreshError) {
      /*
       * Refresh token is invalid/expired.
       */
      console.error(
        "JWT refresh failed:",
        refreshError
      );

      clearAuthentication();

      /*
       * Release waiting requests.
       */
      onRefreshed(null);

      redirectToLogin();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;