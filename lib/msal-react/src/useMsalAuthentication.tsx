/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useCallback, useEffect, useState } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType, AuthenticationResult, AuthError } from "@azure/msal-browser";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";
import { useMsal } from "./MsalProvider";

type MsalAuthenticationResult = {
    login: Function; 
    result: AuthenticationResult|null|void;
    error: AuthError|null;
};

export function useMsalAuthentication(
    interactionType: InteractionType, 
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest, 
    accountIdentifier?: AccountIdentifiers
): MsalAuthenticationResult {
    const msal = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifier);
    const [result, setResult] = useState<AuthenticationResult|null>(null);
    const [error, setError] = useState<AuthError|null>(null);

    const login = useCallback((loginType: InteractionType, request?: PopupRequest|RedirectRequest|SsoSilentRequest): Promise<AuthenticationResult|null> => {
        switch (loginType) {
            case InteractionType.Popup:
                return msal.instance.loginPopup(request as PopupRequest);
            case InteractionType.Redirect:
                // This promise is not expected to resolve due to full frame redirect
                return msal.instance.loginRedirect(request as RedirectRequest).then(null);
            case InteractionType.Silent:
                return msal.instance.ssoSilent(request as SsoSilentRequest);
            default:
                throw "Invalid interaction type provided.";
        }
    }, [msal, authenticationRequest, interactionType]);

    useEffect(() => {
        /*
         * TODO: Check whether login is already in progress
         */
        if (!isAuthenticated) {
            login(interactionType, authenticationRequest)
                .then(result => setResult(result))
                .catch(error => setError(error));
        }
    }, [isAuthenticated]);

    return { login, result, error };
}
