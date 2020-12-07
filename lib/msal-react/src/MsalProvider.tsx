/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState, useEffect, PropsWithChildren } from "react";
import {
    IPublicClientApplication,
    EventType,
    EventMessage, InteractionType
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";
import { InteractionStatus } from "./utils/Constants";
import { accountArraysAreEqual } from "./utils/utilities";
import { AccountIdentifiers } from "./types/AccountIdentifiers";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

export function MsalProvider({instance, children}: MsalProviderProps): React.ReactElement {
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
                        setAccounts(currentAccounts);
                    }
                    break;
            }
        });

        return () => {
            // Remove callback when component unmounts or accounts change
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, accounts]);

    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            switch (message.eventType) {
                case EventType.LOGIN_START:
                    setInProgress(InteractionStatus.Login);
                    break;
                case EventType.SSO_SILENT_START:
                    setInProgress(InteractionStatus.SsoSilent);
                    break;
                case EventType.ACQUIRE_TOKEN_START:
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        setInProgress(InteractionStatus.AcquireToken);
                    }
                    break;
                case EventType.HANDLE_REDIRECT_START:
                    setInProgress(InteractionStatus.HandleRedirect);
                    break;
                case EventType.LOGOUT_START:
                    setInProgress(InteractionStatus.Logout);
                    break;
                case EventType.LOGIN_SUCCESS:
                case EventType.SSO_SILENT_SUCCESS:
                case EventType.HANDLE_REDIRECT_END:
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                    setInProgress(InteractionStatus.None);
                    break;
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        setInProgress(InteractionStatus.None);
                    }
                    break;
            }
        });

        instance.handleRedirectPromise().catch(() => {
            // Errors should be handled by listening to the LOGIN_FAILURE event
            return;
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance]);

    const contextValue: IMsalContext = {
        instance,
        inProgress,
        accounts
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}

