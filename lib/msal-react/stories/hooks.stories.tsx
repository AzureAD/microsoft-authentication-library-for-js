/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { 
    MsalProvider, 
    useMsal, 
    useIsAuthenticated, 
    UnauthenticatedTemplate, 
    AuthenticatedTemplate, 
    IMsalContext, 
    useMsalAuthentication
} from "../src";

import { msalInstance } from "./msalInstance";
import { useState } from "react";
import { InteractionType } from "@azure/msal-browser";

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
        <UseMsalAuthenticationExample />
    </MsalProvider>
);
UseMsalAuthenticationHook.story = { name: "useMsalAuthentication" };

export const UseMsalAuthenticationHookSilently = () => (
    <MsalProvider instance={msalInstance}>
        <UseSilentMsalAuthenticationExample />
    </MsalProvider>
);
UseMsalAuthenticationHookSilently.story = { name: "useMsalAuthentication with ssoSilent" };

const UseMsalExample = () => {
    const context = useMsal();

    return (
        <p>The <pre style={{display: "inline"}}>useMsal()</pre> hook gives access to the MSAL React context. From here, any MSAL methods can be called, and state values accessed. For example, we know there are {context.accounts.length} accounts authenticated.</p>
    );
};

const UseIsAuthenticatedExample = () => {
    const { accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    const [username, setUsername] = useState(isAuthenticated ? accounts[0].username : "user@example.com");
    const [currentUser, setCurrentUser] = useState(isAuthenticated ? accounts[0].username : "user@example.com");
    
    const isSpecificUserAuthenticated = useIsAuthenticated({username: currentUser});
    
    return (
        <React.Fragment>
            <p>The <pre style={{display: "inline"}}>useIsAuthenticated()</pre> hook will tell you if there is at least one authenticated account. The hook also accepts optional username and homeAccountId arguments, and will indicate whether the given user is authenticated.</p>
            
            <p>
                {isAuthenticated && (
                    <b>There is at least one account authenticated.</b>
                )}
                {!isAuthenticated && (
                    <b>There are no accounts authenticated.</b>
                )}
            </p>

            <input type="text" onChange={(e) => setUsername(e.target.value)} value={username} placeholder="Username" />
            <button onClick={() => setCurrentUser(username)}>Check status</button>
            <p>The user <b>{currentUser}</b> is <b>{isSpecificUserAuthenticated ? "authenticated" : "unauthenticated"}</b></p>
        </React.Fragment>
    );
};

const UseMsalAuthenticationExample = () => {
    useMsalAuthentication(InteractionType.Popup);
    
    return (
        <React.Fragment>
            <p>The <pre style={{display: "inline"}}>useMsalAuthentication()</pre> hook initiates the authentication process. You must specify what interaction type to use for authentication. It also accepts optional parameters to identify if a specific user is signed in and a request object passed to the MSAL API for authentication, if necessary.</p>
            <UnauthenticatedTemplate>
                <p><b>Authenticating...</b></p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                {(context: IMsalContext) => (
                    <p><b>Welcome {context.accounts[0].username}! You have been authenticated.</b></p>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    );
};

const UseSilentMsalAuthenticationExample = () => {
    const {login, error} = useMsalAuthentication(InteractionType.Silent);

    React.useEffect(() => {
        if(error) {
            login(InteractionType.Popup);
        }
    }, [error]);
    
    return (
        <React.Fragment>
            <p>The <pre style={{display: "inline"}}>useMsalAuthentication()</pre> hook initiates the authentication process. You must specify what interaction type to use for authentication. It also accepts optional parameters to identify if a specific user is signed in and a request object passed to the MSAL API for authentication, if necessary.</p>
            <UnauthenticatedTemplate>
                <p><b>Authenticating...</b></p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                {(context: IMsalContext) => (
                    <p><b>Welcome {context.accounts[0].username}! You have been authenticated.</b></p>
                )}
            </AuthenticatedTemplate>
        </React.Fragment>
    );
};
