import React from 'react';
import { MsalConsumer, AuthenticatedComponent } from "./msal-react";

export function GetAccessToken() {
    return (
        <AuthenticatedComponent
            onError={error => (
                <p>{error.errorMessage}</p>
            )}
            forceLogin={false}
            unauthenticatedComponent={(
                <h2>You must be logged in to acquire an access token</h2>
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
    )
}
