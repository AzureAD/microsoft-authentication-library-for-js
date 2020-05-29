import React from 'react';
import { MsalConsumer, AuthenticatedComponent } from "./msal-react";

export function Home() {
    return (
        <MsalConsumer>
            {msal => (
                <div>
                    <AuthenticatedComponent
                        
                        onError={error => (
                            <p>{error.errorMessage}</p>
                        )}
                        forceLogin={false}
                        authenticationParameters={{
                            scopes: [ "user.read" ]
                        }}
                    >
                        <div>
                            <p>Account:</p>
                            <pre>{JSON.stringify(msal?.getAccount(), null, 4)}</pre>
                        </div>
                    </AuthenticatedComponent>
                </div>
            )}
        </MsalConsumer>
    )}
