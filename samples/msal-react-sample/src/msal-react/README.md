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

`MsalProvider` and `MsalConsumer` are built on the [React context API](https://reactjs.org/docs/context.html).

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

#### MsalConsumer

When using `MsalProvider`, MSAL React will put an instance of `PublicClientApplication` in context, which applications can consume via the `MsalConsumer` component. This will pass down the instance of `PubliClientApplication` using the [function-as-a-child pattern](https://reactjs.org/docs/context.html#contextconsumer).

```js
import React from 'react';
import { MsalConsumer } from "../msal-react";

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
import { IPublicClientApplicationPropType } from "@azure/msal-react";

class App extends React.Component {
    static propTypes = {
        msal: IPublicClientApplicationPropType
    }

    render() {
        return (
            <div>
                {!this.props.msal.getAccount() ? (
                    <button
                        onClick={e => {
                            e.preventDefault();
                            this.props.msal.loginPopup();
                        }}
                    >
                        Login
                    </button>
                ) : (
                    <button
                        onClick={e => {
                            e.preventDefault();
                            this.props.msal.logout();
                        }}
                    >
                        Logout
                    </button>
                )}
            </div>
        )
    }
}

export const WrappedApplication = withMsal()(App);

// index.js
import { WrappedApplication } from "./app.js";

const AppProvider = () => (
    <MsalProvider configuration={configuration}>
        <WrappedApplication />
    </MsalProvider>
);

ReactDOM.render(<AppProvider />, document.getElementById("root"));
```

#### AuthenticatedComponent

React component class whose contents are only viewable when the user is logged in. Optionally, it can prompt the user to authenticate if they are not logged in.

Also supports rendering an error message, as well as a fallback UI if the user is not authenticated.

Must be used as a child of `MsalProvider`.

```js
<AuthenticatedComponent
    onError={error => (
        <p>{error.errorMessage}</p>
    )}
    forceLogin={true}
    usePopup={true}
    unauthenticatedComponent={(
        <p>Please login before viewing this page.</p>
    )}
>
    <p>The user is logged in.</p>
</AuthenticatedComponent>
```

#### UnauthenticatedComponent

React component class whose contents are only viewable when the user is not logged in.

```js
<UnauthenticatedComponent>
    <h3>Please use the login button above.</h3>
</UnauthenticatedComponent>
```

#### useHandleRedirect

React hook to receive the response from redirect operations (wrapper around `handleRedirectPromise`).

TODO: Error handling

```js
export function RedirectPage() {
    const [ redirectResult ] = useHandleRedirect();

    return (
        <div>
            {redirectResult ? (
                <div>
                    <p>Redirect response:</p>
                    <pre>{JSON.stringify(redirectResult, null, 4)}</pre>
                </div>
            ) : (
                <p>This page is not returning from a redirect operation.</p>
            )}
        </div>
    )
}
```
