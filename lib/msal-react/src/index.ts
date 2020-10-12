/*
 * TODO: How do we get the token before executing an API call in pure TypeScript, outside of a React component context?
 * TODO: How do we raise the `error` state into the MsalContext, where changes will allow all subscribed components to update?
 * TODO: How do we represent the current state of the authentication process (Authenticated, InProgress, IsError, Unauthenticated)?
 *      This will be important for showing intermediary UI such as loading or error components
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
