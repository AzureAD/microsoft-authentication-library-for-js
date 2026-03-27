/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateChildFn,
  CanActivateFn,
  CanMatchFn,
  Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree
} from '@angular/router';

import { AccountInfo } from '@azure/msal-browser';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MsalService } from './msal.service';
import { MsalGuard } from './msal.guard';
import { MsalGuardConfiguration } from './msal.guard.config';
import { MSAL_GUARD_CONFIG } from './constants';

function getAccount(msalService: MsalService): AccountInfo | null {
  let account: AccountInfo | null | undefined = msalService.instance.getActiveAccount();
  if (account) {
    return account;
  }
  account = msalService.instance.getAllAccounts().values().next().value;
  if (account) {
    return account;
  }
  msalService.getLogger()
    .error("RBAC Guard - no accounts retrieved");
  return null;
}

function enforceRbac(router: Router, msalGuardConfig: MsalGuardConfiguration, msalService: MsalService, requiredRoles: string[]): boolean | UrlTree {
  if (requiredRoles.length === 0) {
    return true;
  }
  const account = getAccount(msalService);
  if (account === null) {
    return false;
  }
  let rbacFailedRoute: UrlTree | undefined;
  switch (typeof(msalGuardConfig.rbacFailedRoute)) {
    case 'string':
      rbacFailedRoute = router.parseUrl(msalGuardConfig.rbacFailedRoute);
      break;
    case 'function':
      rbacFailedRoute = router.parseUrl(msalGuardConfig.rbacFailedRoute(requiredRoles, account.idTokenClaims?.roles ?? []));
      break;
    default:
      rbacFailedRoute = undefined;
  }
  const hasRequiredRoles = requiredRoles.every(requiredRole => account.idTokenClaims?.roles?.includes(requiredRole) ?? false);
  if (!hasRequiredRoles && rbacFailedRoute) {
    return rbacFailedRoute;
  }
  return hasRequiredRoles;
}

/**
 * Invokes MsalGuard to require user authentication, then verifies their ID token contains
 * all the roles provided
 * @param roles - a list of roles required to access this route
 */
export function makeRbacGuard(...roles: string[]): CanActivateFn & CanActivateChildFn & CanMatchFn {
  return (route: ActivatedRouteSnapshot | Route, stateOrSegments: RouterStateSnapshot | UrlSegment[]): Observable<boolean | UrlTree> => {
    const router = inject(Router);
    const msalGuard = inject(MsalGuard);
    const msalService = inject(MsalService);
    const msalGuardConfig = inject<MsalGuardConfiguration>(MSAL_GUARD_CONFIG);
    let msalGuardResult: Observable<boolean | UrlTree>;
    if (!Array.isArray(stateOrSegments)) {
      /*
       * note: when invoked as canActivateChild we still call canActivate
       * as the `CanActivateFn` and `CanActivateChildFn` interfaces are identical
       * and cannot be disambiguated at runtime. This is acceptable, as the only difference
       * between the two methods implemented in `@azure/msal-angular` is a single log message.
       */
      msalGuardResult = msalGuard.canActivate(route as ActivatedRouteSnapshot, stateOrSegments as RouterStateSnapshot);
    } else {
      msalGuardResult = msalGuard.canMatch();
    }

    return msalGuardResult.pipe(
      map(result => result === true ? enforceRbac(router, msalGuardConfig, msalService, roles) : result)
    );
  }
}
