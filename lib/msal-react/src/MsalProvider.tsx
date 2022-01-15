/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { useEffect, useReducer, PropsWithChildren, useMemo} from "react";
import {
    IPublicClientApplication,
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

type MsalState = {
    inProgress: InteractionStatus;
    accounts: AccountInfo[];
};

enum MsalProviderActionType {
    UNBLOCK_INPROGRESS = "UNBLOCK_INPROGRESS",
    EVENT = "EVENT"
}

type MsalProviderReducerPayload = {
    logger: Logger;
    instance: IPublicClientApplication;
    message?: EventMessage;
};

type MsalProviderReducerAction = {
    type: MsalProviderActionType,
    payload: MsalProviderReducerPayload;
};

const reducer = (previousState: MsalState, action: MsalProviderReducerAction) => {
    const { type, payload } = action;
    let newAccounts = previousState.accounts;
    let newInProgress = previousState.inProgress;

    switch (type) {
        case MsalProviderActionType.UNBLOCK_INPROGRESS:
            if (previousState.inProgress === InteractionStatus.Startup){
                newInProgress = InteractionStatus.None;
                payload.logger.info("MsalProvider - handleRedirectPromise resolved, setting inProgress to 'none'");
            }
            break;
        case MsalProviderActionType.EVENT:
            const message = payload.message as EventMessage;
            const status = EventMessageUtils.getInteractionStatusFromEvent(message, previousState.inProgress);
            if (status) {
                payload.logger.info(`MsalProvider - ${message.eventType} results in setting inProgress from ${previousState.inProgress} to ${status}`);
                newInProgress = status;
            }
            break;
        default:
            throw new Error(`Unknown action type: ${type}`);
    }

    const currentAccounts = payload.instance.getAllAccounts();
    if (!accountArraysAreEqual(currentAccounts, previousState.accounts)) {
        payload.logger.info("MsalProvider - updating account state");
        newAccounts = currentAccounts;
    } else {
        payload.logger.verbose("MsalProvider - no account changes");
    }

    return {
        ...previousState,
        inProgress: newInProgress,
        accounts: newAccounts
    };
};

const MsalProviderStateInitializer = (instance: IPublicClientApplication): MsalState => {
    return {
        inProgress: InteractionStatus.Startup,
        accounts: instance.getAllAccounts()
    };
};

export function MsalProvider({instance, children}: MsalProviderProps): React.ReactElement {
    useEffect(() => {
        instance.initializeWrapperLibrary(WrapperSKU.React, version);
    }, [instance]);
    // Create a logger instance for msal-react with the same options as PublicClientApplication
    const logger = useMemo(() => {
        return instance.getLogger().clone(SKU, version);
    }, [instance]);

    const [state, dispatch] = useReducer(reducer, instance, MsalProviderStateInitializer);
    
    useEffect(() => {
        const callbackId = instance.addEventCallback((message: EventMessage) => {
            dispatch({
                payload: {
                    instance,
                    logger,
                    message
                }, 
                type: MsalProviderActionType.EVENT
            });
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
            dispatch({
                payload: {
                    instance,
                    logger
                },
                type: MsalProviderActionType.UNBLOCK_INPROGRESS 
            });
        });

        return () => {
            // Remove callback when component unmounts or accounts change
            if (callbackId) {
                logger.verbose(`MsalProvider - Removing event callback ${callbackId}`);
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, logger]);

    const contextValue: IMsalContext = {
        instance,
        inProgress: state.inProgress,
        accounts: state.accounts,
        logger
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}

