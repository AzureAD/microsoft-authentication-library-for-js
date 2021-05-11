# MSAL Angular FAQ

***
**[Compatibility](#compatibility)**

1. [What browsers are supported?](#what-browsers-are-supported)
1. [What versions of Angular are supported?](#what-versions-of-angular-are-supported)
1. [Does `@azure/msal-angular` support Server Side Rendering?](#does-azuremsal-angular-support-server-side-rendering)
1. [Can `@azure/msal-angular` be used with Internet Explorer?](#can-azuremsal-angular-be-used-with-internet-explorer)

**[Configuration](#configuration)**

1. [What is the difference between `@azure/msal-angular` v2 and v1?](#what-is-the-difference-between-azuremsal-angular-v2-and-v1)
1. [How do I add tokens to API calls?](#how-do-i-add-tokens-to-api-calls)
1. [How do I use my app with path/hash location strategy?](#how-do-i-use-my-app-with-pathhash-location-strategy)

**[Usage](#usage)**

1. [How do I secure routes?](#how-do-i-secure-routes)
1. [How do I get accounts?](#how-do-i-get-accounts)
1. [How do I get and set active accounts?](#how-do-i-get-and-set-active-accounts)
1. [How do I log users in when they hit the application?](#how-do-i-log-users-in-when-they-hit-the-application)
1. [Why is my app looping when logging in with redirect?](#why-is-my-app-looping-when-logging-in-with-redirect)

**[Errors](#errors)**

**[What if my question has not been answered?](#what-if-my-question-has-not-been-answered)**

***

## Compatibility

### What browsers are supported?

Please see [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md#what-browsers-are-supported-by-msaljs) for supported browsers.

### What versions of Angular are supported?

Msal Angular currently supports Angular 9, 10, 11, and 12.

### Does `@azure/msal-angular` support Server Side Rendering?

Yes, server side rendering is supported through Angular universal. See our doc [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/angular-universal.md) for more information.

### Can `@azure/msal-angular` be used with Internet Explorer?

Yes, `@azure/msal-angular` does support IE 11. More information can on configuration can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/ie-support.md).

## Configuration

### What is the difference between `@azure/msal-angular` v2 and v1?

Please see our [upgrade guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/v1-v2-upgrade-guide.md) for information on the differences between `@azure/msal-angular` v1 and v2, as well as changes to watch out for when upgrading.

### How do I add tokens to API calls?

`@azure/msal-angular` provides the `MsalInterceptor` for obtaining tokens and adding them to HTTP requests. You may find the following links helpful:

* [MsalInterceptor doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-interceptor.md) for details on configuration and use
* [Initialization doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls) for basic set up
* [Configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md) for different ways to configure MSAL
* [Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/5cc21a95a389c31a0d5e74d37ff297931aeee479/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app.module.ts#L47) for examples of usage

Please note that the `MsalInterceptor` is optional. You may wish to explicitly acquire tokens using the acquireToken APIs instead. The `MsalInterceptor` is provided for your convenience and may not fit all use cases. We encourage you to write your own interceptor if you have specific needs that are not addressed by the `MsalInterceptor`. 

### How do I use my app with path/hash location strategy?

`@azure/msal-angular` supports both the `PathLocationStrategy` and `HashLocationStrategy`, which can be configured in the `app-routing.module.ts` of your app. See our [samples list](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples) for the routing strategy demonstrated by each sample. See the [Angular docs](https://angular.io/guide/router#locationstrategy-and-browser-url-styles) for more details on routing strategies. 

See [below](#how-do-i-log-users-in-when-they-hit-the-application) for additional considerations for each strategy if you are wanting to log users in on page load.

## Usage

### How do I secure routes?

Please see our [MsalGuard doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-guard.md) for more information about securing routes with the `MsalGuard`.

### How do I get accounts?

The `@azure/msal-browser` instance used by `@azure/msal-angular` exposes multiple methods for getting account information. We recommend using `getAllAccounts()` to get all accounts, and `getAccountByHomeId()` and `getAccountByLocalId()` to get specific accounts. Note that while `getAccountByUsername()` is available, it should be a secondary choice, as it may be less reliable and is for convenience only. See the [`@azure/msal-browser` docs](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html) for more details on account methods.

We recommend subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None` before retrieving account information. This ensures that all interactions have completed before getting account information. See [our sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts#L27) for an example of this use.

### How do I get and set active accounts?

The `msal-browser` instance exposes `getActiveAccount()` and `setActiveAccount()` for active accounts. 

We recommend subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None` before retrieving account information with `getActiveAccount()`. This ensures that all interactions have completed before getting account information. 

We recommend setting the active account:

- After any action that may change the account, especially if your app uses multiple accounts. See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/home/home.component.ts#L23) for an example of setting the account after a successful login.
- On initial page load. Wait until all interactions are complete (by subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None`), check if there is an active account, and if there is none, set the active account. This could be the first account retrieved by `getAllAccounts()`, or other account selection logic required by your app. See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app) for an example of checking and setting the active account on page load.

**Note:** Currently, active accounts are for each page load and do not persist. While this is an enhancement we are looking to make, we recommend that you set the active account for each page load.

Our [Angular 11](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app) sample demonstrates basic usage. Your app may require more complicated logic to choose accounts.

### How do I log users in when they hit the application?

To log your users in when they hit the application, without using a login button, **do not** call `login` in the `ngOnInit` in `app.component.ts`, as this can cause looping with redirects. Instead, we recommend setting the `MsalGuard` on your initial page, which will prompt users to log in before they reach other pages in your application. Our additional recommendations depend on your routing strategy below. Please all see our [MsalGuard doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-guard.md) for more information.

#### PathLocationStrategy

For those using the `PathLocationStrategy`, we recommend:
- Setting the `MsalGuard` on your initial page
- Set your `redirectUri` to `'http://localhost:4200/auth'`
- Adding an `'auth'` path to your routes, setting the `MsalRedirectComponent` as the component (this route should not be protected by the `MsalGuard`)
- Making sure the `MsalRedirectComponent` is bootstrapped
- Optionally: adding `MsalGuard` to all your routes if you want all your routes protected

Our [Angular 10 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app) demonstrates use of the `PathLocationStrategy`.

#### HashLocationStrategy

For those using the `HashLocationStrategy`, we recommend:
- Setting the `MsalGuard` on your initial page
- Not setting the `MsalGuard` on placeholder routes (e.g. `/code`, `/error`)
- Making sure the `MsalRedirectComponent` is bootstrapped
- Optionally: adding `MsalGuard` to all your routes if you want all your routes protected

See our [Angular 11 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app-routing.module.ts) for examples of how to protect routes with `MsalGuard`.

### Why is my app looping when logging in with redirect?

One of the common reasons your app may be looping while logging in with redirects is due to improper usage of the `loginRedirect()` API. We recommend that you do not call `loginRedirect()` in the `ngOnInit` in the `app.component.ts`, as this will attempt to log in with every page load, often before any redirect has finished processing. 

Redirects **must** be handled either with the `MsalRedirectComponent` or with calling `handleRedirectObservable()`. See our docs on redirects [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information. Additionally, any interaction or account validation should be done after  subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None`. Please see our [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/30b5ff95e2ff2cc827d98118004d92968bb67b3f/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app.component.ts#L27) for an example. 

## Errors

If you have questions about specific errors you are receiving please see the following documents detailing some of the common errors:

- [`@azure/msal-browser` error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md)
- [`@azure/msal-angular` error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/errors.md)

## What if my question has not been answered?

First check the `@azure/msal-browser` [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) to see if your question is answered there. Since `@azure/msal-angular` is a wrapper around `@azure/msal-browser` many questions you may have are answered there.

If you have questions about our roadmap you can find a high level overview of planned features and releases [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

If your question is not answered in this document or in the `@azure/msal-browser` FAQ you can [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and we will answer it as soon as we can.
