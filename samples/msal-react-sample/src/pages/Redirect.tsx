import React from 'react'
import { useHandleRedirect, MsalConsumer, AuthenticatedComponent } from '../msal-react';

export function RedirectPage() {
    const [ redirectResult ] = useHandleRedirect();

    return (
        <MsalConsumer>
            {msal => (
                <div>
                    <h2>Redirect</h2>
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
                                Call loginRedirect
                            </button>
                        )}
                    >
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.acquireTokenRedirect({
                                    scopes: [
                                        "user.read"
                                    ]
                                });
                            }}
                        >
                            Call acquireTokenRedirect
                        </button>
                    </AuthenticatedComponent>
                    
                    <p>This page demonstrates using redirect flows.</p>
                    <h3>{msal?.getAccount() && ("Welcome, " + msal?.getAccount().name)}</h3>
                    {redirectResult ? (
                        <div>
                            <p>Redirect response:</p>
                            <pre>{JSON.stringify(redirectResult, null, 4)}</pre>
                        </div>
                    ) : (
                        <p>This page is not returning from a redirect operation.</p>
                    )}
                </div>
            )}
        </MsalConsumer>
    )
}
