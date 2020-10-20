/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type { IMsalContext } from "./MsalContext";
export type { MsalProviderProps } from "./MsalProvider";
export type { MsalAuthenticationProps, MsalTemplateProps } from "./Templates";
export type { WithMsalProps } from "./withMsal";
export type { AccountIdentifiers } from "./useIsAuthenticated";

export { MsalContext, MsalConsumer } from "./MsalContext";
export { MsalProvider, useMsal } from "./MsalProvider";

export { AuthenticatedTemplate, UnauthenticatedTemplate, MsalAuthenticationTemplate } from "./Templates";

export { withMsal } from "./withMsal";

export { useHandleRedirect } from "./useHandleRedirect";
export { useIsAuthenticated } from "./useIsAuthenticated";
export { useMsalAuthentication } from "./useMsalAuthentication";

