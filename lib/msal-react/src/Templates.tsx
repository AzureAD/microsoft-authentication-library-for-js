/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";

import { useMsal } from "./MsalProvider";
import { useMsalAuthentication } from "./useMsalAuthentication";
import { getChildrenOrFunction } from "./utilities";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";
import { InteractionType, PopupRequest, RedirectRequest, SsoSilentRequest } from "@azure/msal-browser";

export interface IMsalTemplateProps {
    username?: string,
    homeAccountId?: string
}

/**
 * Renders child components if user is unauthenticated
 * @param props 
 */
export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, username, homeAccountId } = props;
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
export const AuthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, username, homeAccountId } = props;
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
    authenticationRequest?: PopupRequest|RedirectRequest|SsoSilentRequest
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
}) => {
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
