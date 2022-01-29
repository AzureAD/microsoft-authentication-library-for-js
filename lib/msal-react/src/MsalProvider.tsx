/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState, useEffect, useRef, PropsWithChildren, useMemo } from "react";
import {
    IPublicClientApplication,
    EventType,
    EventMessage,
    EventMessageUtils,
    InteractionStatus,
    Logger,
    WrapperSKU,
    AccountInfo
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";
import { accountArraysAreEqual } from "./utils/utilities";
import { name as SKU, version } from "./packageMetadata";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

export function MsalProvider({instance, children}: MsalProviderProps): React.ReactElement {
    useEffect(() => {
        instance.initializeWrapperLibrary(WrapperSKU.React, version);
    }, [instance]);
    // Create a logger instance for msal-react with the same options as PublicClientApplication
    const logger: Logger = useMemo(() => {
        return instance.getLogger().clone(SKU, version);
    }, [instance]);

    // State hook to store accounts
    const [accounts, setAccounts] = useState<AccountInfo[]>(() => instance.getAllAccounts());
    // State hook to store in progress value
    const [inProgress, setInProgress] = useState<InteractionStatus>(InteractionStatus.Startup);
    // Mutable object used in the event callback
    const inProgressRef = useRef(inProgress);
    
    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch (message.eventType) {
                case EventType.ACCOUNT_ADDED:
                case EventType.ACCOUNT_REMOVED:
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_END:
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
            const status = EventMessageUtils.getInteractionStatusFromEvent(message, inProgressRef.current);
            if (status !== null) {
                logger.info(`MsalProvider - ${message.eventType} results in setting inProgress from ${inProgressRef.current} to ${status}`);
                inProgressRef.current = status;
                setInProgress(status);
            }
        });
        logger.verbose(`MsalProvider - Registered event callback with id: ${callbackId}`);

        instance.handleRedirectPromise().catch(() => {
            // Errors should be handled by listening to the LOGIN_FAILURE event
            return;
        }).finally(() => {
            /*
             * If handleRedirectPromise returns a cached promise the necessary events may not be fired
             * This is a fallback to prevent inProgress from getting stuck in 'startup'
             */
            if (inProgressRef.current === InteractionStatus.Startup) {
                inProgressRef.current = InteractionStatus.None;
                setInProgress(InteractionStatus.None);
            }
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

