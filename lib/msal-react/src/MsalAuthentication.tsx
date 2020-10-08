import React, { useState, useCallback, useEffect, useMemo } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType } from "@azure/msal-browser";

import { IMsalContext } from "./MsalContext";
import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";
import { useIsAuthenticated } from "./useIsAuthenticated";

export interface IMsalAuthenticationProps {
    username?: string;
    interactionType?: string;
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest
}

type MsalAuthenticationResult = {
    error: Error | null;
    msal: IMsalContext;
};

export function useMsalAuthentication(args: IMsalAuthenticationProps = {}): MsalAuthenticationResult {
    const { username, interactionType = InteractionType.POPUP, authenticationRequest } = args;
    const msal = useMsal();
    const isAuthenticated = useIsAuthenticated(username);

    const [error, setError] = useState<Error | null>(null);

    // TODO: How are we passing errors down?
    const login = useCallback(() => {
        /*
         * TODO: This is error prone because it asynchronously sets state, but the component may be unmounted before the process completes.
         *  Additionally, other authentication components or hooks won't have access to the errors.
         *  May be better to lift this state into the the MsalProvider
         */
        switch (interactionType) {
            case InteractionType.POPUP:
                return msal.instance.loginPopup(authenticationRequest as PopupRequest).catch(error => {
                    setError(error);
                });
            case InteractionType.REDIRECT:
                return msal.instance.loginRedirect(authenticationRequest as RedirectRequest).catch(error => {
                    setError(error);
                });
            case InteractionType.SILENT:
                return msal.instance.ssoSilent(authenticationRequest as SsoSilentRequest).catch(error => {
                    setError(error);
                }); 
            default:
                return null;
        }
    }, [msal, authenticationRequest, interactionType]);

    useEffect(() => {
        /*
         * TODO: What if there is an error? How do errors get cleared?
         * TODO: What if user cancels the flow?
         * TODO: Check whether login is already in progress
         */
        if (!isAuthenticated) {
            login();
        }
    }, [isAuthenticated]);

    return useMemo(
        () => ({
            error,
            msal,
        }),
        [error, msal]
    );
}

export const MsalAuthentication: React.FunctionComponent<IMsalAuthenticationProps> = props => {
    const { username, interactionType, authenticationRequest, children } = props;
    const { msal } = useMsalAuthentication({ username, interactionType, authenticationRequest });
    const isAuthenticated = useIsAuthenticated(username);

    // TODO: What if the user authentiction is InProgress? How will user show a loading state?
    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, msal)}
            </React.Fragment>
        );
    }

    return null;
};
