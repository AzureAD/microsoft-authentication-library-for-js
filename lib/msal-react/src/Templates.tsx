import React from "react";

import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";
import { useIsAuthenticated } from "./useIsAuthenticated";
import { AccountInfo } from "@azure/msal-browser";

export interface IMsalTemplateProps {
    account?: Partial<AccountInfo>
}

export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, account } = props;
    const context = useMsal();
    const isAuthenticated = useIsAuthenticated(account);

    if (!isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
};

export const AuthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, account } = props;
    const context = useMsal();
    const isAuthenticated = useIsAuthenticated(account);

    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
};
