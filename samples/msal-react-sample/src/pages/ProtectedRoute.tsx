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
                    <div>
                        <h2>Protected Route</h2>
                        <p>This page demonstrates a protected route, automatically triggering a login if user has not been authenticated</p>
                        <h3>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h3>
                    </div>                                           
                )}
            </MsalConsumer>
        </AuthenticatedComponent>
    )
}
