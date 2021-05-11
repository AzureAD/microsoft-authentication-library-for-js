# FAQ

***
**[Compatibility](#compatibility)**

1. [What browsers are supported?](#what-browsers-are-supported)
1. [What versions of React are supported?](#what-versions-of-React-are-supported)
1. [Does @azure/msal-react support Server Side Rendering (SSR) or static site generation?](#does-azuremsal-react-support-Server-Side-Rendering-SSR-or-static-site-generation)
1. [Does @azure/msal-react support class components?](#does-azuremsal-react-support-class-components)

**[Authentication](#authentication)**

1. [How do I handle the redirect flow in a react app?](#how-do-i-handle-the-redirect-flow-in-a-react-app)
1. [What can I do outside of @azure/msal-react context?](#what-can-i-do-outside-of-azuremsal-react-context)

**[B2C](#B2C)**

1. [How do I handle the forgot password flow in a react app?](#how-do-i-handle-the-forgot-password-flow-in-a-react-app)

**[Errors](#errors)**

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What browsers are supported?

Please see [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#what-browsers-are-supported-by-msaljs) for supported browsers.

### What versions of React are supported?

React versions 16 and 17 are supported.

### Does `@azure/msal-react` support Server Side Rendering (SSR) or static site generation?

Yes! However, authentication cannot be done server side and you should avoid invoking msal APIs server side. `@azure/msal-react` abstracts some of this logic away from you but if you are building custom authentication logic please ensure all APIs are invoked when rendered in the browser. You can take a look at our [Next.js sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample) for examples.

### Does `@azure/msal-react` support class components?

Yes, `@azure/msal-react` supports both function and class components. Hooks, however, cannot be used in class components so you will need to consume the msal context and use the APIs provided by `@azure/msal-browser` to build equivalent logic. More information about using `@azure/msal-react` in class components can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md).

## Authentication

### How do I handle the redirect flow in a react app?

If you've used `@azure/msal-browser` or `msal` v1 in the past, you may be used to calling `handleRedirectCallback` or `handleRedirectPromise` on page load to handle the response of a redirect. In `@azure/msal-react` this is done under the hood and you should not call `handleRedirectPromise`on your own. For the most part, redirects should just work. However, if you need direct access to the response object you can use the [event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/events.md) to register a callback that will be invoked with the response when you return to your app. If you're using the `useMsalAuthentication` hook, it does this under the hood and should return the result/error.

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
