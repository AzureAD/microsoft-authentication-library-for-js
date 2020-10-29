/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useState, useEffect, PropsWithChildren } from "react";
import {
    IPublicClientApplication,
    AccountInfo,
    EventType,
    EventMessage, InteractionType
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext";
import { InteractionStatus } from "./utils/Constants";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

export function MsalProvider({instance, children}: MsalProviderProps) {
    // State hook to store accounts
    const [accounts, setAccounts] = useState<AccountInfo[]>(instance.getAllAccounts());
    // State hook to store in progress value
    const [inProgress, setInProgress] = useState<InteractionStatus>(InteractionStatus.Startup);

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
                case EventType.LOGIN_FAILURE:
                case EventType.SSO_SILENT_FAILURE:
                case EventType.LOGOUT_FAILURE:
                    setAccounts(instance.getAllAccounts());
                    setInProgress(InteractionStatus.None);
                    break;
                case EventType.ACQUIRE_TOKEN_SUCCESS:
                case EventType.ACQUIRE_TOKEN_FAILURE:
                    setAccounts(instance.getAllAccounts());
                    if (message.interactionType === InteractionType.Redirect || message.interactionType === InteractionType.Popup) {
                        setInProgress(InteractionStatus.None);
                    }
                    break;
            }
        });

        instance.handleRedirectPromise();

        return () => {
            callbackId && instance.removeEventCallback(callbackId);
        };
    }, [instance]);

    // Memoized context value
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

