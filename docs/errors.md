# Errors

***

**[BrowserConfigurationAuthErrors](#Browserconfigurationautherrors)**

1. [stubbed_public_client_application_called](#stubbed_public_client_application_called)

**[BrowserAuthErrors](#browserautherrors)**

1. [interaction_in_progress](#interaction_in_progress)

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

## BrowserAuthErrors

### Interaction_in_progress

**Error Message**: Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

This error is thrown when using redirects because `handleRedirectPromise()` has not had a chance to resolve before an interaction API, such as `loginRedirect()` or `acquireTokenRedirect()`, is called. 

✔️ You should wait for `handleRedirectPromise()` to resolve before calling any interactive API:

```javascript
msalInstance.handleRedirectPromise()
    .then((tokenResponse) => {
        if (resp !== null) {
            // Successful authentication redirect
            msalInstance.acquireTokenRedirect(request);
        } else {
            // Not coming back from an auth redirect
            msalInstance.loginRedirect(loginRequest); // To login on page load
        }
    })
    .catch(err => {
        // Handle error
        console.error(err);
    });
```

Please see our wrapper library FAQs for additional reasons you may be having this error: [`msal-react` FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/FAQ.md), [`msal-angular` FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md).

**Troubleshooting**: 
- Refresh the page: if refreshing the browser clears the message, this indicates that MSAL may not be clearing the message at the right time.
- Check if interaction is being called on a page which the app is redirecting to. Ensure that you are allowing `handleRedirectPromise()` to resolve. 

## Other

Errors not thrown by msal, such as server errors

### Access to fetch at [url] has been blocked by CORS policy

This error occurs with MSAL.js v2.x and is due to improper configuration during **App Registration** on **Azure Portal**. In particular, you should not have both `Web` and `Single-page application` added as a platform under the **Authentication** blade in your App Registration.
