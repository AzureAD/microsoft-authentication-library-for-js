import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";

import { PublicClientApplication, Configuration, AuthenticationParameters, TokenResponse, Account } from "@azure/msal-browser";
import { MsalContext, IMsalProviderContext } from "./MsalContext";

// TODO: How do we get the token before executing an API call in pure TypeScript, outside of a React component context?
// TODO: How do we handle multiple accounts?
// TODO: How do we raise the `isAuthenticated` and `error` state into the MsalContext, where changes will allow all subscribed components to update?
// TODO: How do we represent the current state of the authentication process (Authenticated, InProgress, IsError, Unauthenticated)?
//      This will be important for showing intermediary UI such as loading or error components

// Just a friendlier public alias for the context object
export interface IMsalProps extends IMsalProviderContext {};

export enum AuthenticationMethod {
    REDIRECT,
    POPUP
}

export function useMsal() {
    return useContext(MsalContext);
};

export function useHandleRedirect(): TokenResponse | null {
    const msal = useMsal();
    const [ redirectResponse, setRedirectResponse ] = useState<TokenResponse | null>(null);

    useEffect(() => {
        msal.handleRedirectPromise()
            .then(response => setRedirectResponse(response));
            // TODO: error handling
    }, [msal]);

    return redirectResponse;
}

// References for HOC pattern:
//  https://react-typescript-cheatsheet.netlify.app/docs/hoc/intro
//  https://www.pluralsight.com/guides/higher-order-composition-typescript-react
export const withMsal = <P extends IMsalProps = IMsalProps>(Component: React.ComponentType<P>) => {
    const ComponentWithMsal: React.FunctionComponent<P> = (props) => {
        const msal = useMsal();
        return <Component {...props} {...msal} />;
    };

    const componentName = Component.displayName || Component.name || "Component";
    ComponentWithMsal.displayName = `withMsal(${componentName})`;

    return ComponentWithMsal;
};

type MsalAuthenticationHook = {
    isAuthenticated: boolean,
    error: Error | null,
    msal: IMsalProps
}

// TODO: Should `forceLogin` and `authenticationMethod` be contained in an object so we can add to the parameters without breaking changes to the API?
export function useMsalAuthentication(request: AuthenticationParameters = {}, forceLogin: boolean = false, authenticationMethod: AuthenticationMethod = AuthenticationMethod.POPUP): MsalAuthenticationHook {
    const msal = useMsal();
    const isAuthenticated = !!msal.account;

    // TODO: This state will only exist in this hook, may be safer to move the error state into the MsalContext
    const [ error, setError ] = useState<Error | null>(null);

    // TODO: This is error prone because it asynchronously sets state, but the component may be unmounted before the process completes
    //  May be better to move this into the the MsalContext
    const loginInteractively = useCallback(
        async (method: AuthenticationMethod): Promise<void> => {
            if (method === AuthenticationMethod.POPUP) {
                msal.loginPopup(request)
                .catch((error) => {
                    setError(error);
                });
            } else {
                msal.loginRedirect(request);
            }
            
        }    
    , [msal, request]);

    useEffect(() => {
        if (isAuthenticated) {
            const account = msal.account;
            // TODO: Figure out why ssoSilent fails with "iframe_closed_prematurely" error

            // context?.ssoSilent({loginHint: account!.userName})
            //     .catch((error) => {
            //         if (forceLogin) {
            //             console.log(error)
            //             loginInteractively();
            //         } else {
            //             console.log(error)
            //             setError(error);
            //         }
            //     });
        // TODO: What if there is an error? How do errors get cleared?
        // TODO: What if user cancels the flow?
        } else if (forceLogin) {
            loginInteractively(authenticationMethod);
        } 
    }, [isAuthenticated, error, loginInteractively]);

    return useMemo(() => ({
        isAuthenticated,
        error,
        msal
    }), [isAuthenticated, error, msal]);
}

export type MsalProviderProps = {
    configuration: Configuration
};

// TODO: Mitigation for double render with React.StrictMode
export const MsalProvider: React.FunctionComponent<MsalProviderProps> = (props) => {
    const { configuration, children } = props;

    const msal = useMemo(() => new PublicClientApplication(configuration), [configuration]);
    const [account, setAccount] = useState<Account | null>(msal.getAccount());

    
    const reactMsal = useMemo(() => ({
        acquireTokenPopup: msal.acquireTokenPopup,
        acquireTokenRedirect: msal.acquireTokenRedirect,
        acquireTokenSilent: msal.acquireTokenSilent,
        getAccount: msal.getAccount,
        // TODO: How do consumers override this behavior, or add their own callbacks?
        handleRedirectPromise: async (): Promise<TokenResponse | null> => {
            const response = await msal.handleRedirectPromise();
            const account = msal.getAccount();
            setAccount(account)
            return response;
        },
        loginPopup: async (request: AuthenticationParameters): Promise<TokenResponse> => {
            const response = await msal.loginPopup(request);
            const account = msal.getAccount();
            setAccount(account);
            return response;
        },
        loginRedirect: msal.loginRedirect,
        logout: async (): Promise<void> => {
            await msal.logout();
            const account = msal.getAccount();
            setAccount(account);
        },
        ssoSilent: async (request: AuthenticationParameters): Promise<TokenResponse> =>{
            const response = await msal.ssoSilent(request);
            const account = msal.getAccount();
            setAccount(account);
            return response;
        },
    }), [msal]);

    const contextValue = useMemo(() => ({
        ...reactMsal,
        account
    }), [reactMsal, account]);

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}

export type MsalAuthenticationProps = {
    authenticationParameters?: AuthenticationParameters,
    authenticationMethod?: AuthenticationMethod
    forceLogin?: boolean,
}

export const MsalAuthentication: React.FunctionComponent<MsalAuthenticationProps> = (props) => {
    const { authenticationMethod, authenticationParameters, forceLogin, children } = props;
    const { msal } = useMsalAuthentication(authenticationParameters, forceLogin, authenticationMethod);

    return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
}

export const UnauthenticatedTemplate: React.FunctionComponent = ({ children }) => {
    const msal = useMsal()

    if (!msal.account) {
        return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
    }
    return null;
}

export const AuthenticatedTemplate: React.FunctionComponent = ({ children }) => {
    const msal = useMsal()

    if (msal.account) {
        return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
    }
    return null;
}

type FaaCFunction = (props: IMsalProps) => React.ReactNode;

function getChildrenOrFunction(children: React.ReactNode | FaaCFunction, props: IMsalProps): React.ReactNode {
    if (typeof children === 'function') {
        return children(props);
    }
    return children;
}