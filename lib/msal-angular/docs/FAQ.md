# Msal-angular FAQ

***
**[Compatibility](#compatibility)**

1. [What versions of Angular are supported?](#what-versions-of-angular-are-supported)
1. [Does msal-react support Server Side Rendering (SSR) or static site generation?](#does-msal-angular-support-server-side-rendering)
1. [Can msal-angular be used with Internet Explorer?](#can-msal-angular-be-used-with-internet-explorer)

**[Configuration](#configuration)**

1. [How do I add tokens to API calls?](#how-do-i-add-tokens-to-api-calls)

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What versions of Angular are supported?

Msal Angular currently supports Angular 9, 10, and 11.

### Does msal-angular support Server Side Rendering?

Yes, server side rendering is supported through Angular universal. See our doc [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/angular-universal.md) for more information.

### Can msal-angular be used with Internet Explorer?

Yes, Msal Angular does support IE 11. More information can on configuration can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/ie-support.md).

## Configuration

### How do I add tokens to API calls?

Msal Angular provides the `MsalInterceptor` for obtaining tokens and adding them to HTTP requests. The `protectedResourceMap` is part of the `MsalInterceptorConfiguration` object, and can be configured with endpoints and scopes, passed as `Map<string, Array<string>>`.

Things to note about the `protectedResourceMap`:
- Using `*` for wildcards is supported, but the first match will be used. Hence, the order of resources in the `protectedResourceMap` matters.
- Passing a `null` scope ensures that no tokens are obtained for the particular endpoint. You can pass null to make sure an endpoint is unprotected.
- Relative paths may need to be used if relative paths are used in your application. This also applies to issues that may arise with `ngx-translate`. Relative paths should not have a leading slash.

See our [initialization doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls) for more information on setting this up, our [upgrade guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/1.x-2.x-upgrade-guide.md#protected-resources) for differences to Msal Angular 1.x, and our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/5cc21a95a389c31a0d5e74d37ff297931aeee479/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app.module.ts#L47) for examples of usage. 

Please note that using the MsalInterceptor is optional and you can write your own interceptor if you choose to. Alternatively, you can also explicitly acquire tokens using the acquireToken APIs.

## What if my question has not been answered?

First check the `msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `msal-angular` is a wrapper around `msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
