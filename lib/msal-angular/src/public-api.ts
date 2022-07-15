/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-angular
 */

export { MsalService } from "./msal.service";
export { IMsalService } from "./IMsalService";
export { MsalGuard } from "./msal.guard";
export { MsalGuardConfiguration, MsalGuardAuthRequest } from "./msal.guard.config";
export { MsalInterceptor } from "./msal.interceptor";
export { MsalInterceptorConfiguration, MsalInterceptorAuthRequest, ProtectedResourceScopes } from "./msal.interceptor.config";
export { MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG, MSAL_BROADCAST_CONFIG } from "./constants";
export { MsalBroadcastService } from "./msal.broadcast.service";
export { MsalBroadcastConfiguration } from "./msal.broadcast.config";
export { MsalModule } from "./msal.module";
export { MsalRedirectComponent } from "./msal.redirect.component";
export { MsalCustomNavigationClient } from "./msal.navigation.client";
export { version } from "./packageMetadata";
