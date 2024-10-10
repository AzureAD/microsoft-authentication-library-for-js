/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, { PropsWithChildren, useMemo } from "react";
import { AccountIdentifiers } from "../types/AccountIdentifiers.js";
import { getChildrenOrFunction } from "../utils/utilities.js";
import { useMsal } from "../hooks/useMsal.js";
import { useIsAuthenticated } from "../hooks/useIsAuthenticated.js";
import { InteractionStatus } from "@azure/msal-browser";

export type AuthenticatedTemplateProps = PropsWithChildren<AccountIdentifiers>;

/**
 * Renders child components if user is authenticated
 * @param props
 */
export function AuthenticatedTemplate({
    username,
    homeAccountId,
    localAccountId,
    children,
}: AuthenticatedTemplateProps): React.ReactElement | null {
    const context = useMsal();
    const accountIdentifier: AccountIdentifiers = useMemo(() => {
        return {
            username,
            homeAccountId,
            localAccountId,
        };
    }, [username, homeAccountId, localAccountId]);
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    if (isAuthenticated && context.inProgress !== InteractionStatus.Startup) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
}
