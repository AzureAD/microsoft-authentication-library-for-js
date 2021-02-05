# FAQ

***
**[Compatibility](#compatibility)**

1. [What versions of React are supported](#what-versions-of-React-are-supported)
1. [Does msal-react support Server Side Rendering (SSR) or static site generation](#does-msal-react-support-Server-Side-Rendering-SSR-or-static-site-generation)
1. [Does msal-react support class components](#does-msal-react-support-class-components)

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What versions of React are supported?

React versions 16 and 17 are supported.

### Does msal-react support Server Side Rendering (SSR) or static site generation?

Yes! However, authentication cannot be done server side and you should avoid invoking msal APIs server side. `msal-react` abstracts some of this logic away from you but if you are building custom authentication logic please ensure all APIs are invoked when rendered in the browser. You can take a look at our [Next.js sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample) and [Gatsby sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample) for examples.

### Does msal-react support class components?

Yes, `msal-react` supports both function and class components. Hooks, however, cannot be used in class components so you will need to consume the msal context and use the APIs provided by `msal-browser` to build equivalent logic. More information about using `msal-react` in class components can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md).

## What if my question has not been answered?

First check the `msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `msal-react` is a wrapper around `msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
