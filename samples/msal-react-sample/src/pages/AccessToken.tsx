import React from 'react';
import { MsalConsumer, AuthenticatedComponent } from "../msal-react";

export function GetAccessTokenPage() {
    return (
        <div>
            <h2>Access Token</h2>
            <p>This page demonstrates acquiring an access token with unauthenticatedComponent integrated into AuthenticatedComponent</p>

            <AuthenticatedComponent
                onError={error => (
                    <p>{error.errorMessage}</p>
                )}
                forceLogin={false}
                unauthenticatedComponent={(
                    <h3>You must be logged in to acquire an access token</h3>
                )}
            >
                <MsalConsumer>
                    {msal => (                                             
                        <div>
                            <button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    const tokenResponse = await msal?.acquireTokenSilent({
                                        scopes: [ "user.read" ]
                                    });
                                    console.log(tokenResponse);
                                }}
                            >
                                Fetch Access Token
                            </button>
                        </div>
                    )}
                </MsalConsumer>
            </AuthenticatedComponent>
        </div>
    )
}
