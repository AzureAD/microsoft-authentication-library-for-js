/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { useCallback, useEffect, useState, useRef } from "react";
import {
    PopupRequest,
    RedirectRequest,
    SsoSilentRequest,
    InteractionType,
    AuthenticationResult,
    AuthError,
    InteractionStatus,
    SilentRequest,
    InteractionRequiredAuthError,
    OIDC_DEFAULT_SCOPES,
    BrowserUtils,
} from "@azure/msal-browser";
import { useIsAuthenticated } from "./useIsAuthenticated.js";
import { AccountIdentifiers } from "../types/AccountIdentifiers.js";
import { useMsal } from "./useMsal.js";
import { useAccount } from "./useAccount.js";
import { ReactAuthError } from "../error/ReactAuthError.js";

export type MsalAuthenticationResult = {
    login: (
        callbackInteractionType?: InteractionType | undefined,
        callbackRequest?: PopupRequest | RedirectRequest | SilentRequest
    ) => Promise<AuthenticationResult | null>;
    acquireToken: (
        callbackInteractionType?: InteractionType | undefined,
        callbackRequest?: SilentRequest | undefined
    ) => Promise<AuthenticationResult | null>;
    result: AuthenticationResult | null;
    error: AuthError | null;
};

/**
 * If a user is not currently signed in this hook invokes a login. Failed logins can be retried using the login callback returned.
 * If a user is currently signed in this hook attempts to acquire a token. Subsequent token requests can use the acquireToken callback returned.
 * Optionally provide a request object to be used in the login/acquireToken call.
 * Optionally provide a specific user that should be logged in.
 * @param interactionType
 * @param authenticationRequest
 * @param accountIdentifiers
 */
