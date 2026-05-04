import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { AuthTokenService } from './auth-token.service';

export const authTokenInterceptor: HttpInterceptorFn = (request, next) => {
  const authTokenService = inject(AuthTokenService);
  const token = authTokenService.getToken();

  if (!token || !isSameOriginRequest(request.url)) {
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

function isSameOriginRequest(url: string): boolean {
  if (typeof window === 'undefined') {
    return url.startsWith('/');
  }

  return new URL(url, window.location.origin).origin === window.location.origin;
}
