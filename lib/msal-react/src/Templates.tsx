/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { ReactNode } from "react";

import { useMsal } from "./MsalProvider";
import { useMsalAuthentication } from "./useMsalAuthentication";
import { getChildrenOrFunction } from "./utilities";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";
import { InteractionType, PopupRequest, RedirectRequest, SsoSilentRequest } from "@azure/msal-browser";

export interface IMsalTemplateProps {
    username?: string,
    homeAccountId?: string
    children?: ReactNode
}

/**
 * Renders child components if user is unauthenticated
 * @param props 
 */
export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = ({ username, homeAccountId, children }: IMsalTemplateProps) => {
    const context = useMsal();
    const accountIdentifier: AccountIdentifiers = {
        username,
        homeAccountId
    };
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (!isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
};

/**
 * Renders child components if user is authenticated
 * @param props 
 */
export const AuthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = ({ username, homeAccountId, children }: IMsalTemplateProps) => {
    const context = useMsal();
    const accountIdentifier: AccountIdentifiers = {
        username,
        homeAccountId
    };
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
};

export interface IMsalAuthenticationProps {
    interactionType: InteractionType;
    username?: string;
    homeAccountId?: string;
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest;
    children?: ReactNode
}

/**
 * Attempts to authenticate user if not already authenticated, then renders child components
 * @param param0 
 */
export const MsalAuthenticationTemplate: React.FunctionComponent<IMsalAuthenticationProps> = ({ 
    interactionType, 
    username, 
    homeAccountId, 
    authenticationRequest, 
    children 
}: IMsalAuthenticationProps) => {
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
};
