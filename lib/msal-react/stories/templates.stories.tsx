/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as React from "react";
import { MsalProvider, AuthenticatedTemplate, IMsalContext, UnauthenticatedTemplate } from "../src";

import { msalInstance } from "./msalInstance";
import { useState } from "react";

export default {
    title: "MSAL React/Templates",
};

export const Authenticated = () => (
    <MsalProvider instance={msalInstance}>
        <p>This page has content that will only render if you are authenticated.</p>
        <AuthenticatedTemplate>
            {(context: IMsalContext) => (
                <React.Fragment>
                    <b>Welcome, {context.accounts[0].username}!</b>
                </React.Fragment>
            )}
        </AuthenticatedTemplate>
        <AuthenticatedTemplate>
            <span> You are authenticated!</span>
        </AuthenticatedTemplate>
    </MsalProvider>
);
Authenticated.story = { name: "AuthenticatedTemplate" };

export const Uauthenticated = () => (
    <MsalProvider instance={msalInstance}>
        <p>This page has content that will only render if you are unauthenticated.</p>
        <UnauthenticatedTemplate>
            <b>You are not authenticated.</b>
        </UnauthenticatedTemplate>
        <UnauthenticatedTemplate>
            {(context: IMsalContext) => (
                <b> There are currently {context.accounts.length} active accounts.</b>
            )}
        </UnauthenticatedTemplate>
    </MsalProvider>
);
Uauthenticated.story = { name: "UauthenticatedTemplate" };

export const SpecificUser = () => {
    const [username, setUsername] = useState("user@example.com");
    const [currentUser, setCurrentUser] = useState(username);

    return (
        <MsalProvider instance={msalInstance}>
            <input type="text" onChange={(e) => setUsername(e.target.value)} value={username} />
            <button onClick={() => setCurrentUser(username)}>Check status</button>
            <p>Authentication status templates can be scoped to a specific username.</p>

            <UnauthenticatedTemplate username={currentUser}>
                <p>The user <b>{currentUser}</b> is <b>unauthenticated</b>.</p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate username={currentUser}>
                <p>The user <b>{currentUser}</b> is <b>authenticated</b>.</p>
            </AuthenticatedTemplate>
        </MsalProvider>
    );
};
