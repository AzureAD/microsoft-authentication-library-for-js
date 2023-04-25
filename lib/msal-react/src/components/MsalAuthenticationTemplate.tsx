/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren, useMemo } from "react";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { getChildrenOrFunction } from "../utils/utilities";
import { useMsal } from "../hooks/useMsal";
import {
    MsalAuthenticationResult,
    useMsalAuthentication,
} from "../hooks/useMsalAuthentication";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import {
    InteractionType,
    PopupRequest,
    RedirectRequest,
    SsoSilentRequest,
    InteractionStatus,
} from "@azure/msal-browser";
import { IMsalContext } from "../MsalContext";

export type MsalAuthenticationProps = PropsWithChildren<
    AccountIdentifiers & {
        interactionType: InteractionType;
        authenticationRequest?:
            | PopupRequest
            | RedirectRequest
            | SsoSilentRequest;
        loadingComponent?: React.ElementType<IMsalContext>;
        errorComponent?: React.ElementType<MsalAuthenticationResult>;
    }
>;

/**
 * Attempts to authenticate user if not already authenticated, then renders child components
 * @param props
 */
export function MsalAuthenticationTemplate({
    interactionType,
    username,
    homeAccountId,
    localAccountId,
    authenticationRequest,
    loadingComponent: LoadingComponent,
    errorComponent: ErrorComponent,
    children,
}: MsalAuthenticationProps): React.ReactElement | null {
    const accountIdentifier: AccountIdentifiers = useMemo(() => {
        return {
            username,
            homeAccountId,
            localAccountId,
        };
    }, [username, homeAccountId, localAccountId]);
    const context = useMsal();
    const msalAuthResult = useMsalAuthentication(
        interactionType,
        authenticationRequest,
        accountIdentifier
    );
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (msalAuthResult.error && context.inProgress === InteractionStatus.None) {
        if (!!ErrorComponent) {
            return <ErrorComponent {...msalAuthResult} />;
        }

        throw msalAuthResult.error;
    }

    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, msalAuthResult)}
            </React.Fragment>
        );
    }

    if (!!LoadingComponent && context.inProgress !== InteractionStatus.None) {
        return <LoadingComponent {...context} />;
    }

    return null;
}
