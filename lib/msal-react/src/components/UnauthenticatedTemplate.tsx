/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren, useMemo } from "react";
import { useMsal } from "../hooks/useMsal";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated";
import { getChildrenOrFunction } from "../utils/utilities";
import { AccountIdentifiers } from "../types/AccountIdentifiers";
import { InteractionStatus } from "@azure/msal-browser";

export type UnauthenticatedTemplateProps = PropsWithChildren<AccountIdentifiers>;

/**
 * Renders child components if user is unauthenticated
 * @param props 
 */
export function UnauthenticatedTemplate({ username, homeAccountId, localAccountId, children }: UnauthenticatedTemplateProps): React.ReactElement|null {
    const context = useMsal();
    const accountIdentifier: AccountIdentifiers = useMemo(() => {
        return {
            username,
            homeAccountId,
            localAccountId
        };
    }, [username, homeAccountId, localAccountId]);
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (!isAuthenticated && context.inProgress !== InteractionStatus.Startup && context.inProgress !== InteractionStatus.HandleRedirect) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
}
