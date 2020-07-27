import { Configuration, PublicClientApplication, AccountInfo, IPublicClientApplication, AuthenticationResult, AuthorizationUrlRequest, EndSessionRequest } from "@azure/msal-browser";
import React, { useMemo, useState, useCallback, useContext, useEffect } from "react";

import { MsalContext, IMsalProps } from "./MsalContext";

export type MsalProviderProps = {
    configuration: Configuration
};

// TODO: Mitigation for double render with React.StrictMode
export const MsalProvider: React.FunctionComponent<MsalProviderProps> = (props) => {
    const { configuration, children } = props;

    const msal = useMemo(() => new PublicClientApplication(configuration), [configuration]);

    // TODO: IPublicClientApplication signature for getAllAccounts() and getAccountByUsername()
    //  should be corrected to have proper return type (ex: AccountInfo[] | null)
    const [accounts, setAccounts] = useState<AccountInfo[]>(msal.getAllAccounts() || []);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!msal.getAllAccounts());

    const updateContextState = useCallback(() => {
        setAccounts(msal.getAllAccounts() || []);
        setIsAuthenticated(!!msal.getAllAccounts());
    }, [msal])

    const reactMsal = useMemo(() => {
        const msalWrapper: IPublicClientApplication = {
            acquireTokenPopup: msal.acquireTokenPopup.bind(msal),
            acquireTokenRedirect: msal.acquireTokenRedirect.bind(msal),
            acquireTokenSilent: msal.acquireTokenSilent.bind(msal),
            getAllAccounts: msal.getAllAccounts.bind(msal),
            getAccountByUsername: msal.getAccountByUsername.bind(msal),
            handleRedirectPromise: async (): Promise<AuthenticationResult | null> => {
                const response = await msal.handleRedirectPromise();

                if (response) {
                    updateContextState();
                }

                return response;
            },
            loginPopup: async (request: AuthorizationUrlRequest): Promise<AuthenticationResult> => {
                const response = await msal.loginPopup(request);
                updateContextState();
                return response;
            },
            loginRedirect: msal.loginRedirect.bind(msal),
            logout: async (logoutRequest?: EndSessionRequest | undefined): Promise<void> => {
                await msal.logout(logoutRequest);
                updateContextState();
            },
            ssoSilent: async (request: AuthorizationUrlRequest): Promise<AuthenticationResult> =>{
                const response = await msal.ssoSilent(request);
                updateContextState();
                return response;
            },
        }

        return msalWrapper;
    }, [msal, updateContextState]);

    // TODO: Update the authentication state if the page is returning from redirect login
    //  This allows redirect authentication to automatically update the context, but will
    //  break any other component that uses the useRedirectHandle(), throwing a state
    //  mismatch xception
    // useEffect(() => {
    //     reactMsal.handleRedirectPromise();
    // }, [reactMsal]);

    const contextValue = useMemo(() => {
        const context: IMsalProps = {
            ...reactMsal,
            accounts,
            isAuthenticated
        }

        return context;
    }, [reactMsal, accounts, isAuthenticated]);

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}

export function useMsal() {
    return useContext(MsalContext);
};