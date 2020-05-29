import React from 'react';
import { MsalConsumer, AuthenticatedComponent, UnauthenticatedComponent } from "./msal-react";

export function UnauthenticatedComponentPage() {
    return (
        <div>
            <AuthenticatedComponent
                onError={error => (
                    <p>{error.errorMessage}</p>
                )}
            >
                <MsalConsumer>
                    {msal => (                                           
                        <h2>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h2>
                    )}
                </MsalConsumer>
            </AuthenticatedComponent>

            <UnauthenticatedComponent>
                <h2>Please use the login button above.</h2>        
            </UnauthenticatedComponent>
        </div>
    )
}