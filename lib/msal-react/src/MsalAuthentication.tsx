import React, { useCallback, useEffect } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType } from "@azure/msal-browser";

import { IMsalContext } from "./MsalContext";
import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";

export interface IMsalAuthenticationProps {
    interactionType: string;
    username?: string;
    homeAccountId?: string;
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest
}

type MsalAuthenticationResult = {
    msal: IMsalContext;
};

export function useMsalAuthentication(msalProps: IMsalAuthenticationProps): MsalAuthenticationResult {
    const { interactionType, username, homeAccountId, authenticationRequest } = msalProps;
    const msal = useMsal();
    const accountIdentifier: AccountIdentifiers = {
        username,
        homeAccountId
    };
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    const login = useCallback(() => {
        switch (interactionType) {
            case InteractionType.POPUP:
                return msal.instance.loginPopup(authenticationRequest as PopupRequest);
            case InteractionType.REDIRECT:
                return msal.instance.loginRedirect(authenticationRequest as RedirectRequest);
            case InteractionType.SILENT:
                return msal.instance.ssoSilent(authenticationRequest as SsoSilentRequest);
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

    return { msal };
}

export const MsalAuthentication: React.FunctionComponent<IMsalAuthenticationProps> = ({ 
    interactionType, 
    username, 
    homeAccountId, 
    authenticationRequest, 
    children 
}) => {
    const { msal } = useMsalAuthentication({ interactionType, username, homeAccountId, authenticationRequest });
    const accountIdentifier: AccountIdentifiers = {
        username,
        homeAccountId
    };
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

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
