import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ApiService } from '../services/api.service';
import { AuthTokenService } from '../services/auth-token.service';

export const companionDraftAccessGuard: CanActivateFn = async () => {
  const authTokenService = inject(AuthTokenService);
  const apiService = inject(ApiService);
  const router = inject(Router);

  if (!authTokenService.getToken()) {
    return router.createUrlTree(['/']);
  }

  try {
    const access = await apiService.getCompanionDraftAccess();
    return access.canAccessPage || router.createUrlTree(['/']);
  } catch {
    return router.createUrlTree(['/']);
  }
};
