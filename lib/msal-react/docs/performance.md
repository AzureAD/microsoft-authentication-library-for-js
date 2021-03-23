# Performance

## How to configure `@azure/msal-react` to use your router's navigate function for client-side navigation

By default, when msal.js needs to navigate from one page in your application to another it will reassign `window.location`, causing a full frame redirect to the other page and causing your application to re-render. If you're using a router this may be undesireable since many routers provide a method you can use to do "client-side" navigation and re-render only the parts of the page that need to be re-rendered.

Currently there is one scenario where msal.js will navigate from one page in your application to another. If your application is doing **all** of the following things, continue reading:

- Your application is using the redirect flow, instead of the popup flow, to login
- `PublicClientApplication` is configured with `auth.navigateToLoginRequestUrl: true` (default)
- Your application has pages that may call `loginRedirect`/`acquireTokenRedirect` with a shared `redirectUri` i.e. You call `loginRedirect` from `http://localhost/protected` with a redirectUri of `http://localhost`

If your application is doing all of the things above you can override the method Msal uses to navigate by creating your own implementation of `INavigationClient` and calling `setNavigationClient` on your `PublicClientApplication` instance before rendering `MsalProvider`.

**Note:** We recommend `MsalProvider` is rendered above your `Route` components and your `navigateInternal` function returns `false`. When `navigateInternal` returns false the tokens will be processed immediately after navigation. If `MsalProvider` is re-rendered as a result of navigation, your `navigateInternal` function should return `true` so that tokens are processed as a part of the re-render.

### Example Implementation

Each router has their own method for doing client-side navigation and depending on how they expose the method you may need to refactor your application to support this feature. The example below will show how to implement this for `react-router-dom`. You can find a full sample apps that implement this for [react-router-dom](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample), [Next.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample).

#### INavigationClient Implementation

```javascript
import { NavigationClient } from "@azure/msal-browser";

/**
 * Extending the default NavigationClient allows you to overwrite just navigateInternal while continuing to use the default navigateExternal function
 * If you would like to overwrite both you can implement INavigationClient directly instead
 */
class CustomNavigationClient extends NavigationClient{
    constructor(history) {
        super();
        this.history = history // Passed in from useHistory hook provided by react-router-dom;
    }
    
    // This function will be called anytime msal needs to navigate from one page in your application to another
    async navigateInternal(url, options) {
        // url will be absolute, you will need to parse out the relative path to provide to the history API
        const relativePath = url.replace(window.location.origin, '');
        if (options.noHistory) {
            this.history.replace(relativePath);
        } else {
            this.history.push(relativePath);
        }

        return false;
    }
}
```

#### Providing your custom NavigationClient to `@azure/msal-browser`

```javascript
import { MsalProvider } from "@azure/msal-react";
import { Router, Switch, Route, useHistory } from "react-router-dom";

function App({ msalInstance }) {
    // It's important that the Router component is above the Example component because you'll need to use the useHistory hook before rendering MsalProvider
    return (
        <Router>
            <Example msalInstance={msalInstance}/>
        </Router>
    );
};

function Example({ msalInstance }) {
    const history = useHistory();
    const navigationClient = new CustomNavigationClient(history);
    msalInstance.setNavigationClient(navigationClient);

    return (
        <MsalProvider instance={msalInstance}>
            <Switch>
                <Route path="/protected">
                    <ProtectedRoute />
                </Route>
                <Route path="/">
                    <Home />
                </Route>
            </Switch>
        </MsalProvider>
    )
}
```
