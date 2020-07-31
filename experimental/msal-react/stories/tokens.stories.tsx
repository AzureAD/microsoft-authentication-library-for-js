import React, {  useState, useCallback } from 'react';
import { MsalProvider, useMsal, AuthenticatedTemplate, UnauthenticatedTemplate } from '../src';

import { msalInstance } from './msalInstance';
import { AccountInfo } from '@azure/msal-browser';

export default {
    title: 'MSAL React/Acquire Tokens',
};

export const AcquireTokenSilent = () => (
    <MsalProvider instance={msalInstance}>
        <UnauthenticatedTemplate>
            <p>You must be logged in to fetch a token.</p>
        </UnauthenticatedTemplate>
        <AcquireTokenSilentExample />
    </MsalProvider>
);

export const AcquireTokenPopup = () => (
    <MsalProvider instance={msalInstance}>
        <UnauthenticatedTemplate>
            <p>You must be logged in to fetch a token.</p>
        </UnauthenticatedTemplate>
        <AcquireTokenPopupExample />
    </MsalProvider>
);

const AcquireTokenSilentExample = () => {
    const { instance, state } = useMsal();

    const getTokenClick = useCallback(async (setter: React.Dispatch<React.SetStateAction<string>>, account: AccountInfo) => {
        const tokenResponse = await instance.acquireTokenSilent({
            account,
            scopes: ['user.read']
        });

        if (tokenResponse) {
            setter(tokenResponse.accessToken);
        }
    }, [instance]);

    return (
        <GetTokenButtonList onFetch={getTokenClick} accounts={state.accounts} />
    )
};

const AcquireTokenPopupExample = () => {
    const { instance, state } = useMsal();

    const getTokenClick = useCallback(async (setter: React.Dispatch<React.SetStateAction<string>>) => {
        const tokenResponse = await instance.acquireTokenPopup({
            scopes: []
        });

        if (tokenResponse) {
            setter(tokenResponse.accessToken);
        }
    }, [instance]);

    return (
        <GetTokenButtonList onFetch={getTokenClick} accounts={state.accounts} />
    )
};

interface IGetTokenButtonList {
    onFetch: (setter: React.Dispatch<React.SetStateAction<string>>, account: AccountInfo) => void;
    accounts: AccountInfo[];
}

const GetTokenButtonList: React.FunctionComponent<IGetTokenButtonList> = ({ onFetch, accounts }) => {
    const [ accessToken, setAccessToken ] = useState<string | undefined>(undefined);

    return (
        <React.Fragment>
            {accounts.map((account) => (
                <div key={account.homeAccountId} style={{marginBottom: 20}}>
                    <span>{account.username}</span>
                    <button onClick={() => onFetch(setAccessToken, account)} style={{marginLeft: 20}}>Fetch Token</button>
                    <div><pre>{JSON.stringify(accessToken, null, 4)}</pre></div>
                </div>
            ))}            
        </React.Fragment>
    );
}