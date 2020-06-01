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
import { HomePage } from './pages/Home';
import { GetAccessTokenPage } from './pages/AccessToken';
import { RedirectPage } from './pages/Redirect';
import { ProtectedRoutePage } from './pages/ProtectedRoute';
import { UnauthenticatedComponentPage } from './pages/UnauthenticatedComponent';
import { HigherOrderComponentPage } from "./pages/HigherOrderComponent";

function App() {
  return (
    <div className="App">
        <header>
            <h1>MSAL React Sample App</h1>
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
        </header>
        <Switch>
            <Route path="/higher-order-component">
                <h2>Higher-Order Component</h2>
                <p>This page demonstrates the usage of a Higher Order Component</p>
                <HigherOrderComponentPage />
            </Route>
            <Route path="/protected-route">
                <h2>Protected Route</h2>
                <p>This page demonstrates a protected route, automatically triggering a login if user has not been authenticated</p>
                <ProtectedRoutePage />
            </Route>
            <Route path="/redirect">
                <h2>Redirect</h2>
                <p>This page demonstrates a redirect login flow</p>
                <RedirectPage />
            </Route>
            <Route path="/unauthenticated-component">
                <h2>Unauthenticated Component</h2>
                <p>This page demonstrates the usage of individual Authenticated and Unauthenticated components</p>
                <UnauthenticatedComponentPage />
            </Route>
            <Route path="/get-access-token">
                <h2>Access Token</h2>
                <p>This page demonstrates acquiring an access token with unauthenticatedComponent integrated into AuthenticatedComponent</p>
                <GetAccessTokenPage />
            </Route>
            <Route path="/">
                <HomePage />
            </Route>
        </Switch>
    </div>
  );
}

export default App;
