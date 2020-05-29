import React from 'react';
import './App.css';

import {
    AuthenticatedComponent,
    MsalConsumer
} from './msal-react';

import {
    Switch,
    Route,
    Link
  } from "react-router-dom";
import { Home } from './Home';
import { GetAccessToken } from './AccessToken';
import { Redirect } from './Redirect';
import { ProtectedRoute } from './Protected-route';
import { UnauthenticatedComponentPage } from './Unauthenticated-component';

function App() {
  return (
    <div className="App">
        <nav>
            <ul className="nav-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/higher-order-component">Higher Order Component</Link></li>
                <li><Link to="/protected-route">Protected Route</Link></li>
                <li><Link to="/redirect">Redirect</Link></li>
                <li><Link to="/unauthenticated-component">Unauthenticated Component</Link></li>
                <li><Link to="/get-access-token">Get Access Token</Link></li>
            </ul>
            <div className="nav-buttons">
                <MsalConsumer>
                    {msal => (
                        <AuthenticatedComponent
                            unauthenticatedComponent={(
                                <button
                                    onClick={e => {
                                        e.preventDefault();
                                        msal?.loginPopup({
                                            scopes: [
                                                "user.read"
                                            ]
                                        });
                                    }}
                                >
                                    Login
                                </button>
                            )}
                        >
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                    msal?.logout();
                                }}
                            >
                                Logout
                            </button>
                        </AuthenticatedComponent>
                    )}
                </MsalConsumer>
            </div>
        </nav>
        <Switch>
            <Route path="/higher-order-component">
                <p>This page demonstrates the usage of a Higher Order Component</p>
            </Route>
            <Route path="/protected-route">
                <ProtectedRoute />
                <p>This page demonstrates a protected route, automatically triggering a login if user has not been authenticated</p>
            </Route>
            <Route path="/redirect">
                <Redirect />
                <p>This page demonstrates a redirect login flow</p>
            </Route>
            <Route path="/unauthenticated-component">
                <UnauthenticatedComponentPage />
                <p>This page demonstrates the usage of individual Authenticated and Unauthenticated components</p>
            </Route>
            <Route path="/get-access-token">
                <GetAccessToken />
                <p>This page demonstrates acquiring an access token with unauthenticatedComponent integrated into AuthenticatedComponent</p>
            </Route>
            <Route path="/">
                <Home />
            </Route>
        </Switch>
    </div>
  );
}

export default App;
