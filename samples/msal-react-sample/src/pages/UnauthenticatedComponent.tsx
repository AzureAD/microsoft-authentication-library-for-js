import React from 'react';
import { MsalConsumer, AuthenticatedComponent, UnauthenticatedComponent } from "../msal-react";

export function UnauthenticatedComponentPage() {
    return (
        <div>
            <h2>Unauthenticated Component</h2>
            <p>This page demonstrates the usage of individual Authenticated and Unauthenticated components</p>

            <AuthenticatedComponent>
                <p>You are currently logged in. Logout to see unauthenticated content.</p>
            </AuthenticatedComponent>

            <UnauthenticatedComponent>
                <h3>Please use the login button above.</h3>        
            </UnauthenticatedComponent>
        </div>
    )
}
