const ACCESS_TOKEN_KEY = "glimmora_access_token";
const REFRESH_TOKEN_KEY = "glimmora_refresh_token";
const USER_KEY = "glimmora_user";

function getBrowserStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return {
    tab: window.sessionStorage,
    legacy: window.localStorage,
  };
}

export function getStoredAccessToken(): string | null {
  const storage = getBrowserStorage();
  if (!storage) return null;
  return storage.tab.getItem(ACCESS_TOKEN_KEY) || storage.legacy.getItem(ACCESS_TOKEN_KEY);
}

export function storeAuthTokens(accessToken: string, refreshToken: string) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.tab.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.tab.setItem(REFRESH_TOKEN_KEY, refreshToken);
  storage.legacy.removeItem(ACCESS_TOKEN_KEY);
  storage.legacy.removeItem(REFRESH_TOKEN_KEY);
}

export function storeAuthUser(user: unknown) {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.tab.setItem(USER_KEY, JSON.stringify(user));
  storage.legacy.removeItem(USER_KEY);
}

export function getStoredAuthUser<T>(): T | null {
  const storage = getBrowserStorage();
  if (!storage) return null;
  const raw = storage.tab.getItem(USER_KEY) || storage.legacy.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    storage.tab.removeItem(USER_KEY);
    storage.legacy.removeItem(USER_KEY);
    return null;
  }
}

export function clearStoredAuth() {
  const storage = getBrowserStorage();
  if (!storage) return;
  storage.tab.removeItem(ACCESS_TOKEN_KEY);
  storage.tab.removeItem(REFRESH_TOKEN_KEY);
  storage.tab.removeItem(USER_KEY);
  storage.legacy.removeItem(ACCESS_TOKEN_KEY);
  storage.legacy.removeItem(REFRESH_TOKEN_KEY);
  storage.legacy.removeItem(USER_KEY);
}
