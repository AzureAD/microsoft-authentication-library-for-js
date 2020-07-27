import React, { useCallback } from 'react'
import { useHandleRedirect, useMsal, UnauthenticatedTemplate, AuthenticatedTemplate } from '../msal-react';

export const RedirectPage: React.FunctionComponent = () => {
    const { accounts, loginRedirect, acquireTokenRedirect } = useMsal();

    // TODO: This calling the handleRedirectPromise() multiple times will throw a state mismatch error
    const redirectResult = useHandleRedirect();

    const request = {
        scopes: ["user.read"]
    }

    const onLoginClick = useCallback(() => {
        loginRedirect(request);
    }, [loginRedirect]);
    
    const onAcquireTokenClick = useCallback(() => {
        acquireTokenRedirect(request);
    }, [acquireTokenRedirect]);

    return (
        <React.Fragment>
            <h2>Redirect</h2>
            <p>This page demonstrates using redirect flows.</p>

            <UnauthenticatedTemplate>
                <button onClick={onLoginClick}>Call loginRedirect</button>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <button onClick={onAcquireTokenClick}>Call acquireTokenRedirect</button>

                {accounts[0]?.username && (<h3>Welcome, {accounts[0].username}</h3>)}
            
                {redirectResult ? (
                    <React.Fragment>
                        <p>Redirect response:</p>
                        <pre>{JSON.stringify(redirectResult, null, 4)}</pre>
                    </React.Fragment>
                ) : (
                    <p>This page is not returning from a redirect operation.</p>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    );
}
