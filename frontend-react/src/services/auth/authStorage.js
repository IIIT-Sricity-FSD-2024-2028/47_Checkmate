const AUTH_STORAGE_KEY = "eventpro_auth";

export function saveAuthSession(data) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(data)
  );
}

export function getAuthSession() {
  const storedSession = sessionStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedSession) {
    return null;
  }

  return JSON.parse(storedSession);
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
}