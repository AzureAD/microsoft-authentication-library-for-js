# Hooks

1. [`useAccount`](#useaccount-hook)
1. [`useIsAuthenticated`](#useisauthenticated-hook)
1. [`useMsal`](#usemsal-hook)
1. [`useMsalAuthentication`](#usemsalauthentication-hook)

## `useAccount` hook

The `useAccount` hook accepts an `accountIdentifier` parameter and returns the `AccountInfo` object for that account if it is signed in or `null` if it is not.
You can read more about the `AccountInfo` object returned in the `msal-browser` docs [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#account-apis).

Note: At least one account identifier must be provided, all others are optional. Additionally we do not recommend relying only on `username`.

```javascript
const accountIdentifier = {
    localAccountId: "example-local-account-identifier",
    homeAccountId: "example-home-account-identifier"
    username: "example-username"
}

const accountInfo = useAccount(accountIdentifier);
```

## `useIsAuthenticated` hook

The `useIsAuthenticated` hook returns a boolean indicating whether or not an account is signed in. It optionally accepts an `accountIdentifier` object you can provide if you need to know whether or not a specific account is signed in.

### Determine if any account is currently signed in

```javascript
import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";

export function App() {
    const isAuthenticated = useIsAuthenticated();

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            {isAuthenticated && (
                <p>At least one account is signed in!</p>
            )}
            {!isAuthenticated && (
                <p>No users are signed in!</p>
            )}
        </React.Fragment>
    );
}
```

### Determine if specific user is signed in

Note: At least one account identifier must be provided, all others are optional. Additionally we do not recommend relying only on `username`.

```javascript
import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";

export function App() {
    const accountIdentifiers = {
        localAccountId: "example-local-account-identifier",
        homeAccountId: "example-home-account-identifier",
        username: "example-username"
    }

    const isAuthenticated = useIsAuthenticated(accountIdentifiers);

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            {isAuthenticated && (
                <p>User with specified localAccountId is signed in!</p>
            )}
            {!isAuthenticated && (
                <p>User with specified localAccountId is not signed in!</p>
            )}
        </React.Fragment>
    );
}
```

## `useMsal` hook

The `useMsal` hook returns the context. This can be used if you need access to the `PublicClientApplication` instance, the list of accounts currently signed in or if you need to know whether a login or other interaction is currently in progress.

```javascript
const [instance, accounts, inProgress] = useMsal();
let accessToken = null;
useEffect(() => {
    if (inProgress === "none" && accounts.length > 0) {
        // Retrieve an access token
        accessToken = instance.acquireTokenSilent({
            account: accounts[0],
            scopes: ["User.Read"]
        }).then(response => {
            if (response.accessToken) {
                return response.accessToken;
            }
            return null;
        });
    }
}, [inProgress, accounts, instance]);

if (inProgress === "login") {
    // Render loading component
} else if (accessToken) {
    // Call your api and render component
}
```

Docs for the APIs `PublicClientApplication` exposes can be found in the `msal-browser` docs:

- [Login APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md)
- [Logout API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md)
- [AcquireToken APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md)
- [Account APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/accounts.md)
- [Event APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md)

## `useMsalAuthentication` hook

The `useMsalAuthentication` hook will initiate a login if a user is not already signed in. It accepts an `interactionType` ("Popup", "Redirect", or "Silent") and optionally accepts a [request object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-react-feature-branch/lib/msal-browser/docs/request-response-object.md#request) and an `accountIdentifiers` object if you would like to ensure a specific user is signed in. The hook will return the `response` or `error` from the login call and the `login` callback which can be used to retry a failed login.

Note: Passing the "Silent" interaction type will call `ssoSilent` which attempts to open a hidden iframe and reuse an existing session with AAD. This will not work in browsers that block 3rd party cookies such as Safari. Additionally, when using the "Silent" type the request object is required and must contain either a `loginHint` or `sid` parameter.

### `ssoSilent` example

If you use silent you should catch any errors and attempt an interactive login as a fallback.

```javascript
import React, { useEffect } from 'react';

import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useMsalAuthentication } from "@azure/msal-react";
import { InteractionType } from '@azure/msal-browser';

function App() {
    const request = {
        loginHint: "name@example.com",
        scopes: ["User.Read"]
    }
    const { login, result, error } = useMsalAuthentication(InteractionType.Silent, request);

    useEffect(() => {
        if (error) {
            login(InteractionType.Popup, request);
        }
    }, [error]);

    const { accounts } = useMsal();

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            <AuthenticatedTemplate>
                <p>Signed in as: {accounts[0]?.username}</p>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <p>No users are signed in!</p>
            </UnauthenticatedTemplate>
        </React.Fragment>
    );
}

export default App;
```

### Specific user example

If you would like to ensure a specific user is signed in, provide an `accountIdentifiers` object.

```javascript
import React from 'react';
import { useMsalAuthentication } from "@azure/msal-react";

export function App() {
    const accountIdentifiers = {
        username: "example-username"
    }
    const request = {
        loginHint: "example-username",
        scopes: ["User.Read"]
    }
    const [login, response, error] = useMsalAuthentication("popup", request, accountIdentifiers);

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            <AuthenticatedTemplate username="example-username">
                <p>Example user is signed in!</p>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate username="example-username">
                <p>Example user is not signed in!</p>
            </UnauthenticatedTemplate>
        </React.Fragment>
    );
}
```
