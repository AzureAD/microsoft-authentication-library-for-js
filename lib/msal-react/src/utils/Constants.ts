/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export const Constants = {
    SKU: "@azure/msal-react",
    VERSION: "1.0.0-alpha.3"
};

export enum InteractionStatus {
    Startup = "startup",
    Login = "login",
    Logout = "logout",
    AcquireToken = "acquireToken",
    SsoSilent = "ssoSilent",
    HandleRedirect = "handleRedirect",
    None = "none"
}
