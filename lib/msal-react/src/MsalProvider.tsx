import * as React from "react";
import { useContext } from "react";
import {
    IPublicClientApplication,
    AccountInfo,
    BroadcastEvent, BroadcastMessage
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

    // Callback to update accounts after MSAL APIs are invoked
    const updateContextState = () => {
        // TODO: Remove the `|| []` hack when PR is finally merged to msal/browser
        setAccounts(instance.getAllAccounts() || []);
    };

    React.useEffect(() => {
        instance.addEventCallback((message: BroadcastMessage) => {
            const eventTypes = [
                BroadcastEvent.LOGIN_SUCCESS,
                BroadcastEvent.ACQUIRE_TOKEN_SUCCESS,
                BroadcastEvent.HANDLE_REDIRECT_SUCCESS,
                BroadcastEvent.SSO_SILENT_SUCCESS,
                BroadcastEvent.LOGOUT_SUCCESS
            ];
    
            if (eventTypes.indexOf(message.type) > -1) {
                updateContextState();
            }
        });
    }, [instance]);

    // Memoized context value
    const contextValue: IMsalContext = {
        instance,
        state: {
            accounts
        }
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
};

export const useMsal = () => useContext(MsalContext);
