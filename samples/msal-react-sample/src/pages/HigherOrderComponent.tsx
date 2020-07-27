import React from "react";

import { withMsal, IMsalProps, UnauthenticatedTemplate } from "../msal-react";

const HigherOrderComponent: React.FunctionComponent<IMsalProps> = (props) => (
    <React.Fragment>
        <h2>Higher-Order Component</h2>
        <p>This page demonstrates the usage of a Higher Order Component</p>
        <UnauthenticatedTemplate>
            <p>You are not authenticated.</p>
        </UnauthenticatedTemplate>
        {props.accounts[0]?.username && (<h3>Welcome, {props.accounts[0].username}</h3>)}
    </React.Fragment>
);

export const HigherOrderComponentPage = withMsal(HigherOrderComponent);
