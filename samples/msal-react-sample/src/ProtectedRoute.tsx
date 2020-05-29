import React from 'react';
import { MsalConsumer, AuthenticatedComponent } from "./msal-react";

export function ProtectedRoute() {
    return (
        <AuthenticatedComponent
            onError={error => (
                <p>{error.errorMessage}</p>
            )}
            forceLogin={true}
        >
            <MsalConsumer>
                {msal => (                                           
                    <p>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</p>
                )}
            </MsalConsumer>
        </AuthenticatedComponent>
    )
}
