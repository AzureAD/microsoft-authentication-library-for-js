/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType, AuthenticationResult, AuthError } from "@azure/msal-browser";
import { useIsAuthenticated } from "./useIsAuthenticated";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { useMsal } from "./useMsal";
import { InteractionStatus } from "../utils/Constants";

export type MsalAuthenticationResult = {
    login: Function; 
    result: AuthenticationResult|null;
    error: AuthError|null;
};

export function useMsalAuthentication(
    interactionType: InteractionType, 
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest, 
    accountIdentifier?: AccountIdentifiers
): MsalAuthenticationResult {
    const isMounted = useRef(true);
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    const { instance, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifier);
    const [[result, error], setResponse] = useState<[AuthenticationResult|null, AuthError|null]>([null, null]);
    const [hasBeenCalled, setHasBeenCalled] = useState<boolean>(false);

    const login = useCallback(async (loginType: InteractionType, request?: PopupRequest|RedirectRequest|SsoSilentRequest): Promise<AuthenticationResult|null> => {
        switch (loginType) {
            case InteractionType.Popup:
                return instance.loginPopup(request as PopupRequest);
            case InteractionType.Redirect:
                // This promise is not expected to resolve due to full frame redirect
                return instance.loginRedirect(request as RedirectRequest).then(null);
            case InteractionType.Silent:
                return instance.ssoSilent(request as SsoSilentRequest);
            default:
                throw "Invalid interaction type provided.";
        }
    }, [instance, authenticationRequest, interactionType]);

    useEffect(() => {
        if (!hasBeenCalled && !isAuthenticated && inProgress === InteractionStatus.None) {
            // Ensure login is only called one time from within this hook, any subsequent login attempts should use the callback returned
            setHasBeenCalled(true);
            login(interactionType, authenticationRequest)
                .then(result => {
                    isMounted.current && setResponse([result, null]);
                })
                .catch(error => {
                    isMounted.current && setResponse([null, error]);
                });
        }

    }, [isAuthenticated, inProgress, hasBeenCalled]);

    return { login, result, error };
}
