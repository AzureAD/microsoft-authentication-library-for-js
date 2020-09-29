import * as React from "react";
import { MsalProvider, useMsal, useIsAuthenticated, UnauthenticatedTemplate, AuthenticatedTemplate, IMsalContext, useMsalAuthentication } from "../src";

import { msalInstance } from "./msalInstance";
import { useState } from "react";

export default {
    title: "MSAL React/Hooks",
};

export const UseMsalHook = () => (
    <MsalProvider instance={msalInstance}>
        <UseMsalExample />
    </MsalProvider>
);
UseMsalHook.story = { name: "useMsal" };

export const UseIsAuthenticatedHook = () => (
    <MsalProvider instance={msalInstance}>
        <UseIsAuthenticatedExample />
    </MsalProvider>
);
UseIsAuthenticatedHook.story = { name: "useIsAuthenticated" };

export const UseMsalAuthenticationHook = () => (
    <MsalProvider instance={msalInstance}>
        <UseMsalAuthenticationEample />
    </MsalProvider>
);
UseMsalAuthenticationHook.story = { name: "useMsalAuthentication" };

const UseMsalExample = () => {
    const context = useMsal();

    return (
        <p>The <pre style={{display: "inline"}}>useMsal()</pre> hook gives access to the MSAL React context. From here, any MSAL methods can be called, and state values accessed. For example, we know there are {context.state.accounts.length} accounts authenticated.</p>
    );
};

const UseIsAuthenticatedExample = () => {
    const { state } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [username, setUsername] = useState(isAuthenticated ? state.accounts[0].username : "user@example.com");
    const [currentUser, setCurrentUser] = useState(username);
    
    const isSpecificUserAuthenticated = useIsAuthenticated(currentUser);
    
    return (
        <React.Fragment>
            <p>The <pre style={{display: "inline"}}>useIsAuthenticated()</pre> hook will tell you if there is at least one authenticated account. The hook also accepts an optional "username" argument, and will indicate whether the given user is authenticated.</p>
            
            <p>
                {isAuthenticated && (
                    <b>There is at least one account authenticated.</b>
                )}
                {!isAuthenticated && (
                    <b>There are no accounts authenticated.</b>
                )}
            </p>

            <input type="text" onChange={(e) => setUsername(e.target.value)} value={username} placeholder="Username" />
            <button onClick={(e) => setCurrentUser(username)}>Check status</button>
            <p>The user <b>{currentUser}</b> is <b>{isSpecificUserAuthenticated ? "authenticated" : "unauthenticated"}</b></p>
        </React.Fragment>
    );
};

const UseMsalAuthenticationEample = () => {
    useMsalAuthentication();
    
    return (
        <React.Fragment>
            <p>The <pre style={{display: "inline"}}>useMsalAuthentication()</pre> hook initiates the authentication process. It accepts optional parameters for a specific "username", or a custom "loginHandler" function which initiates a custom authentication flow using the MSAL API.</p>
            <UnauthenticatedTemplate>
                <p><b>Authenticating...</b></p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                {(context: IMsalContext) => (
                    <p><b>Welcome {context.state.accounts[0].username}! You have been authenticated.</b></p>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    );
};
