import { Injectable } from '@angular/core';

const TOKEN_QUERY_PARAM = 'token';
const TOKEN_STORAGE_KEY = 'initiative-kourial.authToken';

@Injectable({ providedIn: 'root' })
export class AuthTokenService {
  getToken(): string | null {
    return this.storage()?.getItem(TOKEN_STORAGE_KEY) ?? null;
  }

  setToken(token: string): void {
    const trimmedToken = token.trim();

    if (trimmedToken) {
      this.storage()?.setItem(TOKEN_STORAGE_KEY, trimmedToken);
    }
  }

  clearToken(): void {
    this.storage()?.removeItem(TOKEN_STORAGE_KEY);
  }

  captureTokenFromCurrentUrl(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL(window.location.href);
    const token = url.searchParams.get(TOKEN_QUERY_PARAM);

    if (!token) {
      return;
    }

    this.setToken(token);
    url.searchParams.delete(TOKEN_QUERY_PARAM);

    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, document.title, nextPath);
  }

  authorizationHeader(): Record<string, string> {
    const token = this.getToken();

    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
