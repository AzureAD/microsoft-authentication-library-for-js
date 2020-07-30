import React from 'react';

import { useMsal } from './MsalProvider';
import { getChildrenOrFunction, isAuthenticated } from './utilities';

export interface IMsalTemplateProps {
    username?: string;
}

export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, username } = props;
    const msal = useMsal();

    if (!isAuthenticated(msal.instance, username)) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, msal)}
            </React.Fragment>
        );
    }
    return null;
};

export const AuthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, username } = props;
    const msal = useMsal();

    if (isAuthenticated(msal.instance, username)) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, msal)}
            </React.Fragment>
        );
    }
    return null;
};
