import React from 'react';
import { MsalProvider, MsalConsumer } from '../src';

import { msalInstance } from './msalInstance';

export default {
    title: 'MSAL React/Login & Logout',
};

export const LoginPopup = () => {
    return (
        <MsalProvider instance={msalInstance}>
            <MsalConsumer>
                {msalContext => (
                    <div>
                        {msalContext.state.accounts.length ? (
                            <div>
                                <p>
                                    Account: {msalContext.state.accounts[0].username}
                                </p>
                                <button
                                    onClick={() => {
                                        msalContext.instance.logout();
                                    }}
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div>
                                <button 
                                    onClick={() => {
                                        msalContext.instance.loginPopup({
                                            scopes: []
                                        });
                                    }}
                                >
                                    Login
                                </button>
                            </div>
                        )}

                    </div>
                )}
            </MsalConsumer>
        </MsalProvider>
    )
};
