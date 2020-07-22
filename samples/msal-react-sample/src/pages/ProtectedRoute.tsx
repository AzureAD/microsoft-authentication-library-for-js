import React from 'react';
import { MsalAuthentication, AuthenticatedTemplate, UnauthenticatedTemplate, IMsalProps } from "../msal-react";

export const ProtectedRoutePage: React.FunctionComponent = () => (
    <MsalAuthentication forceLogin={true}>
        <h2>Protected Route</h2>
        <React.Fragment>
            <UnauthenticatedTemplate>
                <p>Please login before viewing this page.</p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                {({ account }: IMsalProps) => (
                    <React.Fragment>
                        <p>This page demonstrates a protected route, automatically triggering a login if user has not been authenticated</p>
                        {account?.name && <h3>Welcome, {account.name}</h3>}
                    </React.Fragment>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    </MsalAuthentication>
);