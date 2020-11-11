# Hooks

1. [`useAccount`](#useaccount)
1. [`useIsAuthenticated`](#useisauthenticated)
1. [`useMsal`](#usemsal)
1. [`useMsalAuthentication`](#usemsalauthentication)

## `useAccount` hook

The `useAccount` hook accepts an `accountIdentifier` parameter and returns the `AccountInfo` object for that account if it is signed in or `null` if it is not.
You can read more about the `AccountInfo` object returned in the `msal-browser` docs [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md#account-apis).

Note: Only one account identifier should be provided, if more than one are provided precedence is given in the following order: `localAccountId`, `homeAccountId`, `username`.

### Get an account by localAccountId

```javascript
const accountIdentifier = {
    localAccountId: "example-local-account-identifier"
}

const accountInfo = useAccount(accountIdentifier);
```

### Get an account by homeAccountId

```javascript
const accountIdentifier = {
    homeAccountId: "example-home-account-identifier"
}

const accountInfo = useAccount(accountIdentifier);
```

### Get an account by username

```javascript
const accountIdentifier = {
    username: "example-username"
}

const accountInfo = useAccount(accountIdentifier);
```

## `useIsAuthenticated` hook

The `useIsAuthenticated` hook returns a boolean indicating whether or not an account is signed in. It optionally accepts an `accountIdentifier` object you can provide if you need to know whether or not a specific account is signed in.

Note: Only one account identifier should be provided, if more than one are provided precedence is given in the following order: `localAccountId`, `homeAccountId`, `username`.

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

#### By localAccountId

```javascript
import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";

export function App() {
    const accountIdentifier = {
        localAccountId: "example-local-account-identifier"
    }

    const isAuthenticated = useIsAuthenticated(accountIdentifier);

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

#### By homeAccountId

```javascript
import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";

export function App() {
    const accountIdentifier = {
        homeAccountId: "example-home-account-identifier"
    }

    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            {isAuthenticated && (
                <p>User with specified homeAccountId is signed in!</p>
            )}
            {!isAuthenticated && (
                <p>User with specified homeAccountId is not signed in!</p>
            )}
        </React.Fragment>
    );
}
```

#### By username

```javascript
import React from 'react';
import { useIsAuthenticated } from "@azure/msal-react";

export function App() {
    const accountIdentifier = {
        username: "example-username"
    }

    const isAuthenticated = useIsAuthenticated(accountIdentifier);

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            {isAuthenticated && (
                <p>User with specified username is signed in!</p>
            )}
            {!isAuthenticated && (
                <p>User with specified username is not signed in!</p>
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
}, [inProgress, account, instance]);

if (inProgress === "login") {
    // Render loading component
} else if (accessToken) {
    // Call your api and render component
}
```

## `useMsalAuthentication` hook

The `useMsalAuthentication` hook will initiate a login if a user is not already signed in. It accepts an `interactionType` ("Popup", "Redirect", or "Silent") and optionally accepts a [request object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-react-feature-branch/lib/msal-browser/docs/request-response-object.md#request) and an `accountIdentifier` object if you would like to ensure a specific user is signed in. The hook will return the `response` or `error` from the login call and the `login` callback which can be used to retry a failed login.

Note: Passing the "Silent" interaction type will call `ssoSilent` which attempts to open a hidden iframe and reuse an existing session with AAD. This will not work in browsers that block 3rd party cookies such as Safari. Additionally, when using the "Silent" type the request object is required and must contain either a `loginHint` or `sid` parameter.

### `ssoSilent` example

If you use silent you should catch any errors and attempt an interactive login as a fallback.

```javascript
import React from 'react';
import { useMsalAuthentication } from "@azure/msal-react";

export function App() {
    const request = {
        loginHint: "example_username",
        scopes: ["User.Read"]
    }
    const [login, response, error] = useMsalAuthentication("silent", request);
    useEffect(() => {
        if (error) {
            login("popup", request);
        }
    }, [error]);

    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            <AuthenticatedTemplate>
                <p>At least one account is signed in!</p>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <p>No users are signed in!</p>
            </UnauthenticatedTemplate>
        </React.Fragment>
    );
}
```

### Specific user example

If you would like to ensure a specific user is signed in, provide an `accountIdentifier` object.

```javascript
import React from 'react';
import { useMsalAuthentication } from "@azure/msal-react";

export function App() {
    const accountIdentifier = {
        username: "example-username"
    }
    const request = {
        loginHint: "example-username",
        scopes: ["User.Read"]
    }
    const [login, response, error] = useMsalAuthentication("popup", request, accountIdentifier);

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
