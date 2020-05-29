import React from 'react';
import './App.css';

import { 
    IPublicClientApplication, 
    IPublicClientApplicationPropType, 
    AuthenticatedComponent, 
    UnauthenticatedComponent,
    MsalConsumer,
    useHandleRedirect
} from './msal-react';

import {
    Switch,
    Route,
    Link
  } from "react-router-dom";
import { Home } from './Home';
import { GetAccessToken } from './AccessToken';
import { Redirect } from './Redirect';
import { ProtectedRoute } from './ProtectedRoute';

type AppPropTypes = {
    msal: IPublicClientApplication
}

function App() {
    // const [ redirectResult ] = useHandleRedirect();
    // console.log('redirectResult', redirectResult);
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
                <p>Higher Order Component</p>
            </Route>
            <Route path="/protected-route">
                <ProtectedRoute />
            </Route>
            <Route path="/redirect">
                <Redirect />
            </Route>
            <Route path="/unauthenticated-component">
                <p>Unauthenticated Component</p>
            </Route>
            <Route path="/get-access-token">
                <GetAccessToken />
            </Route>
            <Route path="/">
                <Home />
            </Route>
        </Switch>
        {/*
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
                    )}*/}

        {/* <div>
            <p>Account:</p>
            <pre>{JSON.stringify(props.msal?.getAccount(), null, 4)}</pre>
            {!props.msal?.getAccount() ? (
                <button
                    onClick={e => {
                        e.preventDefault();
                        props.msal?.loginPopup({});
                    }}
                >
                    Login
                </button>
            ) : (
                <button
                    onClick={e => {
                        e.preventDefault();
                        props.msal?.logout();
                    }}
                >
                    Logout
                </button>
            )}
        </div> */}
    </div>
  );
}

/*
App.propTypes = {
    msal: IPublicClientApplicationPropType
}*/

export default App;
