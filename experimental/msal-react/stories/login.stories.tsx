import React from 'react';
import { MsalProvider, MsalConsumer } from '../src';
import { PublicClientApplication } from '@azure/msal-browser';

export default {
  title: 'MSAL React/Login & Logout',
};

const msalInstance = new PublicClientApplication({
    auth: {
        clientId: "0a61c279-646b-4055-a5f1-1c3da7f70f18",
        redirectUri: "http://localhost:6006/"
    }
});

// By passing optional props to this story, you can control the props of the component when
// you consume the story in a test.
export const LoginPopup = (props?: Partial<Props>) => {
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
