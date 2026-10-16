const AUTH_STORAGE_KEY = "eventpro_auth";
const LEGACY_STORAGE_KEY = "checkmate_session";

export function saveAuthSession(data) {
  sessionStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify(data)
  );
}

export function getAuthSession() {
  const storedSession =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    sessionStorage.getItem(LEGACY_STORAGE_KEY) ||
    (typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_STORAGE_KEY) : null);

  if (!storedSession) {
    return null;
  }

  try {
    return JSON.parse(storedSession);
  } catch {
    return null;
  }
}

export function clearAuthSession() {
  sessionStorage.removeItem(AUTH_STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

export function getAuthToken() {
  const session = getAuthSession();
  return session?.token || session?.accessToken || session?.access_token || null;
}

export function getAuthRole() {
  const session = getAuthSession();
  return session?.role || session?.user?.role || null;
}

export function getAuthEmail() {
  const session = getAuthSession();
  return session?.user?.email || session?.email || null;
}

export function getAuthUser() {
  const session = getAuthSession();
  return session?.user || null;
}