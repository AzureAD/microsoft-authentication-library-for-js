/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-react
 */

export type { IMsalContext } from "./MsalContext";
export type { MsalProviderProps } from "./MsalProvider";
export type { MsalAuthenticationResult } from "./hooks/useMsalAuthentication";
export type { MsalAuthenticationProps } from "./components/MsalAuthenticationTemplate";
export type { AuthenticatedTemplateProps } from "./components/AuthenticatedTemplate";
export type { UnauthenticatedTemplateProps } from "./components/UnauthenticatedTemplate";
export type { WithMsalProps } from "./components/withMsal";
export type { AccountIdentifiers } from "./types/AccountIdentifiers";

export { MsalContext, MsalConsumer } from "./MsalContext";
export { MsalProvider } from "./MsalProvider";

export { AuthenticatedTemplate } from "./components/AuthenticatedTemplate";
export { UnauthenticatedTemplate } from "./components/UnauthenticatedTemplate";
export { MsalAuthenticationTemplate } from "./components/MsalAuthenticationTemplate";

export { withMsal } from "./components/withMsal";

export { useMsal } from "./hooks/useMsal";
export { useAccount } from "./hooks/useAccount";
export { useIsAuthenticated } from "./hooks/useIsAuthenticated";
export { useMsalAuthentication } from "./hooks/useMsalAuthentication";

export { version } from "./packageMetadata";
