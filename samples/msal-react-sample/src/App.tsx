import React from 'react';
import './App.css';

import { Consumer } from "./msal-react";

function App() {
  return (
    <div className="App">
        <Consumer>
            {msal => (
                <div>
                    <p>Account:</p>
                    <pre>{JSON.stringify(msal?.getAccount(), null, 4)}</pre>
                    {!msal?.getAccount() ? (
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.loginPopup({});
                            }}
                        >
                            Login
                        </button>
                    ) : (
                        <button
                            onClick={e => {
                                e.preventDefault();
                                msal?.logout();
                            }}
                        >
                            Logout
                        </button>
                    )}
                </div>
            )}
        </Consumer>
    </div>
  );
}

export default App;
