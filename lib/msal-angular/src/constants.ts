/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { InjectionToken } from "@angular/core";
import { type IPublicClientApplication } from "@azure/msal-browser";
import { type MsalBroadcastConfiguration } from "./msal.broadcast.config";
import { type MsalGuardConfiguration } from "./msal.guard.config";
import { type MsalInterceptorConfiguration } from "./msal.interceptor.config";

export const MSAL_INSTANCE = new InjectionToken<IPublicClientApplication>(
  "MSAL_INSTANCE"
);

export const MSAL_GUARD_CONFIG = new InjectionToken<MsalGuardConfiguration>(
  "MSAL_GUARD_CONFIG"
);

export const MSAL_INTERCEPTOR_CONFIG =
  new InjectionToken<MsalInterceptorConfiguration>("MSAL_INTERCEPTOR_CONFIG");

export const MSAL_BROADCAST_CONFIG =
  new InjectionToken<MsalBroadcastConfiguration>("MSAL_BROADCAST_CONFIG");
