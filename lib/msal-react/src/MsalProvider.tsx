import * as React from "react";
import { useContext } from "react";
import {
    IPublicClientApplication,
    AccountInfo,
    BroadcastEvent, BroadcastMessage, AuthError
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";

export type MsalProviderProps = {
    instance: IPublicClientApplication;
};

export const MsalProvider: React.FunctionComponent<MsalProviderProps> = ({instance, children}) => {
    // State hook to store accounts
    const [accounts, setAccounts] = React.useState<AccountInfo[]>(
        // TODO: Remove the `|| []` hack when PR is finally merged to msal/browser
        instance.getAllAccounts() || []
    );

    const [error, setError] = React.useState<Error|AuthError|null>(null);
    const [loginInProgress, setLoginInProgress] = React.useState<boolean>(false);

    React.useEffect(() => {
        instance.addEventCallback((message: BroadcastMessage) => {
            switch (message.type) {
                case BroadcastEvent.LOGIN_START:
                    setLoginInProgress(true);
                    break;
                case BroadcastEvent.LOGIN_SUCCESS:
                    setLoginInProgress(false);
                    setAccounts(instance.getAllAccounts());
                    setError(null);
                    break;
                case BroadcastEvent.LOGIN_FAILURE:
                    setLoginInProgress(false);
                    setError(message.error);
                    break;
                case BroadcastEvent.ACQUIRE_TOKEN_SUCCESS:
                case BroadcastEvent.HANDLE_REDIRECT_SUCCESS:
                case BroadcastEvent.SSO_SILENT_SUCCESS:
                case BroadcastEvent.LOGOUT_SUCCESS:
                    setAccounts(instance.getAllAccounts());
                    setError(null);
                    break;
                case BroadcastEvent.ACQUIRE_TOKEN_FAILURE:
                case BroadcastEvent.HANDLE_REDIRECT_FAILURE:
                case BroadcastEvent.SSO_SILENT_FAILURE:
                case BroadcastEvent.LOGOUT_FAILURE:
                    setError(message.error);
                    break;
            }
        });
    }, [instance]);

    const contextValue: IMsalContext = {
        instance,
        state: {
            loginInProgress,
            accounts, 
            error
        }
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
};

export const useMsal = () => useContext(MsalContext);
