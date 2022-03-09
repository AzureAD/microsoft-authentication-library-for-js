# Hooks

1. [`useAccount`](#useaccount-hook)
1. [`useIsAuthenticated`](#useisauthenticated-hook)
1. [`useMsal`](#usemsal-hook)
1. [`useMsalAuthentication`](#usemsalauthentication-hook)

## `useAccount` hook

The `useAccount` hook accepts an `accountIdentifier` parameter and returns the `AccountInfo` object for that account if it is signed in or `null` if it is not. If no account identifier is provided the current [active account](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/accounts.md#active-account-apis) will be returned.
You can read more about the `AccountInfo` object returned in the `@azure/msal-browser` docs [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#account-apis).

```javascript
const accountIdentifier = {
    localAccountId: "example-local-account-identifier",
    homeAccountId: "example-home-account-identifier"
    username: "example-username" // We do not recommend relying only on username
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

Note: The `accounts` value returned by `useMsal` will only update when accounts are added or removed, and will not update when claims are updated. If you need access to updated claims for the current user, use the `useAccount` hook or call `acquireTokenSilent` instead.

```javascript
import { useState, useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

const { instance, accounts, inProgress } = useMsal();
const [loading, setLoading] = useState(false);
const [apiData, setApiData] = useState(null);

useEffect(() => {
    if (!loading && inProgress === InteractionStatus.None && accounts.length > 0) {
        if (apiData) {
            // Skip data refresh if already set - adjust logic for your specific use case
            return;
        }

        const tokenRequest = {
            account: accounts[0], // This is an example - Select account based on your app's requirements
            scopes: ["User.Read"]
        }

        // Acquire an access token
        instance.acquireTokenSilent(tokenRequest).then((response) => {
            // Call your API with the access token and return the data you need to save in state
            callApi(response.accessToken).then((data) => {
                setApiData(data);
                setLoading(false);
            });
        }).catch(async (e) => {
            // Catch interaction_required errors and call interactive method to resolve
            if (e instanceof InteractionRequiredAuthError) {
                await instance.acquireTokenRedirect(tokenRequest);
            }

            throw e;
        });
    }
}, [inProgress, accounts, instance, loading, apiData]);

if (loading || inProgress === InteractionStatus.Login) {
    // Render loading component
} else if (apiData) {
    // Render content that depends on data from your API
}
```

Docs for the APIs `PublicClientApplication` exposes can be found in the `@azure/msal-browser` docs:

- [Login APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md)
- [Logout API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md)
- [AcquireToken APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md)
- [Account APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/accounts.md)
- [Event APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md)

## `useMsalAuthentication` hook

The `useMsalAuthentication` hook will initiate a login if a user is not already signed in, otherwise it will attempt to acquire a token.

### Input Parameters

- [interactionType](https://azuread.github.io/microsoft-authentication-library-for-js/ref/enums/_azure_msal_browser.interactiontype.html) (Popup, Redirect, or Silent) specifies how you would like to acquire tokens or login when interaction is required (note the Silent option has some extra considerations explained below)
- [request object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md) (optional) specifies additional parameters to be used by the login or token acquisition call
- [accountIdentifiers](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_react.html#accountidentifiers) object is used to tell the hook which user it should log-in or acquire tokens for

### Return Properties

- [result](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult) - The response from the last successful login or token acquisition. Note that this hook only attempts to login or acquire tokens automatically one time. It is the application's responsiblity to call the `login` or `acquireToken` function, when needed, to update this value.
- [error](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.autherror.html) - If an error occurs during login or token acquisition this property will contain information about the error. You can use the `login` or `acquireToken` functions returned by this hook to retry. The `error` property will be cleared on the next successful login or token acquisition.
- `login` - function which can be used to retry a failed login. The `response` and `error` properties will be updated.
- `acquireToken` - function which can be used to get a new access token before calling a protected API. The `response` and `error` properties will be updated.

Note: Passing the "Silent" interaction type will call `ssoSilent` which attempts to open a hidden iframe and reuse an existing session with AAD. This will not work in browsers that block 3rd party cookies such as Safari. Additionally, the request object is required when using the "Silent" type. If you already have the user's sign-in information, you can pass either the `loginHint` or `sid` optional parameters to sign-in a specific account. Note: there are [additional considerations](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#silent-login-with-ssosilent) - when using `ssoSilent` without providing any information about the user's session.

### `ssoSilent` example

If you use silent you should catch any errors and attempt an interactive login as a fallback.

```javascript
import React, { useEffect } from 'react';

import { AuthenticatedTemplate, UnauthenticatedTemplate, useMsal, useMsalAuthentication } from "@azure/msal-react";
import { InteractionType, InteractionRequiredAuthError } from '@azure/msal-browser';

function App() {
    const request = {
        loginHint: "name@example.com",
        scopes: ["User.Read"]
    }
    const { login, result, error } = useMsalAuthentication(InteractionType.Silent, request);

    useEffect(() => {
        if (error instanceof InteractionRequiredAuthError) {
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
import { InteractionType } from '@azure/msal-browser';

export function App() {
    const accountIdentifiers = {
        username: "example-username"
    }
    const request = {
        loginHint: "example-username",
        scopes: ["User.Read"]
    }
    const [login, response, error] = useMsalAuthentication(InteractionType.Popup, request, accountIdentifiers);

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
