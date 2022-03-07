# FAQ

***
**[Compatibility](#compatibility)**

1. [What browsers are supported?](#what-browsers-are-supported)
1. [What versions of React are supported?](#what-versions-of-React-are-supported)
1. [Does @azure/msal-react support Server Side Rendering (SSR) or static site generation?](#does-azuremsal-react-support-Server-Side-Rendering-SSR-or-static-site-generation)
1. [Does @azure/msal-react support class components?](#does-azuremsal-react-support-class-components)
1. [Can @azure/msal-react be used with Microsoft Graph JavaScript SDK?](#can-azuremsal-react-be-used-with-microsoft-graph-javascript-sdk)

**[Authentication](#authentication)**

1. [How do I handle the redirect flow in a react app?](#how-do-i-handle-the-redirect-flow-in-a-react-app)
1. [What can I do outside of @azure/msal-react context?](#what-can-i-do-outside-of-azuremsal-react-context)
1. [How do I implement self-service sign-up?](#how-do-i-implement-self-service-sign-up)

**[B2C](#B2C)**

1. [How do I handle the forgot password flow in a react app?](#how-do-i-handle-the-forgot-password-flow-in-a-react-app)

**[Errors](#errors)**

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What browsers are supported?

Please see [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#what-browsers-are-supported-by-msaljs) for supported browsers.

### What versions of React are supported?

React versions 16.8.0+, 17 and 18 are supported.

### Does `@azure/msal-react` support Server Side Rendering (SSR) or static site generation?

Yes! However, authentication cannot be done server side and you should avoid invoking msal APIs server side. `@azure/msal-react` abstracts some of this logic away from you but if you are building custom authentication logic please ensure all APIs are invoked when rendered in the browser. You can take a look at our [Next.js sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample) for examples.

### Does `@azure/msal-react` support class components?

Yes, `@azure/msal-react` supports both function and class components. Hooks, however, cannot be used in class components so you will need to consume the msal context and use the APIs provided by `@azure/msal-browser` to build equivalent logic. More information about using `@azure/msal-react` in class components can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md).

## Can @azure/msal-react be used with Microsoft Graph JavaScript SDK?

Yes, `@azure/msal-react` can be used as a custom authentication provider for the [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript). For an implementation, please refer to the sample: [React SPA calling Graph API](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/2-Authorization-I/1-call-graph).

## Authentication

### How do I handle the redirect flow in a react app?

If you've used `@azure/msal-browser` or `msal` v1 in the past, you may be used to calling `handleRedirectCallback` or `handleRedirectPromise` on page load to handle the response of a redirect. In `@azure/msal-react` this is done under the hood and you do not need to call `handleRedirectPromise`on your own. After calling `loginRedirect` or `acquireTokenRedirect` you'll be redirected to the AAD sign in page and after entering your credentials you'll be redirected back to your app which should now show that a user is signed in. Since this is a new, clean instance of your application the actual response object cannot be returned to the original `loginRedirect` API call. Instead there are a few ways you can get what you need:

If you just need an id or access token we recommend calling the `acquireTokenSilent` API right before you need the token. Be sure to check that a user is signed in and interaction isn't in progress before you attempt to retrieve the token. If the previous redirect operation was successful `acquireTokenSilent` will return the tokens from the cache.

```javascript
const GetDataFromAPI = () => {
    const { instance, accounts, inProgress } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [graphData, setGraphData] = useState(null);

    useEffect(() => {
        if (isAuthenticated && inProgress === InteractionStatus.None) {
            instance.acquireTokenSilent({
                account: accounts[0],
                scopes: ["User.Read"]
            }).then(response => {
                callAPI(response.accessToken);
            })
        }
    }, [inProgress, isAuthenticated, accounts, instance]);
};
```

If you need direct access to the response object or error returned by a redirect operation there are 3 ways you can do this:

1. Use the [event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/events.md) to register a callback that will be invoked with the response when you return to your app. Make sure this is registered in a code path that is run __after__ the redirect as any callbacks registered __before__ the redirect will be lost.
1. Use the [useMsalAuthentication hook](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md#usemsalauthentication-hook) to login. This hook will return the result or error when you are returned to your app.
1. Call `handleRedirectPromise` which will resolve with the result or reject with an error if the page was loaded as a result of a redirect.

### What can I do outside of `@azure/msal-react` context?

The short answer is that all components in your app that need access to msal APIs should be rendered underneath an `MsalProvider` component ensuring your components have access to the msal context. However, there may be scenarios where it makes more sense to have a utility function outside your component tree to handle acquiring access tokens or determine whether or not a user is signed in. This is fine to do as long as you are not calling APIs that may **change** the user's logged in state or trigger interaction.

This means the following APIs are off-limits outside the context of `MsalProvider`:

- `loginPopup`
- `loginRedirect`
- `handleRedirectPromise`
- `ssoSilent`
- `logout`
- `acquireTokenPopup`
- `acquireTokenRedirect`

**Note:** If you do choose to use any other `@azure/msal-browser` API outside of the react context you should still use the same `PublicClientApplication` instance you pass into `MsalProvider`.

## How do I implement self-service sign-up?
MSAL React supports self-service sign-up in the auth code flow. Please see our docs [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) for supported prompt values in the request and their expected outcomes, and [here](http://aka.ms/s3u) for an overview of self-service sign-up and configuration changes that need to be made to your Azure tenant. Please note that that self-service sign-up is not available in B2C and test environments.

## B2C

### How do I handle the forgot password flow in a react app?

The [new password reset experience](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended) is now part of the sign-up or sign-in policy. When the user selects the **Forgot your password?** link, they are immediately sent to the Forgot Password experience. You don't need a separate policy for password reset anymore.

Our recommendation is to move to the new password reset experience since it simplifies the app state and reduces error handling on the user-end. If for some reason you have to use the legacy forgot password flow, you'll have to handle the `AADB2C90118` error response returned from B2C service when a user selects the **Forgot your password?** link, and call login again with your forgot password policy.

If you're using the `useMsalAuthentication` hook to login you can inspect the error returned and invoke the login callback with a new request object.

```javascript
function Example() {
    const { result, error, login } = useMsalAuthentication(InteractionType.Popup);

    useEffect(() => {
        if (error && error.errorMessage.indexOf("AADB2C90118") > -1) {
            const request = {
                authority: "your-b2c-authority/your-password-reset-policy"
            }
            login(InteractionType.Popup, request)
        }
    }, [error]);
}
```

If you're using the `MsalAuthenticationTemplate` or you're calling one of the login APIs directly you should use the [event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/events.md) to catch the error and handle it.

```javascript
function Example() {
    const { instance } = useMsal();

    useEffect(() => {
        const callbackId = instance.addEventCallback((event) => {
            if (event.eventType === EventType.LOGIN_FAILURE) {
                if (event.error && event.error.errorMessage.indexOf("AADB2C90118") > -1) {
                    if (event.interactionType === InteractionType.Redirect) {
                        instance.loginRedirect(forgotPasswordRequest);
                    } else if (event.interactionType === InteractionType.Popup) {
                        instance.loginPopup(forgotPasswordRequest).catch(e => {
                            return;
                        });
                    }
                }
            }
        });

        return () => {
            if (callbackId) {
                instance.removeEventCallback(callbackId);
            }
        };
    }, []);
}
```

## Errors

If you have questions about specific errors you are receiving please see the following documents detailing some of the common errors:

- [`@azure/msal-browser` error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md)
- [`@azure/msal-react` error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react/docs/errors.md)

## What if my question has not been answered?

First check the `@azure/msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `@azure/msal-react` is a wrapper around `@azure/msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `@azure/msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
