import React from 'react';

import { useMsal } from './MsalProvider';
import { getChildrenOrFunction } from './utilities';
import { useIsAuthenticated } from './useIsAuthenticated';

export interface IMsalTemplateProps {
    username?: string;
}

export const UnauthenticatedTemplate: React.FunctionComponent<IMsalTemplateProps> = props => {
    const { children, username } = props;
    const context = useMsal();
    const isAuthenticated = useIsAuthenticated(username);

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
    const { children, username } = props;
    const context = useMsal();
    const isAuthenticated = useIsAuthenticated(username);

    if (isAuthenticated) {
        return (
            <React.Fragment>
                {getChildrenOrFunction(children, context)}
            </React.Fragment>
        );
    }
    return null;
};
