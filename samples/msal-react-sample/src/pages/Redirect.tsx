import React from 'react'
import { useHandleRedirect, MsalConsumer, AuthenticatedComponent } from '../msal-react';

export function RedirectPage() {
    const [ redirectResult ] = useHandleRedirect();

    return (
        <MsalConsumer>
            {msal => (
                <AuthenticatedComponent
                    unauthenticatedComponent={(
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.loginRedirect({
                                    scopes: [
                                        "user.read"
                                    ]
                                });
                            }}
                        >
                            Call Login Redirect
                        </button>
                    )}
                >
                    <h2>Redirect</h2>
                    <p>This page demonstrates a redirect login flow</p>
                    <h3>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h3>
                </AuthenticatedComponent>
            )}
        </MsalConsumer>
    )
}
