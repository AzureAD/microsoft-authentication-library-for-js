/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren } from "react";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { getChildrenOrFunction } from "../utilities";
import { useMsal } from "../hooks/useMsal";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";

export type AuthenticatedTemplateProps = PropsWithChildren<AccountIdentifiers>;

/**
 * Renders child components if user is authenticated
 * @param props 
 */
export function AuthenticatedTemplate({ username, homeAccountId, children }: AuthenticatedTemplateProps) {
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
}
