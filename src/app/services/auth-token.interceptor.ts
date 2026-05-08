import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from '../../environments/environment';
import { AuthTokenService } from './auth-token.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authTokenService = inject(AuthTokenService);
  const token = authTokenService.getToken();

  if (!token || !isApiRequest(request.url)) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};

function isApiRequest(url: string): boolean {
  if (typeof window === 'undefined') {
    return url.startsWith('/api/') || url.startsWith(`${environment.apiBaseUrl}/api/`);
  }

  const requestUrl = new URL(url, window.location.origin);
  const apiOrigin = environment.apiBaseUrl
    ? new URL(environment.apiBaseUrl, window.location.origin).origin
    : window.location.origin;

  return requestUrl.origin === apiOrigin && requestUrl.pathname.startsWith('/api/');
}
