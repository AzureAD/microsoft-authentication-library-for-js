/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * @packageDocumentation
 * @module @azure/msal-react
 */

export type { IMsalContext } from "./MsalContext.js";
export type { MsalProviderProps } from "./MsalProvider.js";
export type { MsalAuthenticationResult } from "./hooks/useMsalAuthentication.js";
export type { MsalAuthenticationProps } from "./components/MsalAuthenticationTemplate.js";
export type { AuthenticatedTemplateProps } from "./components/AuthenticatedTemplate.js";
export type { UnauthenticatedTemplateProps } from "./components/UnauthenticatedTemplate.js";
export type { WithMsalProps } from "./components/withMsal.js";
export type { AccountIdentifiers } from "./types/AccountIdentifiers.js";

export { MsalContext, MsalConsumer } from "./MsalContext.js";
export { MsalProvider } from "./MsalProvider.js";

export { AuthenticatedTemplate } from "./components/AuthenticatedTemplate.js";
export { UnauthenticatedTemplate } from "./components/UnauthenticatedTemplate.js";
export { MsalAuthenticationTemplate } from "./components/MsalAuthenticationTemplate.js";

export { withMsal } from "./components/withMsal.js";
export { Subtract, SetComplement, SetDifference } from "./utils/utilities.js";

export { useMsal } from "./hooks/useMsal.js";
export { useAccount } from "./hooks/useAccount.js";
export { useIsAuthenticated } from "./hooks/useIsAuthenticated.js";
export { useMsalAuthentication } from "./hooks/useMsalAuthentication.js";

export { version } from "./packageMetadata.js";
