import React from "react";

import { withMsal, IPublicClientApplication } from "../msal-react";

type HigherOrderComponentPropType = {
    children?: React.ReactNode,
    msal?: IPublicClientApplication
}

function HigherOrderComponent(props: HigherOrderComponentPropType) {
    return (
        <div>
            <h2>Higher-Order Component</h2>
            <p>This page demonstrates the usage of a Higher Order Component</p>
            <h3>{props.msal?.getAccount() && ("Welcome, " + props.msal?.getAccount().name)}</h3>
        </div>
    );
}

export const HigherOrderComponentPage = withMsal()(HigherOrderComponent);
