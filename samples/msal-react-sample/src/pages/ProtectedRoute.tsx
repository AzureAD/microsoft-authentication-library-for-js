import React from 'react';
import { MsalAuthentication, AuthenticatedTemplate, UnauthenticatedTemplate, IMsalProps } from "../msal-react";

export const ProtectedRoutePage: React.FunctionComponent = () => (
    <MsalAuthentication request={{ scopes: ['user.read'] }} forceLogin={true}>
        <h2>Protected Route</h2>
        <UnauthenticatedTemplate>
            <p>Please login before viewing this page.</p>
        </UnauthenticatedTemplate>
        <AuthenticatedTemplate>
            {({ accounts }: IMsalProps) => (
                <React.Fragment>
                    <p>This page demonstrates a protected route, automatically triggering a login if user has not been authenticated</p>
                    {accounts[0]?.username && (<h3>Welcome, {accounts[0].username}</h3>)}
                </React.Fragment>
            )}
        </AuthenticatedTemplate>
    </MsalAuthentication>
);