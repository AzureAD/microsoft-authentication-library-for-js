# FAQs

***
**[Compatibility](#Compatibility)**

1. [What browsers are supported by MSAL.js?](#what-browsers-are-supported-by-msaljs)
1. [I am moving from MSAL.js 1.x to MSAL.js to 2.x. What should I know?](#i-am-moving-from-msaljs-1x-to-msaljs-to-2x-what-should-i-know)
1. [Does this library work for iframed applications?](#Does-this-library-work-for-iframed-applications?)
1. [Will MSAL 2.x support B2C?](#Will-MSAL-2.x-support-B2C?)

**[Authentication](#Authentication)**

1. [I don't understand the redirect flow. How does the handleRedirectPromise function work?](#I-don't-understand-the-redirect-flow.-How-does-the-handleRedirectPromise-function-work?)
1. [How can I support authentication with personal Microsoft accounts only?](#how-can-i-support-authentication-with-personal-microsoft-accounts-only)
1. [How do I get an authorization code from the library?](#How-do-i-get-an-authorization-code-from-the-library?)

**[Single-Sign-On](#Single-Sign-On)**

1. [How to get single sign-on in my application with MSAL.js?](#how-to-get-single-sign-on-in-my-application-with-msaljs)
1. [How can my application recognize a user after sign-in? How do I correlate users between applications?](#how-can-my-application-recognize-a-user-after-sign-in-how-do-i-correlate-users-between-applications)

**[Configuration](#Configuration)**
1. [What is the difference between sessionStorage and localStorage?](#what-is-the-difference-between-sessionstorage-and-localstorage)
1. [What are the possible configuration options?](#what-are-the-possible-configuration-options)
1. [Where is the authority string on Azure AD Portal?](#where-is-the-authority-domain-string-on-azure-ad-portal)

**[Tokens](#Tokens)**

1. [How do I acquire an access token? How do I use it?](#how-do-i-acquire-an-access-token-how-do-i-use-it)
1. [How do I renew tokens with MSAL.js?](#how-do-i-renew-tokens-with-msaljs)
1. [How can I acquire tokens faster?](#how-can-i-acquire-tokens-faster)
1. [I'm seeing scopes openid, profile, email, offline_access in my tokens, even though I haven't requested them. What are they?](#im-seeing-scopes-openid-profile-email-offline_access-and-userread-in-my-tokens-even-though-i-havent-requested-them-what-are-they)
1. [How long do tokens last? How long are they valid for?](#how-long-do-tokens-last-how-long-are-they-valid-for)
1. [What are the differences between supported audiences and account types?](#what-are-the-differences-between-supported-audiences-and-account-types)

**[Scopes & Resources](Scopes-&-Resources)**

1. [My application has multiple resources it needs to access to. How should I handle scopes for access tokens?](#my-application-has-multiple-resources-it-needs-to-access-to-how-should-i-handle-scopes-for-access-tokens)


**Common Issues**
1. [Why is MSAL throwing an error?](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs/errors.md)

***

# Compatibility

## What browsers are supported by MSAL.js?

MSAL.js has been tested with the following browsers:

IE 11, Edge, Chrome, Firefox and Safari

Keep these steps in mind when [using MSAL.js with IE](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Using-msal.js-with-Internet-Explorer).

There are certain known issues and mitigations documented for Safari, IE and Edge. Please check out:
* [Known issues on IE and Edge](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Known-issues-on-IE-and-Edge-Browser)
* [Known issue on Safari](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Known-issue-on-Safari)

## I am moving from MSAL.js 1.x to MSAL.js to 2.x. What should I know?

Please refer to our migration guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v1-migration.md).

## Does this library work for iframed applications?

We are currently working on support for iframed applications as well as solutions for applications affected by ITP 2.x changes. You can monitor the first of those tickets [here](#1410).

## Will MSAL 2.x support B2C?

We are currently working with the B2C service team to allow for authorization code flow to work in the browser with B2C tenants. We hope to have this available shortly after release.

# Authentication

## I don't understand the redirect flow. How does the `handleRedirectPromise` function work?

The redirect flow can be confusing, as redirecting away from the page means you are creating a whole new instance of the application when you return. This means that calling a redirect method cannot return anything. Rather what happens is, the page is redirected away, you enter your credentials and you are redirected back to your application with the response in the url hash.

If `navigateToRequestUrl` property in MSAL configuration parameters is set to **true**, you will be redirected again to the page you were on when you called `loginRedirect`, unless that page was also set as your `redirectUri`. On the final page your application must call `handleRedirectPromise()` in order to process the hash and cache tokens in local/session storage.

As this function returns a promise you can call `.then` and `.catch`, similar to `loginPopup`.

Please review one of our samples ([for instance](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/default)) to see the redirect flow in action.

## How can I support authentication with personal Microsoft accounts only?

Simply set your `authority` in your MSAL app configuration to **consumers** tenant e.g. https://login.microsoftonline.com/consumers.

## How do I get an authorization code from the library?

Currently the msal-browser package is designed for Single-Page Applications that are handling all authentication through the browser client. We have not yet optimized this to work with server-side components. As such, requests to retrieve the authorization code from the first leg of the flow can't be met currently. We are currently working on an [implementation of msal that will run in node libraries](https://github.com/AzureAD/microsoft-authentication-library-for-js/projects/4), and as part of that we will explore options to make msal-browser work with server-side components.

# Single Sign-On

## How to get single sign-on in my application with MSAL.js?

Please read the documentation on [Single Sign-On](https://docs.microsoft.com/azure/active-directory/develop/msal-js-sso) to learn about different scenarios in which MSAL.js enables single sign-on.

## How can my application recognize a user after sign-in? How do I correlate users between applications?

You can use the `homeAccountId` property on the Account in the `AuthenticationResult`.

```js
loginPopup().then((response) => {
    const uniqueID = response.account.homeAccountId;
})
```

# Configuration

## What is the difference between `sessionStorage` and `localStorage`?

We offer two methods of storage for Msal, `localStorage` and `sessionStorage`.  Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users, but `localStorage` will give you Single Sign On accross tabs and user sessions.  We encourage you to explore the options and make the best decision for your application.

## What are the possible configuration options?

For MSAL.js 2.x, please review [this document](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md).

## Where is the `authority` domain string on Azure AD Portal?

The `authority` string that you need to supplant to MSAL app configuration is not explicitly listed among the **Endpoint** links on `Azure Portal/AzureAD/App Registration/Overview` page. It is simply the domain part of a `/token` or `/authorize` endpoint, followed by the tenant name or ID e.g. `https://login.microsoftonline.com/common`.

# Tokens

## How do I acquire an access token? How do I use it?

Please refer to token guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md). 

## How do I renew tokens with MSAL.js?

MSAL.js provides the `acquireTokenSilent` method which handles token renewal by making silent token requests without prompting the user. The method first looks for a valid cached token in the browser storage. If it does not find one, the library makes the silent request to Azure AD and if there is an active user session (determined by a cookie set in browser on the Azure AD domain), a fresh token is returned. The library does not automatically invoke the `acquireTokenSilent` method. It is recommended that you call `acquireTokenSilent` in your app before making an API call to get the valid token.

In certain cases, the `acquireTokenSilent` method's attempt to get the token silently fails. Some examples of this are when there is an expired user session with Azure AD or a password change by the user, etc. which requires user interaction. When the `acquireTokenSilent` fails, you need to call one of the interactive acquire token methods.(`acquireTokenPopup` or `acquireTokenRedirect`).

The tokens returned by Azure AD have a default lifetime of 1 hour. However, as long as the user is active on your application and a valid Azure AD session exists in the browser, the `acquireTokenSilent` method can be used to renew tokens. The Azure AD session is valid for 24 hours and can be extended by the user by choosing "Keep me signed in" option on the sign-in screen. For more details, read the [token and session lifetimes](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes) document.

## How can I acquire tokens faster?

Please refer to our performance guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/performance.md)

## I'm seeing scopes `openid`, `profile`, `email`, `offline_access` and `User.Read` in my tokens, even though I haven't requested them. What are they?

The first four (`openid`, `profile`, `email` and `offline_access`) are called **default scopes**. They are added to Azure AD as part of Azure AD - OAuth 2.0/OpenID Connect compliance. They are **not** part of any particular API. You can read more about them [here](https://openid.net/specs/openid-connect-core-1_0.html). 

The scope `User.Read`, on the other hand, is an MS Graph API scope. It is also added by default to every app registration. However if your application is not calling MS Graph API, you can simply ignore it.

## How long do tokens last? How long are they valid for?

Token lifetimes are 1 hour and the session lifetime is 24 hours. This means that if no requests have been made in 24 hours, you will need to login again before requesting a new token.

## What are the differences between supported audiences and account types?

Please see the documentation on [Tenancy in Azure Active Directory](https://docs.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps#who-can-sign-in-to-your-app)

# Scopes & Resources

## My application has multiple resources it needs to access to. How should I handle scopes for access tokens?

Please see the doc about resources and scopes [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md)
