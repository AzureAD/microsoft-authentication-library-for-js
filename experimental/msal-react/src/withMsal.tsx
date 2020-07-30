import React from 'react';

import { IMsalContext } from './MsalContext';
import { useMsal } from './MsalProvider';

export interface IWithMsalProps {
    msalContext: IMsalContext;
}

export const withMsal = <P extends IWithMsalProps = IWithMsalProps>(
    Component: React.ComponentType<P>
) => {
    const ComponentWithMsal: React.FunctionComponent<P> = props => {
        const msal = useMsal();
        return <Component {...props} msalContext={msal} />;
    };

    const componentName =
        Component.displayName || Component.name || 'Component';
    ComponentWithMsal.displayName = `withMsal(${componentName})`;

    return ComponentWithMsal;
};
