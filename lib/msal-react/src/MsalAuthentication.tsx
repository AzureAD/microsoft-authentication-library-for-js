import { AuthenticationResult } from "@azure/msal-browser";
import React, { useState, useCallback, useEffect, useMemo } from "react";

import { IMsalContext } from "./MsalContext";
import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction, defaultLoginHandler } from "./utilities";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";

export interface IMsalAuthenticationProps {
    accountIdentifier?: AccountIdentifiers
    loginHandler?: (context: IMsalContext) => Promise<AuthenticationResult>;
}

type MsalAuthenticationResult = {
    error: Error | null;
    msal: IMsalContext;
};

// TODO: Add optional argument for the `request` object?
export function useMsalAuthentication(args: IMsalAuthenticationProps = {}): MsalAuthenticationResult {
    const { accountIdentifier, loginHandler = defaultLoginHandler } = args;
    const msal = useMsal();
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    const [error, setError] = useState<Error | null>(null);

    // TODO: How are we passing errors down?
    const login = useCallback(() => {
        /*
         * TODO: This is error prone because it asynchronously sets state, but the component may be unmounted before the process completes.
         *  Additionally, other authentication components or hooks won't have access to the errors.
         *  May be better to lift this state into the the MsalProvider
         */
        return loginHandler(msal).catch(error => {
            setError(error);
        });
    }, [msal, loginHandler]);

    useEffect(() => {
        /*
         * TODO: What if there is an error? How do errors get cleared?
         * TODO: What if user cancels the flow?
         */
        if (!isAuthenticated) {
            login();
        }
        /*
         * TODO: the `login` function needs to be added to the deps array.
         *  Howevever, when it's added it will cause a double login issue because we're not
         *  currently tracking when an existing login is InProgress
         */
    }, [isAuthenticated]);

    return useMemo(
        () => ({
            error,
            msal,
        }),
        [error, msal]
    );
}

export const MsalAuthentication: React.FunctionComponent<IMsalAuthenticationProps> = props => {
    const { accountIdentifier, loginHandler, children } = props;
    const { msal } = useMsalAuthentication({ accountIdentifier, loginHandler });
    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    // TODO: What if the user authentiction is InProgress? How will user show a loading state?
    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, msal)}
            </React.Fragment>
        );
    }

    return null;
};
