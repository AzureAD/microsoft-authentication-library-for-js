import React from "react";

import { useMsal } from "./MsalProvider";
import { getChildrenOrFunction } from "./utilities";
import { AccountIdentifiers, useIsAuthenticated } from "./useIsAuthenticated";

export interface IMsalTemplateProps {
    accountIdentifier?: AccountIdentifiers
}

export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, accountIdentifier } = props;
    const context = useMsal();
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

export const AuthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, accountIdentifier } = props;
    const context = useMsal();
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
