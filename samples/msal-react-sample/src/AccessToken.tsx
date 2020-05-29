import React from 'react';
import { MsalConsumer, AuthenticatedComponent, UnauthenticatedComponent } from "./msal-react";

export function GetAccessToken() {
    return (
        <AuthenticatedComponent
            onError={error => (
                <p>{error.errorMessage}</p>
            )}
            forceLogin={false}
            unauthenticatedComponent={(
                <p>You must be logged in to acquire an access token</p>
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