export function useMsalAuthentication(
    interactionType: InteractionType,
    authenticationRequest?: PopupRequest | RedirectRequest | SsoSilentRequest,
    accountIdentifiers?: AccountIdentifiers
): MsalAuthenticationResult {
    const { instance, inProgress, logger } = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifiers);
    const account = useAccount(accountIdentifiers);
    const [[result, error], setResponse] = useState<
        [AuthenticationResult | null, AuthError | null]
    >([null, null]);

    // Used to prevent state updates after unmount
    const mounted = useRef(true);
    useEffect(() => {
        return () => {
            mounted.current = false;
        };
    }, []);

    // Boolean used to check if interaction is in progress in acquireTokenSilent fallback. Use Ref instead of state to prevent acquireToken function from being regenerated on each change to interactionInProgress value
    const interactionInProgress = useRef(inProgress !== InteractionStatus.None);
    useEffect(() => {
        interactionInProgress.current = inProgress !== InteractionStatus.None;
    }, [inProgress]);

    // Flag used to control when the hook calls login/acquireToken
    const shouldAcquireToken = useRef(true);
    useEffect(() => {
        if (!!error) {
            // Errors should be handled by consuming component
            shouldAcquireToken.current = false;
            return;
        }

        if (!!result) {
            // Token has already been acquired, consuming component/application is responsible for renewing
            shouldAcquireToken.current = false;
            return;
        }
    }, [error, result]);

    const login = useCallback(
        async (
            callbackInteractionType?: InteractionType,
            callbackRequest?: PopupRequest | RedirectRequest | SsoSilentRequest
        ): Promise<AuthenticationResult | null> => {
            const loginType = callbackInteractionType || interactionType;
            const loginRequest = callbackRequest || authenticationRequest;

            const getToken = async (): Promise<AuthenticationResult | null> => {
                logger.verbose(
                    "useMsalAuthentication - Calling getToken",
                    callbackRequest?.correlationId || ""
                );

                switch (loginType) {
                    case InteractionType.Popup:
                        logger.verbose(
                            "useMsalAuthentication - Calling loginPopup",
                            callbackRequest?.correlationId || ""
                        );
                        return instance.loginPopup(
                            loginRequest as PopupRequest
                        );

                    case InteractionType.Redirect:
                        // This promise is not expected to resolve due to full frame redirect
                        logger.verbose(
                            "useMsalAuthentication - Calling loginRedirect",
                            callbackRequest?.correlationId || ""
                        );
                        await instance.handleRedirectPromise();
                        return instance
                            .loginRedirect(loginRequest as RedirectRequest)
                            .then(() => null);

                    case InteractionType.Silent:
                        logger.verbose(
                            "useMsalAuthentication - Calling ssoSilent",
                            callbackRequest?.correlationId || ""
                        );
                        return instance.ssoSilent(
                            loginRequest as SsoSilentRequest
                        );

                    default:
                        const invalidTypeError =
                            ReactAuthError.createInvalidInteractionTypeError();
                        if (mounted.current) {
                            setResponse([null, invalidTypeError]);
                        }
                        throw invalidTypeError;
                }
            };

            return getToken()
                .then((response: AuthenticationResult | null) => {
                    if (response && mounted.current) {
                        setResponse([response, null]);
                    }
                    return response;
                })
                .catch((e: AuthError) => {
                    if (mounted.current) {
                        setResponse([null, e]);
                    }
                    throw e;
                });
        },
        [instance, interactionType, authenticationRequest, logger]
    );

    const acquireToken = useCallback(
        async (
            callbackInteractionType?: InteractionType,
            callbackRequest?: SilentRequest
        ): Promise<AuthenticationResult | null> => {
            const fallbackInteractionType =
                callbackInteractionType || interactionType;

            let tokenRequest: SilentRequest;

            if (callbackRequest) {
                logger.trace(
                    "useMsalAuthentication - acquireToken - Using request provided in the callback",
                    callbackRequest.correlationId || ""
                );
                tokenRequest = {
                    ...callbackRequest,
                };
            } else if (authenticationRequest) {
                logger.trace(
                    "useMsalAuthentication - acquireToken - Using request provided in the hook",
                    authenticationRequest.correlationId || ""
                );
                tokenRequest = {
                    ...authenticationRequest,
                    scopes: authenticationRequest.scopes || OIDC_DEFAULT_SCOPES,
                };
            } else {
                logger.trace(
                    "useMsalAuthentication - acquireToken - No request object provided, using default request.",
                    ""
                );
                tokenRequest = {
                    scopes: OIDC_DEFAULT_SCOPES,
                };
            }

            const correlationId =
                tokenRequest.correlationId || BrowserUtils.createGuid();
            tokenRequest.correlationId = correlationId;

            if (!tokenRequest.account && account) {
                logger.trace(
                    "useMsalAuthentication - acquireToken - Attaching account to request",
                    correlationId
                );
                tokenRequest.account = account;
            }

            return instance
                .acquireTokenSilent(tokenRequest)
                .then((response: AuthenticationResult) => {
                    if (mounted.current) {
                        setResponse([response, null]);
                    }
                    return response;
                })
                .catch(async (e: AuthError) => {
                    if (e instanceof InteractionRequiredAuthError) {
                        if (!interactionInProgress.current) {
                            logger.error(
                                "useMsalAuthentication - Interaction required, falling back to interaction",
                                correlationId
                            );
                            return login(fallbackInteractionType, tokenRequest);
                        } else {
                            const fallbackError =
                                ReactAuthError.createUnableToFallbackToInteractionError();
                            logger.error(
                                "useMsalAuthentication - Interaction required but is already in progress. Please try again, if needed, after interaction completes.",
                                correlationId
                            );
                            if (mounted.current) {
                                setResponse([null, fallbackError]);
                            }
                            throw fallbackError;
                        }
                    }

                    // Handle other errors
                    if (mounted.current) {
                        setResponse([null, e]);
                    }
                    throw e;
                });
        },
        [
            instance,
            interactionType,
            authenticationRequest,
            logger,
            account,
            login,
        ]
    );

    useEffect(() => {
        if (
            shouldAcquireToken.current &&
            inProgress === InteractionStatus.None
        ) {
            if (!isAuthenticated) {
                shouldAcquireToken.current = false;
                logger.info(
                    "useMsalAuthentication - No user is authenticated, attempting to login",
                    ""
                );
                login().catch(() => {
                    // Errors are saved in state above
                    return;
                });
            } else if (account) {
                shouldAcquireToken.current = false;
                logger.info(
                    "useMsalAuthentication - User is authenticated, attempting to acquire token",
                    ""
                );
                acquireToken().catch(() => {
                    // Errors are saved in state above
                    return;
                });
            }
            // If logging out, set the state to null so the component doesn't display authenticated content for a user that is logged out
        } else if (!account && result) {
            setResponse([null, null]);
        }
    }, [isAuthenticated, account, inProgress, login, acquireToken, logger]);

    return {
        login,
        acquireToken,
        result,
        error,
    };
}
