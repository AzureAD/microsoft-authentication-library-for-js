/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren } from "react";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { getChildrenOrFunction } from "../utilities";
import { useMsal } from "../hooks/useMsal";
import { useMsalAuthentication } from "../hooks/useMsalAuthentication";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import { InteractionType, PopupRequest, RedirectRequest, SsoSilentRequest } from "@azure/msal-browser";

export type MsalAuthenticationProps = PropsWithChildren<AccountIdentifiers & {
    interactionType: InteractionType;
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest;
}>;

/**
 * Attempts to authenticate user if not already authenticated, then renders child components
 * @param props
 */
export function MsalAuthenticationTemplate({ 
    interactionType, 
    username, 
    homeAccountId, 
    authenticationRequest, 
    children 
}: MsalAuthenticationProps) {
    const accountIdentifier: AccountIdentifiers = {
        username,
        homeAccountId
    };
    const context = useMsal();
    const { error } = useMsalAuthentication(interactionType, authenticationRequest, accountIdentifier);
    if (error) {
        throw error;
    }
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    // TODO: What if the user authentiction is InProgress? How will user show a loading state?
    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }

    return null;
}
