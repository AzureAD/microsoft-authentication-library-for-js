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
                    <p>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</p>
                </AuthenticatedComponent>
            )}
        </MsalConsumer>
    )
}