# Performance

## How to configure `msal-react` to use your router's navigate function for client-side navigation

By default, when msal.js needs to navigate from one page in your application to another it will reassign `window.location`, causing a full frame redirect to the other page and causing your application to re-render. If you're using a router this may be undesireable since many routers provide a method you can use to do "client-side" navigation and re-render only the parts of the page that need to be re-rendered.

Currently there is one scenario where msal.js will navigate from one page in your application to another. If your application is not doing one or more of the following things you do not need to continue reading:

- Your application is using the redirect flow, instead of the popup flow, to login
- `PublicClientApplication` is configured with `auth.navigateToLoginRequestUrl: true` (default)
- Your application has pages that may call `loginRedirect`/`acquireTokenRedirect` with a shared `redirectUri` i.e. You call `loginRedirect` from `http://localhost/protected` with a redirectUri of `http://localhost`

If your application is doing all of the things above you can provide your router's `navigate` method to `MsalProvider`. You'll need to provide `MsalProvider` with a separate `config` object with a `clientSideNavigate` callback which will be invoked when msal.js needs to navigate to a different page in your application. The callback is async and will be called with the relative path, query string and hash that needs to be navigated to. You should handle navigation and return when the navigation is complete.

**Note:** After your callback returns, msal will process your tokens from the response. If `MsalProvider` is re-rendered as a result of navigation, you may not get the behavior you are expecting. To prevent this, make sure `MsalProvider` is above your `Route` components and your `clientSideNavigate` function does not reload the page.

### Example Implementation

Each router has their own method for doing client-side navigation and depending on how they expose the method you may need to refactor your application to support this feature. The example below will show how to implement this for `react-router-dom`. You can find a full sample apps that implement this for [react-router-dom](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample), [Next.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample).

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

    const config = {
        clientSideNavigate: async (path, search, hash) => {
            history.push(path);
        }
    }

    return (
        <MsalProvider instance={msalInstance} config={config}>
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
