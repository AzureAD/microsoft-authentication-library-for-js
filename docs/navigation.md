# Intercepting or Overriding Window Navigation

By default `msal-browser` uses `window.location.assign` and `window.location.replace` to redirect your application to external urls, such as the sign-in or sign-out pages, and internal urls, other pages in your app after returning from an external redirect. There may be situations, however, where you would like to override the default behavior with your own. For example, frameworks like React and Angular provide different APIs to handle client-side navigation without reloading the entire SPA. `msal-browser` exposes both the `INavigationClient` interface as well as the `NavigationClient` default implementation for you to provide your own custom implementation.

## Writing your own implemenation

The interface contains 2 methods:

- `navigateInternal` - Called when redirecting between pages in your app e.g. redirecting from the `redirectUri` back to the page that initiated the login
- `navigateExternal` - Called when redirecting to urls external to your app e.g. AAD Sign-in prompt

You can choose to provide custom implementations of both by implementing `INavigationClient`:

```javascript
class CustomNavigationClient implements INavigationClient {
    async navigateInternal(url, options) {
        // Your custom logic
    }

    async navigateExternal(url, options) {
        // Your custom logic
    }
}
```

Alternatively, if you just need to override one method you can extend the default `NavigationClient`:

```javascript
class CustomNavigationClient extends NavigationClient {
    async navigateInternal(url, options) {
        // Your custom logic
    }

    // navigateExternal will use the default
}
```

**Note:** When providing your own implementation of `navigateInternal` you should not navigate to a different domain as this can break your authentication flow. It is intended only to be used for navigation to pages on the same domain.

### Function Parameters

- `url`: The URL MSAL.js would like to navigate to. This will be an absolute url. If you need a relative url it is your responsibility to parse this out.
- `options`: Will contain additional information about the navigation you may find useful such as; the ApiId of the function attempting to invoke navigation, a suggested timeout value and whether or not this navigation should be added to your browser history. You do not need to use any of these values but they are provided for your convenience.

### Return Values

Both functions are async and should return a promise that resolves to boolean `true`/`false`. In most cases you should return `true`.

Return `true` if:

- The function will cause the page to fully redirect to another page, such as going to the AAD sign-in page or reassigning the window object
- The function will directly or indirectly cause `PublicClientApplication` to reinitialize or `handleRedirectPromise` to run again

Return `false` if:

- The function will not cause the page to redirect or reload, for example when extracting the url and navigating to it in a different window
- The function will invoke client-side navigation to re-render a part of the page that does not reinitialize `PublicClientApplication` or call `handleRedirectPromise` again

## Providing your custom implementation to `PublicClientApplication`

Once you have written your custom class you provide an instance of it on the config you pass to `PublicClientApplication`:

```javascript
const navigationClient = new CustomNavigationClient();

const config: Configuration = {
    auth: {
        clientId: "your-client-id"
    },
    system: {
        navigationClient: navigationClient
    }
};

const msalInstance = new PublicClientApplication(config);
```

In some cases, like in React or Angular, you may need to provide your custom class after initialization. You can do this by calling the `setNavigationClient` API:

```javascript
const config: Configuration = {
    auth: {
        clientId: "your-client-id"
    }
};

const msalInstance = new PublicClientApplication(config);
const navigationClient = new CustomNavigationClient();
msalInstance.setNavigationClient(navigationClient);
```

## Examples

If you'd like to see end to end examples of providing a custom `NavigationClient` check out our [react samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples).
