# MSAL React POC

This folder contains a proof-of-concept for the MSAL React library. It is intended to demonstrate our thinking on what a MSAL React wrapper library might look like.

## Documentation

### Installation

MSAL React will have `@azure/msal-browser` listed as a peer dependency.

```sh
npm install react react-dom
npm install @azure/msal-react @azure/msal-browser
```

### API

#### MsalProvider

MSAL React will be configured with the same configuration for MSAL.js itself, along with any configuration options that are specific to MSAL React (TBD). This will be passed to the `MsalProvider` component, which will put an instance of `PublicClientApplication` in the React context. Using `MsalProvider` will be a requirement for the other APIs. It will be recommended to use `MsalProvider` at the top-level of your application.

`MsalProvider` and `MsalConsumer` are built on the [React context API](https://reactjs.org/docs/context.html). There are various ways of recieving the context values, including components and hooks.

```javascript
// index.js
import React from "react";
import ReactDOM from "react-dom";

import { MsalProvider } from "@azure/msal-react";
import { Configuration } from "@azure/msal-browser";

import App from "./app.jsx";

// MSAL configuration
const configuration: Configuration = {
    auth: {
        clientId: "client-id"
    }
};

// Component
const AppProvider = () => (
    <MsalProvider configuration={configuration}>
        <App />
    </MsalProvider>
);

ReactDOM.render(<AppProvider />, document.getElementById("root"));
```

#### useMsal

A hook that returns the instance of `PublicClientApplication` to be used within a function component. Changes to the context from the `MsalProvider` will allow your function component to update as required.

```js
import React from 'react';
import { useMsal } from "@azure/msal-react";

export function HomePage() {
    const msal = useMsal();

    if (msal.isAuthenticated) {
        return <span>You are currently authenticated.</span>
    } else {
        return <span>You are not authenticated yet.</span>
    }
}
```


#### MsalConsumer

When using `MsalProvider`, MSAL React will put an instance of `PublicClientApplication` in context, which applications can consume via the `MsalConsumer` component. This will pass down the instance of `PubliClientApplication` using the [function-as-a-child pattern](https://reactjs.org/docs/context.html#contextconsumer).

```js
import React from 'react';
import { MsalConsumer } from "@azure/msal-react";

export function HomePage() {
    return (
        <MsalConsumer>
            {msal => (
                <div>
                    <h2>{msal?.getAccount() && `Welcome, ${msal?.getAccount().name}`}</h2>
                </div>
            )}
        </MsalConsumer>
    )}
```


#### MsalContext

The raw context for MSAL React. It will not be recommended to use this directly, except when your application needs to access the context type itself (e.g. consuming the MSAL React context directly).

```js
// app.js
import React from "react";
import { MsalContext } from "@azure/msal-react";

class App extends React.Component {
    static contextType = MsalContext;

    render() {
        return (
            <div>
                {!this.context.getAccount() ? (
                    <button
                        onClick={e => {
                            e.preventDefault();
                            this.context.loginPopup();
                        }}
                    >
                        Login
                    </button>
                ) : (
                    <button
                        onClick={e => {
                            e.preventDefault();
                            this.context.logout();
                        }}
                    >
                        Logout
                    </button>
                )}
            </div>
        )
    }
}

export default App;
```

#### withMsal

A higher-order component which will pass the MSAL instance as a prop (instead of via context). The instance of `withMsal` must be a child (at any level) of `MsalProvider`.

```js
// app.js
import React from "react";
import { IMsalPropType } from "@azure/msal-react";

const scopes = ['user.read'];

class App extends React.Component {
    static propTypes = {
        msal: IMsalPropType
    }

    render() {
        if (this.props.msal.isAuthenticated) {
            return (
                <button
                    onClick={e => {
                        this.props.msal.logout();
                    }}
                >
                    Logout
                </button>
            );
        } else {
            return (
                <button
                    onClick={e => {
                        this.props.msal.loginPopup({ scopes });
                    }}
                >
                    Login
                </button>
            );
        }
    }
}

export const WrappedApplication = withMsal(App);

// index.js
import { WrappedApplication } from "./app.js";

const AppProvider = () => (
    <MsalProvider configuration={configuration}>
        <WrappedApplication />
    </MsalProvider>
);

ReactDOM.render(<AppProvider />, document.getElementById("root"));
```

#### AuthenticatedTemplate

The `AuthenticatedTemplate` component will only render the children if the user has a currently authenticated account. This allows conditional rendering of content or components that require a certain authentication state.

Additionally, the `AuthenticatedTemplate` provides the option to pass a function as a child using the [function-as-a-child pattern](https://reactjs.org/docs/context.html#contextconsumer). This will pass down the instance of `PubliClientApplication` as the only argument for more advanced conditional logic.

```js
import React from 'react';
import { AuthenticatedTemplate } from "@azure/msal-react";

export function HomePage() {
    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            <AuthenticatedTemplate>
                <p>But only authenticated users will see this paragraph.</p>
            </AuthenticatedTemplate>
            <AuthenticatedTemplate>
                {(msal) => {
                    return (
                        <p>You have {msal.accounts.length} accounts authenticated.</p>
                    );
                }}
            </AuthenticatedTemplate>
        </React.Fragment>
    );
}
```

#### UnauthenticatedTemplate

The `UnauthenticatedTemplate` component will only render the children if the user has a no accounts currently authenticated. This allows conditional rendering of content or components that require a certain authentication state.

Additionally, the `UnauthenticatedTemplate` provides the option to pass a function as a child using the [function-as-a-child pattern](https://reactjs.org/docs/context.html#contextconsumer). This will pass down the instance of `PubliClientApplication` as the only argument for more advanced conditional logic.

```js
import React from 'react';
import { UnauthenticatedTemplate } from "@azure/msal-react";

export function HomePage() {
    return (
        <React.Fragment>
            <p>Anyone can see this paragraph.</p>
            <UnauthenticatedTemplate>
                <p>But only user's who have no authenticated accounts will see this paragraph.</p>
            </UnauthenticatedTemplate>
            <UnauthenticatedTemplate>
                {(msal) => {
                    return (
                        <button onClick={(e) => { msal.logout(); }}>Logout</button>
                    );
                }}
            </UnauthenticatedTemplate>
        </React.Fragment>
    );
}
```

#### MsalAuthentication

The `MsalAuthentication` component takes props that allow you to configure the authentication method and guarentees that authentication will be executed when the component is rendered. A default authentication flow will be initiated using the instance methods of `PublicClientApplication` provided by the `MsalProvider`.

For more advanced use cases, the default authentication logic implemented with `MsalAuthentication` may not be suitable. In these situations, it may be better to write a custom hook or component that uses the instance of `PublicClientApplication` from the `MsalProvider` to support more specific behavior.

```js
import React from 'react';
import { MsalAuthentication, AuthenticationType, UnauthenticatedTemplate, AuthenticatedTemplate } from "@azure/msal-react";

export function ProtectedComponent() {
    return (
        <MsalAuthentication request={{ scopes: ['user.read'] }} forceLogin={true} type={AuthenticationType.POPUP}>
            <h1>Protected Component</h1>
            <p>Any children of the MsalAuthentication component will be rendered unless they are wrapped in a conditional template.</p>

            <UnauthenticatedTemplate>
                <p>Please login before viewing this page.</p>
            </UnauthenticatedTemplate>
            <AuthenticatedTemplate>
                <p>Thank you for logging in with your account!</p>
            </AuthenticatedTemplate>
        </MsalAuthentication>
    );
}
```




#### useHandleRedirect

React hook to receive the response from redirect operations (wrapper around `handleRedirectPromise`).

TODO: Error handling

```js
export function RedirectPage() {
    const redirectResult = useHandleRedirect();

    if (redirectResult) {
        return (
            <React.Fragment>
                <p>Redirect response:</p>
                <pre>{JSON.stringify(redirectResult, null, 4)}</pre>
            </React.Fragment>
        );
    } else {
        return (
            <p>This page is not returning from a redirect operation.</p>
        );
    }
}
```
