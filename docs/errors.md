# Errors

***

**[BrowserConfigurationAuthErrors](#Browserconfigurationautherrors)**

1. [stubbed_public_client_application_called](#stubbed_public_client_application_called)

**[Other](#other)**

1. [Access to fetch at [url] has been blocked by CORS policy](#Access-to-fetch-at-[url]-has-been-blocked-by-CORS-policy)

***

## BrowserConfigurationAuthErrors

### stubbed_public_client_application_called

**Error Message**: Stub instance of Public Client Application was called. If using msal-react, please ensure context is not used without a provider.

When using `msal-react` this error is thrown when you try to use an msal component or hook without an `MsalProvider` higher up in the component tree. All `msal-react` hooks and components make use of the [React Context API](https://reactjs.org/docs/context.html) and require a provider.

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

## Other

Errors not thrown by msal, such as server errors

### Access to fetch at [url] has been blocked by CORS policy

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should not have both `Web` and `Single-page application` added as a platform under the **Authentication** blade in your App Registration.
