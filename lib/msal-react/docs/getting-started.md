# Getting Started

1. [Initialization](#initialization)
1. [Determining whether a user is authenticated](#determining-whether-a-user-is-authenticated)
1. [Protecting Components](#protecting-components)
1. [Sign a user in using the login APIs provided by @azure/msal-browser](#sign-a-user-in-using-the-login-apis-provided-by-azuremsal-browser)
1. [Acquiring an access token](#acquiring-an-access-token)

## Initialization

`@azure/msal-react` is built on the [React context API](https://reactjs.org/docs/context.html) and all parts of your app that require authentication must be wrapped in the `MsalProvider` component. You will first need to [initialize](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md) an instance of `PublicClientApplication` then pass this to `MsalProvider` as a prop.

```javascript
import React from "react";
import ReactDOM from "react-dom";

import { MsalProvider } from "@azure/msal-react";
import { Configuration,  PublicClientApplication } from "@azure/msal-browser";

import App from "./app.jsx";

// MSAL configuration
const configuration: Configuration = {
    auth: {
        clientId: "client-id"
    }
};

const pca = new PublicClientApplication(configuration);

// Component
const AppProvider = () => (
    <MsalProvider instance={pca}>
        <App />
    </MsalProvider>
);

ReactDOM.render(<AppProvider />, document.getElementById("root"));
```

All components underneath `MsalProvider` will have access to the `PublicClientApplication` instance via context as well as all hooks and components provided by `@azure/msal-react`.

## Determining whether a user is authenticated

Most applications will need to conditionally render certain components based on whether a user is signed in or not. `@azure/msal-react` provides 2 easy ways to do this.

### `AuthenticatedTemplate` and `UnauthenticatedTemplate`

`AuthenticatedTemplate` and `UnauthenticatedTemplate` components will only render their children if a user is authenticated or unauthenticated, respectively.

```javascript
import React from 'react';
import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";

export function App() {
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

### `useIsAuthenticated` hook

As an alternative to the wrapper components above your app can use the `useIsAuthenticated` hook.
You can read more about this hook in the [hooks doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md#useisauthenticated-hook).

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

## Protecting Components

If you have components you only want to show to authenticated users you can use any of the methods above. But what if you want to automatically invoke a login if a user is not yet authenticated? `@azure/msal-react` provides 2 ways of doing this with the `MsalAuthenticationTemplate` or the `useMsalAuthentication` hook.

### `MsalAuthenticationTemplate` Component

The `MsalAuthenticationTemplate` component will render its children if a user is authenticated or attempt to sign a user in. Just provide it with the interaction type you would like to use (redirect or popup) and optionally a [request object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md) to be passed to the login API, a component to display while authentication is in progress or a component to display if an error occurs.

You can find a working example of this in any of our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples) on the `/profile` page.

```javascript
import React from "react";
import { MsalAuthenticationTemplate } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";

function ErrorComponent({error}) {
    return <p>An Error Occurred: {error}</p>;
}

function LoadingComponent() {
    return <p>Authentication in progress...</p>;
}

export function Example() {
    const authRequest = {
        scopes: ["openid", "profile"]
    };

    return (
        // authenticationRequest, errorComponent and loadingComponent props are optional
        <MsalAuthenticationTemplate 
            interactionType={InteractionType.Popup} 
            authenticationRequest={authRequest} 
            errorComponent={ErrorComponent} 
            loadingComponent={LoadingComponent}
        >
            <p>At least one account is signed in!</p>
        </MsalAuthenticationTemplate>
      )
};
```

### `useMsalAuthentication` hook

The `useMsalAuthentication` hook will first check if a user is signed in, then attempt to sign a user in if there are no users signed in. You will need to provide the interaction type you would like to use (redirect or popup).
It will return the result of the login operation, any error that occurred and the login function you can use if you need to retry.

You can read more about this hook in the [hooks doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md#usemsalauthentication-hook).

```javascript
import React from 'react';
import { useMsalAuthentication } from "@azure/msal-react";

export function App() {
    const {login, result, error} = useMsalAuthentication("popup");

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

## Sign a user in using the login APIs provided by `@azure/msal-browser`

Another way to invoke a sign-in is by using `@azure/msal-browser` APIs directly from the `PublicClientApplication` instance in context. There are 3 ways you can access the instance from context.

### `useMsal` hook

A hook that returns the `PublicClientApplication` instance, an array of all accounts currently signed in and an `inProgress` value that tells you what msal is currently doing.

You can read more about this hook in the [hooks doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md#usemsal-hook).

```javascript
import React from 'react';
import { useMsal } from "@azure/msal-react";

export function App() {
    const { instance, accounts, inProgress } = useMsal();

    if (accounts.length > 0) {
        return <span>There are currently {accounts.length} users signed in!</span>
    } else if (inProgress === "login") {
        return <span>Login is currently in progress!</span>
    } else {
        return (
            <>
                <span>There are currently no users signed in!</span>
                <button onClick={() => instance.loginPopup()}>Login</button>
            </>
        );
    }
}
```

### Consuming the raw context

If you are using a class component and can't use hooks you can consume the raw msal context through `MsalContext`.
You can read more about using `@azure/msal-react` in class components [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md).

```javascript
import React from "react";
import { MsalContext } from "@azure/msal-react";

class App extends React.Component {
    static contextType = MsalContext;

    render() {
        if (this.context.accounts.length > 0) {
            return <span>There are currently {this.context.accounts.length} users signed in!</span>
        } else if (this.context.inProgress === "login") {
            return <span>Login is currently in progress!</span>
        } else {
            return (
                <>
                    <span>There are currently no users signed in!</span>
                    <button onClick={() => this.context.instance.loginPopup()}>Login</button>
                </>
            );
        }
    }
}
```

### Wrapping your component with the withMsal Higher-Order-Component

Another way to consume the msal context in both class and function components is to wrap your component with the `withMsal` HOC which will inject the context into the props of your component.

```javascript
import React from "react";
import { withMsal } from "@azure/msal-react";

class LoginButton extends React.Component {
    render() {
        const isAuthenticated = this.props.msalContext.accounts.length > 0;
        const msalInstance = this.props.msalContext.instance;
        if (isAuthenticated) {
            return <button onClick={() => msalInstance.logout()}>Logout</button>    
        } else {
            return <button onClick={() => msalInstance.loginPopup()}>Login</button>
        }
    }
}

export default YourWrappedComponent = withMsal(LoginButton);
```

## Acquiring an access token

We recommend that your app calls the `acquireTokenSilent` API on your `PublicClientApplication` object each time you need an access token to access an API. This can be done similar to the ways laid out in the previous section: [Call login APIs provided by `@azure/msal-browser`](#call-login-apis-provided-by-@azure/msal-browser)

```javascript
import React, { useState, useEffect } from "react"
import { useMsal, useAccount } from "@azure/msal-react";

export function App() {
    const { instance, accounts, inProgress } = useMsal();
    const account = useAccount(accounts[0] || {});
    const [apiData, setApiData] = useState(null);

    useEffect(() => {
        if (account) {
            instance.acquireTokenSilent({
                scopes: ["User.Read"],
                account: account
            }).then((response) => {
                if(response) {
                    callMsGraph(response.accessToken).then((result) => setApiData(result));
                }
            });
        }
    }, [account, instance]);

    if (accounts.length > 0) {
        return (
            <>
                <span>There are currently {accounts.length} users signed in!</span>
                {apiData && (<span>Data retreived from API: {JSON.stringify(apiData)}</span>)}
            </>
        );
    } else if (inProgress === "login") {
        return <span>Login is currently in progress!</span>
    } else {
        return <span>There are currently no users signed in!</span>
    }
}
```

### Acquiring an access token outside of a React component

If you require an access token outside of a React component you can directly call the `acquireTokenSilent` function on the `PublicClientApplication`.
We do not recommend calling functions that change the user's authenticated state (login, logout) outside the react context provided by `MsalProvider` as the components inside the context may not properly update.

Keep in mind that the user has to be signed in before you can acquire a token.

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

// This should be the same instance you pass to MsalProvider
const msalInstance = new PublicClientApplication(config);

const acquireAccessToken = async (msalInstance) => {
    const activeAccount = msalInstance.getActiveAccount(); // This will only return a non-null value if you have logic somewhere else that calls the setActiveAccount API
    const accounts = msalInstance.getAllAccounts();

    if (!activeAccount && accounts.length === 0) {
        /*
        * User is not signed in. Throw error or wait for user to login.
        * Do not attempt to log a user in outside of the context of MsalProvider
        */   
    }
    const request = {
        scopes: ["User.Read"],
        account: activeAccount || accounts[0]
    };

    const authResult = await msalInstance.acquireTokenSilent(request);

    return authResult.accessToken
};
```

For a working end-to-end example, please see our [react router sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample).
