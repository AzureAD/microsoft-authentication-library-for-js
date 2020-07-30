import React from 'react';

import { IMsalContext } from './MsalContext';
import { useMsal } from './MsalProvider';

// Utility types
// Reference: https://github.com/piotrwitek/utility-types
type SetDifference<A, B> = A extends B ? never : A;
type SetComplement<A, A1 extends A> = SetDifference<A, A1>;
type Subtract<T extends T1, T1 extends object> = Pick<
    T,
    SetComplement<keyof T, keyof T1>
>;

export interface IWithMsalProps {
    msalContext: IMsalContext;
}

export const withMsal = <P extends IWithMsalProps>(
    Component: React.ComponentType<P>
) => {
    const ComponentWithMsal: React.FunctionComponent<Subtract<
        P,
        IWithMsalProps
    >> = props => {
        const msal = useMsal();
        return <Component {...(props as P)} msalContext={msal} />;
    };

    const componentName =
        Component.displayName || Component.name || 'Component';
    ComponentWithMsal.displayName = `withMsal(${componentName})`;

    return ComponentWithMsal;
};
