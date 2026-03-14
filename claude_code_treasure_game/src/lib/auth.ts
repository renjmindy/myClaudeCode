const TOKEN_KEY = 'treasure_token';

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export interface DecodedToken {
  userId: number;
  username: string;
  exp: number;
}

export function decodeToken(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload)) as DecodedToken;
    if (decoded.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}
