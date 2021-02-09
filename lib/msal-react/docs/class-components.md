# Using msal-react with class components

`msal-react` does support both function components and class components. However, you will not be able to use `msal-react` hooks inside your class components so if you need access to authentication state inside your class component you will need to use `msal-browser` directly to obtain similar functionality.

## Initialization

Just like when using function components you will need an `MsalProvider` component at the top level of the component tree that requires access to authentication state.

```javascript
import React from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

class App extends React.Component {
    render() {
        return (
            <MsalProvider instance={pca}>
                <YourAppComponents>
            </ MsalProvider>
        );
    }
}
```

## Protecting Components

Just like when using function components you can use the `AuthenticatedTemplate`, `UnauthenticatedTemplate` and `MsalAuthenticationTemplate` to conditionally render your components.

```javascript
import React from "react";
import { MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, MsalAuthenticationTemplate } from "@azure/msal-react";
import { PublicClientApplication, InteractionType } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

class App extends React.Component {
    render() {
        return (
            <MsalProvider instance={pca}>
                <AuthenticatedTemplate>
                    <span>This will only render for authenticated users</span>
                </ AuthenticatedTemplate>
                <UnauthenticatedTemplate>
                    <span>This will only render for unauthenticated users</span>
                </ UnauthenticatedTemplate>
                <MsalAuthenticationTemplate interactionType={InteractionType.Popup}>
                    <span>This will only render for authenticated users.</span>
                </ MsalAuthenticationTemplate>
            </ MsalProvider>
        );
    }
}
```

## Accessing msal-react context in a class component

Since you can't use the `useMsal` hook to access the [msal-react context](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_react.imsalcontext.html) in a class component you have 2 other options. You can either use the raw context directly or you can use the `withMsal` higher order component to inject the context into your component's props.

### Accessing raw context

```javascript
import React from "react";
import { MsalProvider, MsalContext } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

class App extends React.Component {
    render() {
        return (
            <MsalProvider instance={pca}>
                <YourClassComponent/>
            </ MsalProvider>
        );
    }
}

class YourClassComponent extends React.Component {
    static contextType = MsalContext;

    render() {
        const isAuthenticated = this.context.accounts.length > 0;
        if (isAuthenticated) {
            return <span>There are currently {this.context.accounts.length} users signed in!</span>
        }
    }
}
```

### Accessing via withMsal HOC

```javascript
import React from "react";
import { MsalProvider, withMsal } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

class YourClassComponent extends React.Component {
    render() {
        const isAuthenticated = this.props.msalContext.accounts.length > 0;
        if (isAuthenticated) {
            return <span>There are currently {this.props.msalContext.accounts.length} users signed in!</span>
        }
    }
}

const YourWrappedComponent = withMsal(YourClassComponent);

class App extends React.Component {
    render() {
        return (
            <MsalProvider instance={pca}>
                <YourWrappedComponent />
            </ MsalProvider>
        );
    }
}
```

## Logging in using a class component

Regardless of which approach you take to get the `msal-react` context the usage will be the same. Once you have the context object you can invoke [any of the APIs](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_browser.ipublicclientapplication.html) on `PublicClientApplication`, inspect the accounts signed in, or determine if authentication is currently in progress.

The following examples will show how to login using the `withMsal` HOC approach but you can quickly adapt to the other approach if needed.

**Note**: By now you should be aware that an `MsalProvider` component must be rendered at any level above any component that uses context, the examples below will assume there is a provider and will not demonstrate this.

### Logging in as a result of clicking a button

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

### Logging in on page load

```javascript
import React from "react";
import { withMsal } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";

class ProtectedComponent extends React.Component {
    callLogin() {
        const isAuthenticated = this.props.msalContext.accounts.length > 0;
        const msalInstance = this.props.msalContext.instance;

        // If a user is not logged in and authentication is not already in progress, invoke login
        if (!isAuthenticated && this.props.msalContext.inProgress === InteractionStatus.None) {
            msalInstance.loginPopup();
        }
    }
    componentDidMount() {
        this.callLogin();
    }

    componentDidUpdate() {
        this.callLogin();
    }
    
    render() {
        const isAuthenticated = this.props.msalContext.accounts.length > 0;
        if (isAuthenticated) {
            return <span>User is authenticated</span>
        } else {
            return <span>Authentication in progress</span>;
        }
    }
}

export default YourWrappedComponent = withMsal(ProtectedComponent);
```