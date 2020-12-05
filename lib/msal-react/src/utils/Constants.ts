/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum InteractionStatus {
    Startup = "startup",
    Login = "login",
    Logout = "logout",
    AcquireToken = "acquireToken",
    SsoSilent = "ssoSilent",
    HandleRedirect = "handleRedirect",
    None = "none"
}
