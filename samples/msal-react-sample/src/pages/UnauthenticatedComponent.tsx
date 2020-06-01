import React from 'react';
import { MsalConsumer, AuthenticatedComponent, UnauthenticatedComponent } from "../msal-react";

export function UnauthenticatedComponentPage() {
    return (
        <div>
            <h2>Unauthenticated Component</h2>
            <p>This page demonstrates the usage of individual Authenticated and Unauthenticated components</p>

            <AuthenticatedComponent
                onError={error => (
                    <p>{error.errorMessage}</p>
                )}
            >
                <MsalConsumer>
                    {msal => (                                           
                        <h3>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h3>
                    )}
                </MsalConsumer>
            </AuthenticatedComponent>

            <UnauthenticatedComponent>
                <h3>Please use the login button above.</h3>        
            </UnauthenticatedComponent>
        </div>
    )
}
