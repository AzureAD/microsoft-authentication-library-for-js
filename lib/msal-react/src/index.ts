/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type { IMsalContext } from "./MsalContext";
export { MsalContext, MsalConsumer } from "./MsalContext";

export type { MsalProviderProps } from "./MsalProvider";
export { MsalProvider, useMsal } from "./MsalProvider";

export type { IMsalAuthenticationProps } from "./MsalAuthentication";
export { MsalAuthentication, useMsalAuthentication } from "./MsalAuthentication";

export { AuthenticatedTemplate, UnauthenticatedTemplate } from "./Templates";

export type { IWithMsalProps } from "./withMsal";
export { withMsal } from "./withMsal";

export { useHandleRedirect } from "./useHandleRedirect";

export type { AccountIdentifiers } from "./useIsAuthenticated";
export { useIsAuthenticated } from "./useIsAuthenticated";
