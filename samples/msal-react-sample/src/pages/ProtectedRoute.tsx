import React from 'react';
import { MsalConsumer, AuthenticatedComponent } from "../msal-react";

export function ProtectedRoutePage() {
    return (
        <AuthenticatedComponent
            onError={error => (
                <p>{error.errorMessage}</p>
            )}
            forceLogin={true}
            unauthenticatedComponent={
                <p>Please login before viewing this page.</p>
            }
        >
            <MsalConsumer>
                {msal => (                                           
                    <h2>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h2>
                )}
            </MsalConsumer>
        </AuthenticatedComponent>
    )
}
