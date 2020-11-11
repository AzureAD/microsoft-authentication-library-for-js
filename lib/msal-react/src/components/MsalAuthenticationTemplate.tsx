/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren, useMemo } from "react";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { getChildrenOrFunction } from "../utils/utilities";
import { useMsal } from "../hooks/useMsal";
import { useMsalAuthentication } from "../hooks/useMsalAuthentication";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import { InteractionType, PopupRequest, RedirectRequest, SsoSilentRequest } from "@azure/msal-browser";
import { InteractionStatus } from "../utils/Constants";

export type MsalAuthenticationProps = PropsWithChildren<AccountIdentifiers & {
    interactionType: InteractionType;
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
}>;

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
    loadingComponent,
    errorComponent,
    children 
}: MsalAuthenticationProps): React.ReactElement|null {
    const accountIdentifier: AccountIdentifiers = useMemo(() => {
        return {
            username,
            homeAccountId,
            localAccountId
        };
    }, [username, homeAccountId, localAccountId]);
    const context = useMsal();
    const msalAuthResult = useMsalAuthentication(interactionType, authenticationRequest, accountIdentifier);
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (msalAuthResult.error) {
        if (!!errorComponent) {
            return (
                <React.Fragment>
                    {getChildrenOrFunction(errorComponent, msalAuthResult)}
                </React.Fragment>
            );
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
    
    if (!!loadingComponent || context.inProgress !== InteractionStatus.None) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(loadingComponent, context)}
            </React.Fragment>
        );
    }

    return null;
}
