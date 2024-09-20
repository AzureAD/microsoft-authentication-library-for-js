/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, {
    useEffect,
    useReducer,
    PropsWithChildren,
    useMemo,
} from "react";
import {
    IPublicClientApplication,
    EventMessage,
    EventMessageUtils,
    InteractionStatus,
    Logger,
    WrapperSKU,
    AccountInfo,
} from "@azure/msal-browser";
import { MsalContext, IMsalContext } from "./MsalContext.js";
import { accountArraysAreEqual } from "./utils/utilities.js";
import { name as SKU, version } from "./packageMetadata.js";

export type MsalProviderProps = PropsWithChildren<{
    instance: IPublicClientApplication;
}>;

type MsalState = {
    inProgress: InteractionStatus;
    accounts: AccountInfo[];
};

const MsalProviderActionType = {
    UNBLOCK_INPROGRESS: "UNBLOCK_INPROGRESS",
    EVENT: "EVENT",
} as const;
type MsalProviderActionType =
    (typeof MsalProviderActionType)[keyof typeof MsalProviderActionType];

type MsalProviderReducerAction = {
    type: MsalProviderActionType;
    payload: {
        logger: Logger;
        instance: IPublicClientApplication;
        message?: EventMessage;
    };
};

/**
 * Returns the next inProgress and accounts state based on event message
 * @param previousState
 * @param action
 */
const reducer = (
    previousState: MsalState,
    action: MsalProviderReducerAction
): MsalState => {
    const { type, payload } = action;
    let newInProgress = previousState.inProgress;

    switch (type) {
        case MsalProviderActionType.UNBLOCK_INPROGRESS:
            if (previousState.inProgress === InteractionStatus.Startup) {
                newInProgress = InteractionStatus.None;
                payload.logger.info(
                    "MsalProvider - handleRedirectPromise resolved, setting inProgress to 'none'"
                );
            }
            break;
        case MsalProviderActionType.EVENT:
            const message = payload.message as EventMessage;
            const status = EventMessageUtils.getInteractionStatusFromEvent(
                message,
                previousState.inProgress
            );
            if (status) {
                payload.logger.info(
                    `MsalProvider - ${message.eventType} results in setting inProgress from ${previousState.inProgress} to ${status}`
                );
                newInProgress = status;
            }
            break;
        default:
            throw new Error(`Unknown action type: ${type}`);
    }

    const currentAccounts = payload.instance.getAllAccounts();
    if (
        newInProgress !== previousState.inProgress &&
        !accountArraysAreEqual(currentAccounts, previousState.accounts)
    ) {
        // Both inProgress and accounts changed
        return {
            ...previousState,
            inProgress: newInProgress,
            accounts: currentAccounts,
        };
    } else if (newInProgress !== previousState.inProgress) {
        // Only only inProgress changed
        return {
            ...previousState,
            inProgress: newInProgress,
        };
    } else if (
        !accountArraysAreEqual(currentAccounts, previousState.accounts)
    ) {
        // Only accounts changed
        return {
            ...previousState,
            accounts: currentAccounts,
        };
    } else {
        // Nothing changed
        return previousState;
    }
};

/**
 * MSAL context provider component. This must be rendered above any other components that use MSAL.
 */
export function MsalProvider({
    instance,
    children,
}: MsalProviderProps): React.ReactElement {
    useEffect(() => {
        instance.initializeWrapperLibrary(WrapperSKU.React, version);
    }, [instance]);
    // Create a logger instance for msal-react with the same options as PublicClientApplication
    const logger = useMemo(() => {
        return instance.getLogger().clone(SKU, version);
    }, [instance]);

    const [state, updateState] = useReducer(reducer, undefined, () => {
        // Lazy initialization of the initial state
        return {
            inProgress: InteractionStatus.Startup,
            accounts: instance.getAllAccounts(),
        };
    });

    useEffect(() => {
        const callbackId = instance.addEventCallback(
            (message: EventMessage) => {
                updateState({
                    payload: {
                        instance,
                        logger,
                        message,
                    },
                    type: MsalProviderActionType.EVENT,
                });
            }
        );
        logger.verbose(
            `MsalProvider - Registered event callback with id: ${callbackId}`
        );

        instance
            .initialize()
            .then(() => {
                instance
                    .handleRedirectPromise()
                    .catch(() => {
                        // Errors should be handled by listening to the LOGIN_FAILURE event
                        return;
                    })
                    .finally(() => {
                        /*
                         * If handleRedirectPromise returns a cached promise the necessary events may not be fired
                         * This is a fallback to prevent inProgress from getting stuck in 'startup'
                         */
                        updateState({
                            payload: {
                                instance,
                                logger,
                            },
                            type: MsalProviderActionType.UNBLOCK_INPROGRESS,
                        });
                    });
            })
            .catch(() => {
                // Errors should be handled by listening to the LOGIN_FAILURE event
                return;
            });

        return () => {
            // Remove callback when component unmounts or accounts change
            if (callbackId) {
                logger.verbose(
                    `MsalProvider - Removing event callback ${callbackId}`
                );
                instance.removeEventCallback(callbackId);
            }
        };
    }, [instance, logger]);

    const contextValue: IMsalContext = {
        instance,
        inProgress: state.inProgress,
        accounts: state.accounts,
        logger,
    };

    return (
        <MsalContext.Provider value={contextValue}>
            {children}
        </MsalContext.Provider>
    );
}
