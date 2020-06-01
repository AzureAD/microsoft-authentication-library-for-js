import React from "react";

import { withMsal, IPublicClientApplication } from "../msal-react";

type HigherOrderComponentPropType = {
    children?: React.ReactNode,
    msal?: IPublicClientApplication
}

function HigherOrderComponent(props: HigherOrderComponentPropType) {
    return (
        <div>
             <h2>{props.msal?.getAccount() && ("Welcome, " + props.msal?.getAccount().name)}</h2>
        </div>
    );
}

export const HigherOrderComponentPage = withMsal()(HigherOrderComponent);
