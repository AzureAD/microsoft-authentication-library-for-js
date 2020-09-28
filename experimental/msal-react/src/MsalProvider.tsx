import * as React from 'react';
import { useContext } from 'react';
import {
    IPublicClientApplication,
    AccountInfo,
    AuthenticationResult,
    AuthorizationUrlRequest,
    EndSessionRequest,
} from '@azure/msal-browser';
import { MsalContext, IMsalContext } from './MsalContext';

export type MsalProviderProps = {
    instance: IPublicClientApplication;
};

export const MsalProvider: React.FunctionComponent<MsalProviderProps> = ({
    instance,
    children,
}) => {
    // State hook to store accounts
    const [accounts, setAccounts] = React.useState<AccountInfo[]>(
        // TODO: Remove the `|| []` hack when PR is finally merged to msal/browser
        instance.getAllAccounts() || []
    );

    // Callback to update accounts after MSAL APIs are invoked
    const updateContextState = React.useCallback(() => {
        // TODO: Remove the `|| []` hack when PR is finally merged to msal/browser
        setAccounts(instance.getAllAccounts() || []);
    }, [instance]);

    // Wrapped instance of MSAL that updates accounts after MSAL APIs are invoked
    const wrappedInstance = React.useMemo<IPublicClientApplication>(() => {
        return {
            acquireTokenPopup: instance.acquireTokenPopup.bind(instance),
            acquireTokenRedirect: instance.acquireTokenRedirect.bind(instance),
            acquireTokenSilent: instance.acquireTokenSilent.bind(instance),
            getAllAccounts: instance.getAllAccounts.bind(instance),
            getAccountByUsername: instance.getAccountByUsername.bind(instance),
            handleRedirectPromise: async (): Promise<AuthenticationResult | null> => {
                const response = await instance.handleRedirectPromise.call(
                    instance
                );

                if (response) {
                    updateContextState();
                }

                return response;
            },
            loginPopup: async (
                request: AuthorizationUrlRequest
            ): Promise<AuthenticationResult> => {
                const response = await instance.loginPopup.call(
                    instance,
                    request
                );
                updateContextState();
                return response;
            },
            loginRedirect: instance.loginRedirect.bind(instance),
            logout: async (
                logoutRequest?: EndSessionRequest | undefined
            ): Promise<void> => {
                await instance.logout.call(instance, logoutRequest);
                updateContextState();
            },
            ssoSilent: async (
                request: AuthorizationUrlRequest
            ): Promise<AuthenticationResult> => {
                const response = await instance.ssoSilent.call(
                    instance,
                    request
                );
                updateContextState();
                return response;
            },
        };
    }, [instance, updateContextState]);

    // Memoized context value
    const contextValue = React.useMemo<IMsalContext>(
        () => ({
            instance: wrappedInstance,
            state: {
                accounts,
            },
        }),
        [wrappedInstance, accounts]
    );

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
};

export const useMsal = () => useContext(MsalContext);
