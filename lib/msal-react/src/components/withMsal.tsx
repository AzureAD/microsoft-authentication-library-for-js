/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from "react";
import { IMsalContext } from "../MsalContext";
import { useMsal } from "../hooks/useMsal";
import { Subtract } from "../utilities";

export type WithMsalProps = {
    msalContext: IMsalContext;
};

export const withMsal = <P extends WithMsalProps>(Component: React.ComponentType<P>) => {
    const ComponentWithMsal: React.FunctionComponent<Subtract<P,WithMsalProps>> = props => {
        const msal = useMsal();
        return <Component {...(props as P)} msalContext={msal} />;
    };

    const componentName =
        Component.displayName || Component.name || "Component";
    ComponentWithMsal.displayName = `withMsal(${componentName})`;

    return ComponentWithMsal;
};
