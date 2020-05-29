import React from 'react'
import { useHandleRedirect, MsalConsumer, AuthenticatedComponent } from './msal-react';

export function Redirect() {
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
                    <h2>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h2>
                </AuthenticatedComponent>
            )}
        </MsalConsumer>
    )
}