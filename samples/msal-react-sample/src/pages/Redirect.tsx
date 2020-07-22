import React from 'react'
import { useHandleRedirect, useMsal, UnauthenticatedTemplate, AuthenticatedTemplate } from '../msal-react';

export const RedirectPage: React.FunctionComponent = () => {
    const redirectResult = useHandleRedirect();
    const msal = useMsal();

    const onLoginClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        msal.loginRedirect({
            scopes: [
                "user.read"
            ]
        });
    }

    return (
        <React.Fragment>
            <h2>Redirect</h2>
            <p>This page demonstrates using redirect flows.</p>

            <UnauthenticatedTemplate>
                <button onClick={onLoginClick}>Call loginRedirect</button>
            </UnauthenticatedTemplate>

            <AuthenticatedTemplate>
                <button onClick={msal.logout}>Call acquireTokenRedirect</button>
            </AuthenticatedTemplate>

            
            {msal.account?.name && <h3>Welcome, {msal.account.name}</h3>}
            
            {redirectResult ? (
                <React.Fragment>
                    <p>Redirect response:</p>
                    <pre>{JSON.stringify(redirectResult, null, 4)}</pre>
                </React.Fragment>
            ) : (
                <p>This page is not returning from a redirect operation.</p>
            )}
        </React.Fragment>
    );
}
