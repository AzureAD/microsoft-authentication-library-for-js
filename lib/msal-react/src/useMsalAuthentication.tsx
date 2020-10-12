import { useCallback, useEffect } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType } from "@azure/msal-browser";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";
import { useMsal } from "./MsalProvider";
import { IMsalContext } from "./MsalContext";

type MsalAuthenticationResult = {
    msal: IMsalContext;
};

export function useMsalAuthentication(
    interactionType: InteractionType, 
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest, 
    accountIdentifier?: AccountIdentifiers
): MsalAuthenticationResult {
    const msal = useMsal();
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
