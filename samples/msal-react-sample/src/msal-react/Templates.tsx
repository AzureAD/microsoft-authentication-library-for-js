import React from "react";

import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";


export const UnauthenticatedTemplate: React.FunctionComponent = ({ children }) => {
    const msal = useMsal()

    if (!msal.isAuthenticated) {
        return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
    }
    return null;
}

export const AuthenticatedTemplate: React.FunctionComponent = ({ children }) => {
    const msal = useMsal()

    if (msal.isAuthenticated) {
        return <React.Fragment>{getChildrenOrFunction(children, msal)}</React.Fragment>;
    }
    return null;
}