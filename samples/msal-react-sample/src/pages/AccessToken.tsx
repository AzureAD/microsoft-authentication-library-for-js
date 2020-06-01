import React, { useState } from 'react';
import { MsalConsumer, AuthenticatedComponent } from "../msal-react";

export function GetAccessTokenPage() {
    const [ accessToken, setAccessToken ] = useState<string | undefined>("");

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
                                    setAccessToken(tokenResponse?.accessToken);
                                }}
                            >
                                Fetch Access Token
                            </button>
                            <h3>Access token:</h3>
                            <pre style={{
                                wordBreak: "break-all",
                                whiteSpace: "normal"
                            }}>{accessToken && JSON.stringify(accessToken, null, 4)}</pre>
                        </div>
                    )}
                </MsalConsumer>
            </AuthenticatedComponent>
        </div>
    )
}
