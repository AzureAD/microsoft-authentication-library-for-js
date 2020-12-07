/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useCallback, useEffect, useState } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType, AuthenticationResult, AuthError, EventMessage, EventType } from "@azure/msal-browser";
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
    accountIdentifiers?: AccountIdentifiers
): MsalAuthenticationResult {
    const { instance, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifiers);
    const [[result, error], setResponse] = useState<[AuthenticationResult|null, AuthError|null]>([null, null]);
    const [hasBeenCalled, setHasBeenCalled] = useState<boolean>(false);

    const login = useCallback(async (callbackInteractionType?: InteractionType, callbackRequest?: PopupRequest|RedirectRequest|SsoSilentRequest): Promise<AuthenticationResult|null> => {
        const loginType = callbackInteractionType || interactionType;
        const loginRequest = callbackRequest || authenticationRequest;
        switch (loginType) {
            case InteractionType.Popup:
                return instance.loginPopup(loginRequest as PopupRequest);
            case InteractionType.Redirect:
                // This promise is not expected to resolve due to full frame redirect
                return instance.loginRedirect(loginRequest as RedirectRequest).then(null);
            case InteractionType.Silent:
                return instance.ssoSilent(loginRequest as SsoSilentRequest);
            default:
                throw "Invalid interaction type provided.";
        }
    }, [instance, interactionType, authenticationRequest]);

    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch(message.eventType) {
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                    if (message.payload) {
                        setResponse([message.payload as AuthenticationResult, null]);
                    }
                    break;
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                    if (message.error) {
                        setResponse([null, message.error as AuthError]);
                    }
                    break;
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance]);

    useEffect(() => {
        if (!hasBeenCalled && !isAuthenticated && inProgress === InteractionStatus.None) {
            // Ensure login is only called one time from within this hook, any subsequent login attempts should use the callback returned
            setHasBeenCalled(true);
            login().catch(() => {
                // Errors are handled by the event handler above
                return;
            });
        }
    }, [isAuthenticated, inProgress, hasBeenCalled, login]);

    return { login, result, error };
}
