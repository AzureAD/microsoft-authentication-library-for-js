import React, { useCallback } from 'react';
import './App.css';

import {
    useMsal,
    AuthenticatedTemplate,
    UnauthenticatedTemplate
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

// TODO: Should have a demo page that calls the Graph API

const App: React.FunctionComponent = () => (
    <div className="App">
        <Header />
        <Switch>
            <Route path="/higher-order-component" component={HigherOrderComponentPage} />
            <Route path="/protected-route" component={ProtectedRoutePage} />
            <Route path="/redirect" component={RedirectPage} />
            <Route path="/unauthenticated-component" component={UnauthenticatedComponentPage} />
            <Route path="/get-access-token" component={GetAccessTokenPage} />
            <Route path="/" component={HomePage} />
        </Switch>
    </div>
);

const Header: React.FunctionComponent = () => {
    const { loginPopup, logout } = useMsal();

    const onLoginClick = useCallback(() => {
        loginPopup({
            scopes: ["user.read"]
        });
    }, [loginPopup]);

    const onLogoutClick = useCallback(() => {
        logout();
    }, [logout]);

    return (
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
                    <AuthenticatedTemplate>
                        <button onClick={onLogoutClick}>Logout</button>
                    </AuthenticatedTemplate>
                    <UnauthenticatedTemplate>
                        <button onClick={onLoginClick}>Login</button>
                    </UnauthenticatedTemplate>
                </div>
            </nav>
        </header>
    );
} 

export default App;
