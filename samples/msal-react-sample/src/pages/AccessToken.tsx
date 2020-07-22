import React, { useState } from 'react';
import { UnauthenticatedTemplate, AuthenticatedTemplate, useMsal } from "../msal-react";

export const GetAccessTokenPage: React.FunctionComponent = () => {
    const [ accessToken, setAccessToken ] = useState<string | undefined>(undefined);
    const msal = useMsal();

    // TODO: This works for an example, but async methods that set state in a component is an anti-pattern.
    //  If the component unmounts before the token is acquired, then React will throw errors since state
    //  is being set on a component that isn't mounted
    const getTokenClick = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        const tokenResponse = await msal.acquireTokenSilent({
            scopes: [ "user.read" ]
        });

        setAccessToken(tokenResponse?.accessToken);
    }

    // TODO: Show error?
    
    return (
        <React.Fragment>
            <h2>Access Token</h2>
            <p>This page demonstrates acquiring an access token with unauthenticatedComponent integrated into AuthenticatedComponent</p>

            <UnauthenticatedTemplate>
                <h3>You must be logged in to acquire an access token</h3>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <button onClick={getTokenClick}>Fetch Access Token</button>
                {accessToken && (
                    <React.Fragment>
                        <h3>Access token:</h3>
                        <pre>{JSON.stringify(accessToken, null, 4)}</pre>
                    </React.Fragment>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    )
}
