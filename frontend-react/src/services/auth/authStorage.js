const AUTH_STORAGE_KEY = "eventpro_auth";
const LEGACY_STORAGE_KEY = "checkmate_session";

export function saveAuthSession(data) {
  if (!data) return;
  const sessionStr = JSON.stringify(data);
  try {
    sessionStorage.setItem(AUTH_STORAGE_KEY, sessionStr);
    sessionStorage.setItem(LEGACY_STORAGE_KEY, sessionStr);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(AUTH_STORAGE_KEY, sessionStr);
      localStorage.setItem(LEGACY_STORAGE_KEY, sessionStr);
    }

    const role = data.role || data.user?.role;
    if (role) {
      sessionStorage.setItem("accountType", role);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("accountType", role);
      }
    }
  } catch (err) {
    console.error("Failed to persist auth session:", err);
  }
}

export function getAuthSession() {
  const storedSession =
    sessionStorage.getItem(AUTH_STORAGE_KEY) ||
    sessionStorage.getItem(LEGACY_STORAGE_KEY) ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY)
      : null);
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
  sessionStorage.removeItem("accountType");
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem("accountType");
  }
}

// Pages anyone may see; a dead sign-in is cleared on these without leaving the page
const PUBLIC_PATHS = ["/", "/landing", "/signin", "/signup-details", "/signup-password", "/join-staff"];

/**
 * Called when the backend rejects the saved sign-in (expired, or made by a server
 * with a different JWT secret). Forgets it and, on a signed-in page, goes to Sign In.
 */
export function endExpiredSession() {
  if (!getAuthToken()) return;
  clearAuthSession();
  if (typeof window !== "undefined" && !PUBLIC_PATHS.includes(window.location.pathname)) {
    window.location.assign("/signin?expired=1");
  }
}

export function getAuthToken() {
  const session = getAuthSession();
  return session?.token || session?.accessToken || session?.access_token || null;
}

export function getAuthRole() {
  const session = getAuthSession();
  const rawRole = session?.role || session?.user?.role || null;
  return rawRole ? String(rawRole).toLowerCase() : null;
}

export function getAuthEmail() {
  const session = getAuthSession();
  return session?.user?.email || session?.email || null;
}

export function getAuthUser() {
  const session = getAuthSession();
  return session?.user || null;
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}
