# FAQs

***
**[Compatibility](#Compatibility)**

1. [What browsers are supported by MSAL.js?](#what-browsers-are-supported-by-msaljs)
1. [I am moving from MSAL.js 1.x to MSAL.js to 2.x. What should I know?](#i-am-moving-from-msaljs-1x-to-msaljs-to-2x-what-should-i-know)
1. [Does this library work for iframed applications?](#does-this-library-work-for-iframed-applications)
1. [Will MSAL 2.x support B2C?](#will-msal-2x-support-b2c)

**[Authentication](#Authentication)**

1. [I don't understand the redirect flow. How does the handleRedirectPromise function work?](#i-dont-understand-the-redirect-flow-how-does-the-handleredirectpromise-function-work)
1. [How can I support authentication with personal Microsoft accounts only?](#how-can-i-support-authentication-with-personal-microsoft-accounts-only)
1. [How do I get an authorization code from the library?](#how-do-i-get-an-authorization-code-from-the-library)

**[Single-Sign-On](#Single-Sign-On)**

1. [How to get single sign-on in my application with MSAL.js?](#how-to-get-single-sign-on-in-my-application-with-msaljs)
1. [How can my application recognize a user after sign-in? How do I correlate users between applications?](#how-can-my-application-recognize-a-user-after-sign-in-how-do-i-correlate-users-between-applications)

**[Configuration](#Configuration)**

1. [What is the difference between sessionStorage and localStorage?](#what-is-the-difference-between-sessionstorage-and-localstorage)
1. [What are the possible configuration options?](#what-are-the-possible-configuration-options)
1. [Where is the authority string on Azure AD Portal?](#where-is-the-authority-domain-string-on-azure-ad-portal)
1. [Why is fragment the only valid field for responseMode in msal-browser?](#why-is-fragment-the-only-valid-field-for-responsemode-in-msal-browser)

**[Tokens](#Tokens)**

1. [How do I acquire an access token? How do I use it?](#how-do-i-acquire-an-access-token-how-do-i-use-it)
1. [How do I renew tokens with MSAL.js?](#how-do-i-renew-tokens-with-msaljs)
1. [How can I acquire tokens faster?](#how-can-i-acquire-tokens-faster)
1. [I'm seeing scopes openid, profile, email, offline_access in my tokens, even though I haven't requested them. What are they?](#im-seeing-scopes-openid-profile-email-offline_access-and-userread-in-my-tokens-even-though-i-havent-requested-them-what-are-they)
1. [How long do tokens last? How long are they valid for?](#how-long-do-tokens-last-how-long-are-they-valid-for)
1. [What are the differences between supported audiences and account types?](#what-are-the-differences-between-supported-audiences-and-account-types)

**[Scopes & Resources](#Scopes-&-Resources)**

1. [My application has multiple resources it needs to access to. How should I handle scopes for access tokens?](#my-application-has-multiple-resources-it-needs-to-access-to-how-should-i-handle-scopes-for-access-tokens)

**[B2C](#B2C)**

1. [How do I specify which B2C policy/user flow I would like to use?](#how-do-i-specify-which-b2c-policyuser-flow-i-would-like-to-use)
1. [Why is getAccountByUsername returning null, even though I'm signed in?](#why-is-getaccountbyusername-returning-null-even-though-im-signed-in)
1. [I logged out of my application. Why am I not asked for credentials when I try to log back in?](#i-logged-out-of-my-application-why-am-i-not-asked-for-credentials-when-i-try-to-log-back-in)
1. [Why am I not signed in when returning from an invite link?](#why-am-i-not-signed-in-when-returning-from-an-invite-link)
1. [Why is there no access token returned from acquireTokenSilent?](#why-is-there-no-access-token-returned-from-acquiretokensilent)
1. [What should I do if I believe my issue is with the B2C service itself rather than with the library](#what-should-i-do-if-i-believe-my-issue-is-with-the-b2c-service-itself-rather-than-with-the-library)

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

MSAL.js v2 supports B2C of October 2020. 

# Authentication

## I don't understand the redirect flow. How does the `handleRedirectPromise` function work?

The redirect flow can be confusing, as redirecting away from the page means you are creating a whole new instance of the application when you return. This means that calling a redirect method cannot return anything. Rather, what happens is that the page is redirected away, you enter your credentials, and you are redirected back to your application with the response in the url hash.

If `navigateToRequestUrl` property in MSAL configuration parameters is set to **true**, you will be redirected again to the page you were on when you called `loginRedirect`, unless that page was also set as your `redirectUri`. On the final page your application must call `handleRedirectPromise()` in order to process the hash and cache tokens in local/session storage.

As this function returns a promise you can call `.then` and `.catch`, similar to `loginPopup`.

Please ensure `handleRedirectPromise` has resolved before invoking any other MSAL method. If your app was not loaded as a result of a redirect operation `handleRedirectPromise` will immediately return `null`.

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

We offer two methods of storage for Msal, `localStorage` and `sessionStorage`.  Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users, but `localStorage` will give you Single Sign On across tabs and user sessions.  We encourage you to explore the options and make the best decision for your application.

## What are the possible configuration options?

For MSAL.js 2.x, please review [this document](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md).

## Where is the `authority` domain string on Azure AD Portal?

The `authority` string that you need to supplant to MSAL app configuration is not explicitly listed among the **Endpoint** links on `Azure Portal/AzureAD/App Registration/Overview` page. It is simply the domain part of a `/token` or `/authorize` endpoint, followed by the tenant name or ID e.g. `https://login.microsoftonline.com/common`.

## Why is `fragment` the only valid field for `responseMode` in `msal-browser`?

The library is built to specifically use the fragment response mode. This is a security consideration as the fragment of the URL is not sent to the server and modifying/clearing the fragment does not result in a new page load. We are considering implementing support for other `responseMode` types in the future, specifically to use multiple libraries in the same app.

# Tokens

## How do I acquire an access token? How do I use it?

Please refer to token guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md). 

## How do I renew tokens with MSAL.js?

MSAL.js provides the `acquireTokenSilent` method which handles token renewal by making silent token requests without prompting the user. The method first looks for a valid cached token in the browser storage. If it does not find one, the library makes the silent request to Azure AD and if there is an active user session (determined by a cookie set in browser on the Azure AD domain), a fresh token is returned. The library does not automatically invoke the `acquireTokenSilent` method. It is recommended that you call `acquireTokenSilent` in your app before making an API call to get the valid token.

In certain cases, the `acquireTokenSilent` method's attempt to get the token silently fails. Some examples of this are when there is an expired user session with Azure AD or a password change by the user, etc. which requires user interaction. When the `acquireTokenSilent` fails, you need to call one of the interactive acquire token methods (`acquireTokenPopup` or `acquireTokenRedirect`).

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

# B2C

## How do I specify which B2C policy/user flow I would like to use?

The policy (a.k.a. user flow) can be appended to the authority url you provide as part of the `PublicClientApplication` configuration or as part of an individual request.

```javascript
const config = {
    auth: {
        clientId: "your-client-id",
        authority: "https://yourApp.b2clogin.com/yourApp.onmicrosoft.com/your_policy",
        knownAuthorities: ["yourApp.b2clogin.com"]
    }
}
const pca = new PublicClientApplication(config);

// You can also provide the authority as part of the request object
const request = {
    scopes: ["openid"],
    authority: "https://yourApp.b2clogin.com/yourApp.onmicrosoft.com/your_policy"
}
pca.loginRedirect(request);
```

Note: Msal.js does not support providing the user flow as a query parameter e.g. `https://yourApp.b2clogin.com/yourApp.onmicrosoft.com/?p=your_policy`. Please make sure your authority is formatted as shown above.

## Why is `getAccountByUsername()` returning null, even though I'm signed in?

In order to use `getAccountByUsername()` in B2C scenarios you must enable your `idTokens` to return the `emails` claim in your B2C tenant. MSAL will fill the `username` field on the `AccountInfo` object with the first element of the array returned on the `emails` claim. In most cases this array will only have one element, however, if you notice that your idTokens are returning more than one email on this claim, ensure you are calling `getAccountByUsername` with the first email.

To enable this claim open up your User Flow configuration in the Azure Portal. Click the `User Attributes` tab and make sure `Email Address` is checked. Then click the `Application Claims` tab and make sure `Email Addresses` is checked. You can verify that the `emails` claim is now being returned by acquiring an `idToken` and inspecting its contents.

## I logged out of my application. Why am I not asked for credentials when I try to log back in?

When you log out of a B2C application by calling MSAL's `logout()` API, MSAL.js will first clear browser storage of your user's tokens then redirect you to the Azure B2C logout endpoint. The B2C service will then close your session but may not log you out of your federated IDP. This happens because the service does not make any assumptions about other apps you may want to log out of. What this means in practice is that when a user attempts to login again the B2C service will prompt the user to select which Social IDP they would like to sign in with. When the user makes their selection, they may be signed back in without interaction.

You can read more about this behavior [here](https://docs.microsoft.com/azure/active-directory-b2c/session-overview#sign-out)

## Why am I not signed in when returning from an invite link?

MSAL.js will only process tokens which it originally requested. If your flow requires that you send a user a link they can use to sign up, you will need to ensure that the link points to your app, not the B2C service directly. An example flow can be seen in the [working with B2C](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md) doc.

## Why is there no access token returned from `acquireTokenSilent`?

Azure AD B2C currently requires refresh tokens to be redeemed with the same scopes that were requested when the refresh token is first obtained. If your application requires different behavior, workarounds include: 

#### If your application only needs to support 1 set of scopes: 

Please ensure that these scopes are requested as part of the `loginPopup`,`loginRedirect` or `ssoSilent` call made prior to calling `acquireTokenSilent`. This ensures the refresh token is issued for the scopes you need.

#### If your application needs to support more than 1 set of scopes:

Include the first set of scopes in `loginPopup`, `loginRedirect` or `ssoSilent` then make another call to `acquireTokenRedirect`, `acquireTokenPopup` or `ssoSilent` containing your 2nd set of scopes. Until the access tokens expire, `acquireTokenSilent` will return either token from the cache. Once an access token is expired, one of the interactive APIs will need to be called again. This is an example of how you can handle this scenario:

```javascript
// Initial acquisition of scopes 1 and 2
await msal.loginPopup({scopes: ["scope1"]});
const account = msal.getAllAccounts()[0];
await msal.ssoSilent({
    scopes: ["scope2"],
    loginHint: account.username
});

// Subsequent token acquisition with fallback
msal.acquireTokenSilent({
    scopes: ["scope1"],
    account: account
}).then((response) => {
    if (!response.accessToken) {
        return msal.ssoSilent({
            scopes: ["scope1"],
            loginHint: account.username
        });
    } else {
        return response;
    }
});
```

:warning: `ssoSilent` will not work in browsers that disable 3rd party cookies, such as Safari. If you need to support these browsers, call `acquireTokenRedirect` or `acquireTokenPopup`

## What should I do if I believe my issue is with the B2C service itself rather than with the library

In that case, please file a support ticket with the B2C team by following the instructions here: [B2C support options](https://docs.microsoft.com/azure/active-directory-b2c/support-options).
