/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState, useEffect, PropsWithChildren, useMemo } from "react";
import {
    IPublicClientApplication,
    EventType,
    EventMessage, 
    InteractionType,
    Logger,
    WrapperSKU
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";
import { InteractionStatus } from "./utils/Constants";
import { accountArraysAreEqual } from "./utils/utilities";
import { AccountIdentifiers } from "./types/AccountIdentifiers";
import { name as SKU, version } from "./version.json";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

export function MsalProvider({instance, children}: MsalProviderProps): React.ReactElement {
    useEffect(() => {
        instance.initializeWrapperLibrary(WrapperSKU.React, Constants.VERSION);
    }, [instance]);
    // Create a logger instance for msal-react with the same options as PublicClientApplication
    const logger: Logger = useMemo(() => {
        return instance.getLogger().clone(SKU, version);
    }, [instance]);

    // State hook to store accounts
    const [accounts, setAccounts] = useState<AccountIdentifiers[]>([]);
    // State hook to store in progress value
    const [inProgress, setInProgress] = useState<InteractionStatus>(InteractionStatus.Startup);

    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch (message.eventType) {
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    const currentAccounts = instance.getAllAccounts();
                    if (!accountArraysAreEqual(currentAccounts, accounts)) {
                        logger.info("MsalProvider - updating account state");
                        setAccounts(currentAccounts);
                    } else {
                        logger.info("MsalProvider - no account changes");
                    }
                    break;
            }
        });
        logger.verbose(`MsalProvider - Registered event callback with id: ${callbackId}`);

        return () => {
            // Remove callback when component unmounts or accounts change
            if (callbackId) {
                logger.verbose(`MsalProvider - Removing event callback ${callbackId}`);
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, accounts, logger]);

    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch (message.eventType) {
                case EventType.LOGIN_START:
                    logger.info("MsalProvider - Login called, setting inProgress to 'login'");
                    setInProgress(InteractionStatus.Login);
                    break;
                case EventType.SSO_SILENT_START:
                    logger.info("MsalProvider - SsoSilent called, setting inProgress to 'ssoSilent'");
                    setInProgress(InteractionStatus.SsoSilent);
                    break;
                case EventType.ACQUIRE_TOKEN_START:
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        logger.info("MsalProvider - Interactive acquireToken called, setting inProgress to 'acquireToken'");
                        setInProgress(InteractionStatus.AcquireToken);
                    }
                    break;
                case EventType.HANDLE_REDIRECT_START:
                    logger.info("MsalProvider - HandleRedirectPromise called, setting inProgress to 'handleRedirect'");
                    setInProgress(InteractionStatus.HandleRedirect);
                    break;
                case EventType.LOGOUT_START:
                    logger.info("MsalProvider - Logout called, setting inProgress to 'logout'");
                    setInProgress(InteractionStatus.Logout);
                    break;
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                    logger.info("MsalProvider - Interactive request finished, setting inProgress to 'none'");
                    setInProgress(InteractionStatus.None);
                    break;
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        logger.info("MsalProvider - Interactive acquireToken request finished, setting inProgress to 'none'");
                        setInProgress(InteractionStatus.None);
                    }
                    break;
            }
        });
        logger.verbose(`MsalProvider - Registered event callback with id: ${callbackId}`);

        instance.handleRedirectPromise().catch(() => {
            // Errors should be handled by listening to the LOGIN_FAILURE event
            return;
        });

        return () => {
            if (callbackId) {
                logger.verbose(`MsalProvider - Removing event callback ${callbackId}`);
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, logger]);

    const contextValue: IMsalContext = {
        instance,
        inProgress,
        accounts,
        logger
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}

