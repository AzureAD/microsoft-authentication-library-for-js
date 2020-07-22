import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "../msal-react";

export const UnauthenticatedComponentPage: React.FunctionComponent = () => (
    <React.Fragment>
        <h2>Unauthenticated Component</h2>
        <p>This page demonstrates the usage of individual Authenticated and Unauthenticated components</p>

        <AuthenticatedTemplate>
            <p>You are currently logged in. Logout to see unauthenticated content.</p>
        </AuthenticatedTemplate>

        <UnauthenticatedTemplate>
            <h3>Please use the login button above.</h3>        
        </UnauthenticatedTemplate>
    </React.Fragment>
)
