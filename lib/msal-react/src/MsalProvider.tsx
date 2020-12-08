/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState, useEffect, PropsWithChildren, useMemo } from "react";
import {
    IPublicClientApplication,
    AccountInfo,
    EventType,
    EventMessage, InteractionType
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";
import { Constants, InteractionStatus } from "./utils/Constants";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

export function MsalProvider({instance, children}: MsalProviderProps): React.ReactElement {
    // Create a logger instance for msal-react with the same options as PublicClientApplication
    const logger = useMemo(() => {
        return instance.getLogger().clone(Constants.SKU, Constants.VERSION);
    }, [instance]);

    // State hook to store accounts
    const [accounts, setAccounts] = useState<AccountInfo[]>([]);
    // State hook to store in progress value
    const [inProgress, setInProgress] = useState<InteractionStatus>(InteractionStatus.Startup);

    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch (message.eventType) {
                case EventType.LOGIN_START:
                    logger.verbose("MsalProvider - Login called, setting inProgress to 'login'");
                    setInProgress(InteractionStatus.Login);
                    break;
                case EventType.SSO_SILENT_START:
                    logger.verbose("MsalProvider - SsoSilent called, setting inProgress to 'ssoSilent'");
                    setInProgress(InteractionStatus.SsoSilent);
                    break;
                case EventType.ACQUIRE_TOKEN_START:
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        logger.verbose("MsalProvider - Interactive acquireToken called, setting inProgress to 'acquireToken'");
                        setInProgress(InteractionStatus.AcquireToken);
                    }
                    break;
                case EventType.HANDLE_REDIRECT_START:
                    logger.verbose("MsalProvider - HandleRedirectPromise called, setting inProgress to 'handleRedirect'");
                    setInProgress(InteractionStatus.HandleRedirect);
                    break;
                case EventType.LOGOUT_START:
                    logger.verbose("MsalProvider - Logout called, setting inProgress to 'logout'");
                    setInProgress(InteractionStatus.Logout);
                    break;
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                    logger.verbose("MsalProvider - Interactive request finished, setting inProgress to 'none' and updating accounts");
                    setAccounts(instance.getAllAccounts());
                    setInProgress(InteractionStatus.None);
                    break;
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    logger.verbose("MsalProvider - acquireToken request finished, updating accounts");
                    setAccounts(instance.getAllAccounts());
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        logger.verbose("MsalProvider - Interactive acquireToken request finished, setting inProgress to 'none'");
                        setInProgress(InteractionStatus.None);
                    }
                    break;
            }
        });
        logger.verbose(`MsalProvider - Registered event callback: ${callbackId}`);

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
    }, [instance]);

    // Memoized context value
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

