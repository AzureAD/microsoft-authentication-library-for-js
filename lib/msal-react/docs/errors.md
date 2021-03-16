# Errors

***

**[BrowserConfigurationAuthErrors](#Browserconfigurationautherrors)**

1. [stubbed_public_client_application_called](#stubbed_public_client_application_called)

**[BrowserAuthErrors](#browserautherrors)**

1. [interaction_in_progress](#interaction_in_progress)

**[Additional Errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md)**

***

## BrowserConfigurationAuthErrors

### stubbed_public_client_application_called

**Error Message**: Stub instance of Public Client Application was called. If using `@azure/msal-react`, please ensure context is not used without a provider.

When using `@azure/msal-react` this error is thrown when you try to use an msal component or hook without an `MsalProvider` higher up in the component tree. All hooks and components make use of the [React Context API](https://reactjs.org/docs/context.html) and require a provider.

❌ The following example will throw this error because the `useMsal` hook is used outside the context of `MsalProvider`:

```javascript
import { useMsal, MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

function App() {
    const { accounts } = useMsal();

    return (
        <MsalProvider instance={pca}>
            <YourAppComponent>
        </ MsalProvider>
    )
}
```

✔️ To resolve the error you should refactor the code above so that the `useMsal` hook is called in a component underneath `MsalProvider`:

```javascript
import { useMsal, MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";

const pca = new PublicClientApplication(config);

function ExampleComponent () {
    const { accounts } = useMsal();

    return <YourAppComponent />;
};

function App() {
    return (
        <MsalProvider instance={pca}>
            <ExampleComponent />
        </ MsalProvider>
    )
}
```

## BrowserAuthErrors

### Interaction_in_progress

**Error Message**: Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

This error is thrown when an interactive API (`loginPopup`, `loginRedirect`, `acquireTokenPopup`, `acquireTokenRedirect`) is invoked while another interactive API is still in progress. The login and acquireToken APIs are async so you will need to ensure that the resulting promises have resolved before invoking another one.

In `@azure/msal-react` there are 2 scenarios when this can happen:

1. Your application is calling one of the above APIs outside of the context where you do not have access to the `inProgress` state. For more about context see the [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/FAQ.md#what-can-i-do-outside-of-msal-react-context)
1. Your application is calling one of the above APIs without first checking if interaction is already in progress elsewhere.

❌ The following example will throw this error when another component has already invoked an interactive API that is in progress:

```javascript
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { useEffect } from "react";

export function exampleComponent() {
    const { instance } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    useEffect(() => {
        if (!isAuthenticated) {
            // If another component has already invoked an interactive API this will throw
            await instance.loginPopup();
        }
    }, [isAuthenticated, instance]);
}
```

✔️ To fix the previous example, check that no other interaction is in progress before invoking `loginPopup`:

```javascript
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { useEffect } from "react";

export function exampleComponent() {
    const { instance, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();

    useEffect(() => {
        if (!isAuthenticated && inProgress === InteractionStatus.None) {
            await instance.loginPopup();
        }
    }, [isAuthenticated, inProgress, instance]);
}
```

#### Troubleshooting Steps

- [Enable verbose logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#using-the-config-object) and trace the order of events. Verify that an interactive API is not invoked before another has resolved. If using the redirect flow make sure `handleRedirectPromise` has resolved (done in the `MsalProvider`).

If you are unable to figure out why this error is being thrown please [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and be prepared to share the following information:

- Verbose logs
- A sample app and/or code snippets that we can use to reproduce the issue
- Refresh the page. Does the error go away?
- Open your application in a new tab. Does the error go away?
