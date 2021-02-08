# FAQ

***
**[Compatibility](#compatibility)**

1. [What versions of React are supported](#what-versions-of-React-are-supported)
1. [Does msal-react support Server Side Rendering (SSR) or static site generation](#does-msal-react-support-Server-Side-Rendering-SSR-or-static-site-generation)
1. [Does msal-react support class components](#does-msal-react-support-class-components)

**[Authentication](#authentication)**

1. [How do I handle the redirect flow in a react app?](#how-do-i-handle-the-redirect-flow-in-a-react-app)

**[B2C](#B2C)**

1. [How do I handle the forgot password flow in a react app?](#how-do-i-handle-the-forgot-password-flow-in-a-react-app)

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What versions of React are supported?

React versions 16 and 17 are supported.

### Does msal-react support Server Side Rendering (SSR) or static site generation?

Yes! However, authentication cannot be done server side and you should avoid invoking msal APIs server side. `msal-react` abstracts some of this logic away from you but if you are building custom authentication logic please ensure all APIs are invoked when rendered in the browser. You can take a look at our [Next.js sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample) for examples.

### Does msal-react support class components?

Yes, `msal-react` supports both function and class components. Hooks, however, cannot be used in class components so you will need to consume the msal context and use the APIs provided by `msal-browser` to build equivalent logic. More information about using `msal-react` in class components can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md).

## Authentication

### How do I handle the redirect flow in a react app?

If you've used `msal-browser` or `msal` v1 in the past, you may be used to calling `handleRedirectCallback` or `handleRedirectPromise` on page load to handle the response of a redirect. In `msal-react` this is done under the hood and you should not call `handleRedirectPromise`on your own. For the most part, redirects should just work. However, if you need direct access to the response object you can use the [event API](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/events.md) to register a callback that will be invoked with the response when you return to your app. If you're using the `useMsalAuthentication` hook, it does this under the hood and should return the result/error.

## B2C

### How do I handle the forgot password flow in a react app?

When a user clicks the "forgot password" link on the B2C sign in page, B2C will return a specific error stating that the user would like to reset their password. It is your app's responsibility to catch this error and call login again with your forgot password policy.

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

## What if my question has not been answered?

First check the `msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `msal-react` is a wrapper around `msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
