export const ADMIN_ROLES = ["admin", "superAdmin", "regional", "national"];
export const DONOR_ROLES = ["user"];
export const REGIONAL_ROLES = ["regional", "national", "superAdmin"];
export const NATIONAL_ROLES = ["national", "superAdmin"];
export const SUPER_ADMIN_ROLES = ["superAdmin"];

const USER_STORAGE_KEY = "user";
const TOKEN_STORAGE_KEY = "token";

const decodeJwtPayload = (token = "") => {
  try {
    const [, payload = ""] = token.split(".");
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = JSON.parse(atob(padded));

    return decoded && typeof decoded === "object" ? decoded : null;
  } catch {
    return null;
  }
};

const isTokenExpired = (token = "") => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};

export const clearStoredSession = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
};

export const getStoredUser = () => {
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const getStoredToken = () => localStorage.getItem(TOKEN_STORAGE_KEY) || "";

export const getAuthSession = () => {
  const token = getStoredToken();
  const user = getStoredUser();

  if (!token || !user?.role || isTokenExpired(token)) {
    if (token || user) {
      clearStoredSession();
    }
    return { token: "", user: null };
  }

  return { token, user };
};

export const hasRole = (user, roles) => {
  return Boolean(user?.role && roles.includes(user.role));
};

export const getDefaultRouteForUser = (user) => {
  if (hasRole(user, ADMIN_ROLES)) {
    return "/admin";
  }

  if (hasRole(user, DONOR_ROLES)) {
    return "/donor";
  }

  return "/login";
};
