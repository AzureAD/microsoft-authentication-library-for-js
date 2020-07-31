import React from 'react';
import { MsalProvider, MsalConsumer, useMsal } from '../src';

import { msalInstance } from './msalInstance';

export default {
    title: 'MSAL React/Login & Logout',
};

export const LoginPopup = () => (
    <MsalProvider instance={msalInstance}>
        <PopupExample />
    </MsalProvider>
);

const PopupExample = () => {
    const { instance, state } = useMsal();
    const accounts = state.accounts;
    const isAuthenticated = accounts.length > 0;

    if (isAuthenticated) {
        return (
            <React.Fragment>
                <p>Accounts: {accounts.map(a => a.username).join(', ')}</p>
                <button onClick={() => instance.logout()}>Logout</button>
            </React.Fragment>
        );
    } else {
        return (
            <React.Fragment>
                <button onClick={() => instance.loginPopup({ scopes: [] })}>Login</button>
            </React.Fragment>
        );
    }
};
