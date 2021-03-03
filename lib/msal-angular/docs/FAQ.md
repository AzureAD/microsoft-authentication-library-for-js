# Msal-angular FAQ

***
**[Compatibility](#compatibility)**

1. [What versions of Angular are supported?](#what-versions-of-angular-are-supported)
1. [Does msal-angular support Server Side Rendering?](#does-msal-angular-support-server-side-rendering)
1. [Can msal-angular be used with Internet Explorer?](#can-msal-angular-be-used-with-internet-explorer)

**[Configuration](#configuration)**

1. [How do I add tokens to API calls?](#how-do-i-add-tokens-to-api-calls)

**[Usage](#usage)**

1. [How do I get accounts?](#how-do-i-get-accounts)
1. [How do I get and set active accounts?](#how-do-i-get-and-set-active-accounts)
1. [Why is my app looping when logging in with redirect?](#why-is-my-app-looping-when-logging-in-with-redirect)

**[Errors](#errors)**

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

## Usage

### How do I get accounts?

The `msal-browser` instance used by msal-angular exposes multiple methods for getting account information. We recommend using `getAllAccounts()` to get all accounts, and `getAccountByHomeId()` and `getAccountByLocalId()` to get specific accounts. Note that while `getAccountByUsername()` is available, it should be a secondary choice, as it may be less reliable and is for convenience only. See the [msal-browser docs](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html) for more details on account methods.

We recommend subscribing to the `inProgress$` subject before retrieving account information. This ensures that all interactions have completed before getting account information. See [our sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts#L27) for an example of this use.

### How do I get and set active accounts?

The `msal-browser` instance exposes `getActiveAccount()` and `setActiveAccount()` for active accounts. 

We recommend subscribing to the `inProgress$` subject and filtering for `none` before retrieving account information with `getActiveAccount()`. This ensures that all interactions have completed before getting account information. 

We recommend setting the active account:

- After any action that may change the account, especially if your app uses multiple accounts. See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/home/home.component.ts#L23) for an example of setting the account after a successful login.
- On initial page load. Wait until all interactions are complete (by subscribing to the `inProgress$` subject and filtering for `none`), check if there is an active account, and if there is none, set the active account. This could be the first account retrieved by `getAllAccounts()`, or other account selection logic required by your app. See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app) for an example of checking and setting the active account on page load.

**Note:** Currently, active accounts are for each page load and do not persist. While this is an enhancement we are looking to make, we recommend that you set the active account for each page load.

Our [Angular 11](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app) sample demonstrates basic usage. Your app may require more complicated logic to choose accounts.

### Why is my app looping when logging in with redirect?

One of the common reasons your app may be looping while logging in with redirects is due to improper usage of the `loginRedirect()` API. We recommend that you do not call `loginRedirect()` in the `ngOnInit` in the `app.component.ts`, as this will attempt to log in with every page load, often before any redirect has finished processing. 

We recommend that all redirects are handled with the `MsalRedirectComponent` (see docs [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md)), and that any interaction or account validation should be done after  subscribing to the `inProgress$` subject and filtering for none. Please see our [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/30b5ff95e2ff2cc827d98118004d92968bb67b3f/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app.component.ts#L27) for an example. 

## Errors

If you have questions about specific errors you are receiving please see the following documents detailing some of the common errors:

- [msal-browser error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md)
- [msal-angular error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md)

## What if my question has not been answered?

First check the `msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `msal-angular` is a wrapper around `msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
