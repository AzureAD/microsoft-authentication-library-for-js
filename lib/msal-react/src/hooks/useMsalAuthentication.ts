/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useCallback, useEffect, useState } from "react";
import { PopupRequest, RedirectRequest, SsoSilentRequest, InteractionType, AuthenticationResult, AuthError, EventMessage, EventType, InteractionStatus } from "@azure/msal-browser";
import { useIsAuthenticated } from "./useIsAuthenticated";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { useMsal } from "./useMsal";

export type MsalAuthenticationResult = {
    login: Function; 
    result: AuthenticationResult|null;
    error: AuthError|null;
};

/**
 * Invokes a login call if a user is not currently signed-in. Failed logins can be retried using the login callback returned.
 * Optionally provide a request object to be used in the login call.
 * Optionally provide a specific user that should be logged in.
 * @param interactionType 
 * @param authenticationRequest 
 * @param accountIdentifiers 
 */
export function useMsalAuthentication(
    interactionType: InteractionType, 
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest, 
    accountIdentifiers?: AccountIdentifiers
): MsalAuthenticationResult {
    const { instance, inProgress, logger } = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifiers);
    const [[result, error], setResponse] = useState<[AuthenticationResult|null, AuthError|null]>([null, null]);
    const [hasBeenCalled, setHasBeenCalled] = useState<boolean>(false);

    const login = useCallback(async (callbackInteractionType?: InteractionType, callbackRequest?: PopupRequest|RedirectRequest|SsoSilentRequest): Promise<AuthenticationResult|null> => {
        const loginType = callbackInteractionType || interactionType;
        const loginRequest = callbackRequest || authenticationRequest;
        switch (loginType) {
            case InteractionType.Popup:
                logger.verbose("useMsalAuthentication - Calling loginPopup");
                return instance.loginPopup(loginRequest as PopupRequest);
            case InteractionType.Redirect:
                // This promise is not expected to resolve due to full frame redirect
                logger.verbose("useMsalAuthentication - Calling loginRedirect");
                return instance.loginRedirect(loginRequest as RedirectRequest).then(null);
            case InteractionType.Silent:
                logger.verbose("useMsalAuthentication - Calling ssoSilent");
                return instance.ssoSilent(loginRequest as SsoSilentRequest);
            default:
                throw "Invalid interaction type provided.";
        }
    }, [instance, interactionType, authenticationRequest, logger]);

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
        logger.verbose(`useMsalAuthentication - Registered event callback with id: ${callbackId}`);

        return () => {
            if (callbackId) {
                logger.verbose(`useMsalAuthentication - Removing event callback ${callbackId}`);
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, logger]);

    useEffect(() => {
        if (!hasBeenCalled && !error && !isAuthenticated && inProgress === InteractionStatus.None) {
            logger.info("useMsalAuthentication - No user is authenticated, attempting to login");
            // Ensure login is only called one time from within this hook, any subsequent login attempts should use the callback returned
            setHasBeenCalled(true);
            login().catch(() => {
                // Errors are handled by the event handler above
                return;
            });
        }
    }, [isAuthenticated, inProgress, error, hasBeenCalled, login, logger]);

    return { login, result, error };
}
