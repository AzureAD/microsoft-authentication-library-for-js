/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React, {  useState, useCallback } from "react";
import { MsalProvider, useMsal, UnauthenticatedTemplate } from "../src";

import { msalInstance } from "./msalInstance";
import { AccountInfo } from "@azure/msal-browser";

export default {
    title: "MSAL React/Acquire Tokens",
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
    const { instance, accounts } = useMsal();

    const getTokenClick = useCallback(async (setter: React.Dispatch<React.SetStateAction<string>>, account: AccountInfo) => {
        const tokenResponse = await instance.acquireTokenSilent({
            account,
            scopes: ["user.read"]
        });

        if (tokenResponse) {
            setter(tokenResponse.accessToken);
        }
    }, [instance]);

    return (
        <React.Fragment>
            {accounts.map((account) => (
                <AccountTokenFetcher key={account.homeAccountId} onFetch={getTokenClick} account={account} />
            ))}
        </React.Fragment>
        
    );
};

const AcquireTokenPopupExample = () => {
    const { instance, accounts } = useMsal();

    const getTokenClick = useCallback(async (setter: React.Dispatch<React.SetStateAction<string>>, account: AccountInfo) => {
        const tokenResponse = await instance.acquireTokenPopup({
            scopes: ["user.read"],
            loginHint: account.username
        });

        if (tokenResponse) {
            setter(tokenResponse.accessToken);
        }
    }, [instance]);

    return (
        <React.Fragment>
            {accounts.map((account) => (
                <AccountTokenFetcher key={account.homeAccountId} onFetch={getTokenClick} account={account} />
            ))}
        </React.Fragment>
        
    );
};

interface IAccountTokenFetcherProps {
    onFetch: (setter: React.Dispatch<React.SetStateAction<string>>, account: AccountInfo) => void;
    account: AccountInfo;
}

const AccountTokenFetcher: React.FunctionComponent<IAccountTokenFetcherProps> = ({ onFetch, account }: IAccountTokenFetcherProps) => {
    const [ accessToken, setAccessToken ] = useState<string | undefined>(undefined);

    return (
        <div style={{marginBottom: 20}}>
            <span>{account.username}</span>
            <button onClick={() => onFetch(setAccessToken, account)} style={{marginLeft: 20}}>Fetch Token</button>
            <div><pre>{JSON.stringify(accessToken, null, 4)}</pre></div>
        </div>
    );
};
