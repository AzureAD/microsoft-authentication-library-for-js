import React, {  useState, useCallback } from 'react';
import { MsalProvider, useMsal, AuthenticatedTemplate } from '../src';

import { msalInstance } from './msalInstance';

export default {
    title: 'MSAL React/Acquire Tokens',
};

// By passing optional props to this story, you can control the props of the component when
// you consume the story in a test.
export const AcquireTokenSilent = () => {
    return (
        <MsalProvider instance={msalInstance}>
            <GetTokenButton />
        </MsalProvider>
    )
};


const GetTokenButton: React.FunctionComponent = () => {
    const [ accessToken, setAccessToken ] = useState<string | undefined>(undefined);
    const { instance, state } = useMsal();

    // TODO: This works for an example, but async methods that set state in a component is an anti-pattern.
    //  If the component unmounts before the token is acquired, then React will throw errors since state
    //  is being set on a component that isn't mounted
    const getTokenClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        if (instance.getAllAccounts()[0]) {
            const tokenResponse = await instance.acquireTokenSilent({
                account: instance.getAllAccounts()[0],
                scopes: ["user.read"]
            });

            if (tokenResponse) {
                setAccessToken(tokenResponse.accessToken);
            }
        }
    }, [instance]);

    return (
        <AuthenticatedTemplate>
            <button onClick={getTokenClick}>Fetch Access Token</button>
            {accessToken && (
                <React.Fragment>
                    <h3>Access token:</h3>
                    <pre>{JSON.stringify(accessToken, null, 4)}</pre>
                </React.Fragment>
            )}
        </AuthenticatedTemplate>
    );
}