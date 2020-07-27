import { AuthorizationUrlRequest, RedirectRequest } from "@azure/msal-browser";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';

import { IMsalProps } from "./MsalContext";
import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";

export enum AuthenticationType {
    REDIRECT,
    POPUP
}

export type MsalAuthenticationProps = {
    request: AuthorizationUrlRequest | RedirectRequest,
    type?: AuthenticationType
    forceLogin?: boolean,
}

type MsalAuthenticationResult = {
    error: Error | null,
    msal: IMsalProps
}

export function useMsalAuthentication(args: MsalAuthenticationProps): MsalAuthenticationResult {
    const { request, forceLogin = false, type = AuthenticationType.POPUP } = args;
    const msal = useMsal();

    const [ error, setError ] = useState<Error | null>(null);

    const loginInteractively = useCallback(
        async (type: AuthenticationType): Promise<void> => {
            if (type === AuthenticationType.POPUP) {
                msal.loginPopup(request)
                .catch((error) => {
                    // TODO: This is error prone because it asynchronously sets state, but the component may be unmounted before the process completes.
                    //  Additionally, other authentication components or hooks won't have access to the errors.
                    //  May be better to lift this state into the the MsalProvider
                    setError(error);
                });
            } else {
                msal.loginRedirect(request);
            }
        }
    , [msal, request]);

    useEffect(() => {
        if (msal.isAuthenticated) {
            // TODO: Figure out why ssoSilent fails with "iframe_closed_prematurely" error
            // context?.ssoSilent({loginHint: account!.userName})
            //     .catch((error) => {
            //         if (forceLogin) {
            //             console.log(error)
            //             loginInteractively();
            //         } else {
            //             console.log(error)
            //             setError(error);
            //         }
            //     });

            // TODO: What if there is an error? How do errors get cleared?
            // TODO: What if user cancels the flow?
        } else if (forceLogin) {
            loginInteractively(type);
        } 
    }, [msal.isAuthenticated, loginInteractively, forceLogin, type]);

    return useMemo(() => ({
        error,
        msal
    }), [msal.isAuthenticated, error, msal]);
}

export const MsalAuthentication: React.FunctionComponent<MsalAuthenticationProps> = (props) => {
    const { request, type, forceLogin, children } = props;
    const { msal } = useMsalAuthentication({ request, forceLogin, type });

    return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
}

MsalAuthentication.defaultProps = {
    forceLogin: false,
    type: AuthenticationType.POPUP
} as MsalAuthenticationProps;
