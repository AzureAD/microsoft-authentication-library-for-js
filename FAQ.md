# FAQs

***
**[Compatibility](#Compatibility)**

1. [What browsers are supported by MSAL.js?](#what-browsers-are-supported-by-msaljs)
1. [I am moving from MSAL.js 1.x to MSAL.js to 2.x. What should I know?](#i-am-moving-from-msaljs-1x-to-msaljs-to-2x-what-should-i-know)
1. [Does this library work for iframed applications?](#does-this-library-work-for-iframed-applications)
1. [Will MSAL 2.x support B2C?](#will-msal-2x-support-b2c)
1. [Is MSAL.js 2.x compatible with Azure App Proxy](#is-msaljs-2x-compatible-with-azure-app-proxy)
1. [Can I use MSAL.js 2.x with Microsoft Graph JavaScript SDK?](#can-i-use-msaljs-2x-with-microsoft-graph-javascript-sdk)
1. [Can I provision a single-page application via command-line?](#can-i-provision-a-single-page-application-via-command-line)

**[Authentication](#Authentication)**

1. [I don't understand the redirect flow. How does the handleRedirectPromise function work?](#i-dont-understand-the-redirect-flow-how-does-the-handleredirectpromise-function-work)
1. [How can I support authentication with personal Microsoft accounts only?](#how-can-i-support-authentication-with-personal-microsoft-accounts-only)
1. [How do I get an authorization code from the library?](#how-do-i-get-an-authorization-code-from-the-library)
1. [How do I implement self-service sign-up?](#how-do-i-implement-self-service-sign-up)

**[Single-Sign-On](#Single-Sign-On)**

1. [How to get single sign-on in my application with MSAL.js?](#how-to-get-single-sign-on-in-my-application-with-msaljs)
1. [How can my application recognize a user after sign-in? How do I correlate users between applications?](#how-can-my-application-recognize-a-user-after-sign-in-how-do-i-correlate-users-between-applications)

**[Accounts](#Accounts)**

1. [In what scenarios will getAllAccounts return multiple accounts?](#in-what-scenarios-will-getallaccounts-return-multiple-accounts)
1. [Is the result of getAllAccounts sorted in any order?](#is-the-result-of-getallaccounts-sorted-in-any-order)
1. [If an account is returned by getAllAccounts does that mean the user has an active session on the server?](#if-an-account-is-returned-by-getallaccounts-does-that-mean-the-user-has-an-active-session-on-the-server)
1. [How can I switch between multiple logged in users?](#how-can-i-switch-between-multiple-logged-in-users)

**[Configuration](#Configuration)**

1. [What is the difference between sessionStorage and localStorage?](#what-is-the-difference-between-sessionstorage-and-localstorage)
1. [What are the possible configuration options?](#what-are-the-possible-configuration-options)
1. [Where is the authority string on Azure AD Portal?](#where-is-the-authority-domain-string-on-azure-ad-portal)
1. [What should I set my redirectUri to?](#what-should-i-set-my-redirecturi-to)
1. [Why is fragment the only valid field for responseMode in msal-browser?](#why-is-fragment-the-only-valid-field-for-responsemode-in-msal-browser)
1. [How do I configure the position and dimensions of popups?](#how-do-i-configure-the-position-and-dimensions-of-popups)

**[Tokens](#Tokens)**

1. [How do I acquire an access token? How do I use it?](#how-do-i-acquire-an-access-token-how-do-i-use-it)
1. [How do I acquire a refresh token?](#how-do-i-acquire-a-refresh-token)
1. [How do I renew tokens with MSAL.js?](#how-do-i-renew-tokens-with-msaljs)
1. [How can I acquire tokens faster?](#how-can-i-acquire-tokens-faster)
1. [I'm seeing scopes openid, profile, email, offline_access in my tokens, even though I haven't requested them. What are they?](#im-seeing-scopes-openid-profile-email-offline_access-and-userread-in-my-tokens-even-though-i-havent-requested-them-what-are-they)
1. [How long do tokens last? How long are they valid for?](#how-long-do-tokens-last-how-long-are-they-valid-for)
1. [What are the differences between supported audiences and account types?](#what-are-the-differences-between-supported-audiences-and-account-types)

**[Scopes & Resources](#Scopes-&-Resources)**

1. [My application has multiple resources it needs to access to. How should I handle scopes for access tokens?](#my-application-has-multiple-resources-it-needs-to-access-to-how-should-i-handle-scopes-for-access-tokens)

**[B2C](#B2C)**

1. [How do I specify which B2C policy/user flow I would like to use?](#how-do-i-specify-which-b2c-policyuser-flow-i-would-like-to-use)
1. [How do I handle the password-reset user-flow?](#how-do-i-handle-the-password-reset-user-flow)
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

MSAL.js has been tested and supports the last 2 stable and supported versions of the following browsers:

- Chrome
- Edge (Chromium)
- Firefox
- Safari
- Opera

MSAL.js has also been tested and supports the following browsers with Promise polyfills (not included):

- IE 11
- Edge (Legacy)

Keep [these steps](./docs/internet-explorer.md) in mind when using MSAL.js with IE or Edge Legacy. Support for these browsers will be dropped in the next major version of `@azure/msal-browser` (v3).

MSAL.js also supports the following environments:

- WebViews
- Office Add-ins (see the [sample](https://github.com/OfficeDev/PnP-OfficeAddins/tree/main/Samples/auth/Office-Add-in-Microsoft-Graph-React))
- Chromium Extensions (see the [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/ChromiumExtensionSample))
- Teams Applications (see the [sample](https://github.com/pnp/teams-dev-samples/tree/main/samples/tab-sso/src/nodejs))

### Known Issues with Certain Browsers

There are certain known issues and mitigations documented for the following browsers:

- [Browsers that block 3rd Party Cookies (i.e. Safari, Chrome Incognito, Firefox Private)](https://docs.microsoft.com/azure/active-directory/develop/reference-third-party-cookies-spas)
- [IE 11 and Edge Legacy](./docs/internet-explorer.md)

## I am moving from MSAL.js 1.x to MSAL.js to 2.x. What should I know?

Please refer to our migration guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v1-migration.md).

## Does this library work for iframed applications?

MSAL.js can be used in iframed applications under certain conditions. For more information, please refer to: [Using MSAL in iframed apps](./docs/iframe-usage.md)

We are also working on solutions for applications affected by ITP 2.x changes.

## Will MSAL 2.x support B2C?

MSAL.js v2 supports B2C of October 2020.

## Is MSAL.js 2.x compatible with Azure App Proxy?

Unfortunately, at this time MSAL.js 2.x is not compatible with [Azure App Proxy](https://docs.microsoft.com/azure/active-directory/app-proxy/application-proxy). Single-page applications will need to use MSAL.js 1.x as a workaround. We will post an update when this incompatibility has been fixed. See [this issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/3420) for more information.

## Can I use MSAL.js 2.x with Microsoft Graph JavaScript SDK?

Yes, MSAL.js 2.x can be used as a custom authentication provider for the [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript). For an implementation, please refer to the sample: [JavaScript SPA calling Graph API](https://github.com/Azure-Samples/ms-identity-javascript-tutorial/tree/main/2-Authorization-I/1-call-graph).

## Can I provision a single-page application via command-line?

Yes, we recommend the new [Powershell Graph SDK](https://github.com/microsoftgraph/msgraph-sdk-powershell) for doing so. For instance, the script below creates an Azure AD application with redirect URI of type **SPA** and **User.Read** permission for Microsoft Graph in a tenant specified by the user, and then provisions a service principal in the same tenant based on this application object:

```Powershell
Import-Module Microsoft.Graph.Applications

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Connect-MgGraph -TenantId "ENTER_TENANT_ID_HERE" -Scopes "Application.ReadWrite.All"

# User.Read delegated permission for Microsoft Graph
$mgUserReadScope = @{
    "Id" = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # permission Id
    "Type" = "Scope"
}

# Add additional permissions to array below
$mgResourceAccess = @($mgUserReadScope)

[object[]]$requiredResourceAccess = @{
    "ResourceAppId" = "00000003-0000-0000-c000-000000000000" # MS Graph App Id
    "ResourceAccess" = $mgResourceAccess
}

# Create the application
$msalApplication = New-MgApplication -displayName myMsalSpa `
    -SignInAudience AzureADMyOrg `
    -Spa @{RedirectUris = "http://localhost:3000", "http://localhost:3000/redirect"} `
    -RequiredResourceAccess $requiredResourceAccess

# Provision the service principal
New-MgServicePrincipal -AppId $msalApplication.AppId
```

For a full implementation, please refer to the app creation scripts in the [Vanilla JS Quickstart Sample](https://github.com/Azure-Samples/ms-identity-javascript-v2/blob/master/AppCreationScripts/AppCreationScripts.md)

# Authentication

## I don't understand the redirect flow. How does the `handleRedirectPromise` function work?

The redirect flow can be confusing, as redirecting away from the page means you are creating a whole new instance of the application when you return. This means that calling a redirect method cannot return anything. Rather, what happens is that the page is redirected away, you enter your credentials, and you are redirected back to your application with the response in the url hash.

If `navigateToLoginRequestUrl` property in MSAL configuration parameters is set to **true**, you will be redirected again to the page you were on when you called `loginRedirect`, unless that page was also set as your `redirectUri`. On the final page your application must call `handleRedirectPromise()` in order to process the hash and cache tokens in local/session storage.

As this function returns a promise you can call `.then` and `.catch`, similar to `loginPopup`.

Please ensure `handleRedirectPromise` has resolved before invoking any other MSAL method. If your app was not loaded as a result of a redirect operation `handleRedirectPromise` will immediately return `null`.

Please review one of our samples ([for instance](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/default)) to see the redirect flow in action.

## How can I support authentication with personal Microsoft accounts only?

Simply set your `authority` in your MSAL app configuration to **consumers** tenant e.g. https://login.microsoftonline.com/consumers.

## How do I get an authorization code from the library?

Currently the msal-browser package is designed for Single-Page Applications that are handling all authentication through the browser client. We have not yet optimized this to work with server-side components. As such, requests to retrieve the authorization code from the first leg of the flow can't be met currently. We are currently working on an [implementation of msal that will run in node libraries](https://github.com/AzureAD/microsoft-authentication-library-for-js/projects/4), and as part of that we will explore options to make msal-browser work with server-side components.

## How do I implement self-service sign-up?
MSAL Browser supports self-service sign-up in the auth code flow. Please see our docs [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) for supported prompt values in the request and their expected outcomes, and [here](http://aka.ms/s3u) for an overview of self-service sign-up and configuration changes that need to be made to your Azure tenant. Please note that that self-service sign-up is not available in B2C and test environments.

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

# Accounts

## In what scenarios will `getAllAccounts` return multiple accounts?

`getAllAccounts` will return multiple accounts when your app has made multiple interactive token requests using either an `acquireToken` or `login` API and the user has selected different accounts on the server's account selection screen. Each successful call to an `acquireToken` or `login` API will return exactly one account which can be the same or different from the account returned in a previous call. Each account is saved in local or sessionStorage, depending on how you've configured MSAL, and will be available to any page that lives on the same domain.

If you would like to force the server account selection screen you can pass `prompt: "select_account"` or `prompt: "login"` to the `acquireToken` or `login` API.

## Is the result of `getAllAccounts` sorted in any order?

No, accounts are not sorted nor are they guaranteed to maintain any particular order across multiple calls.

## If an account is returned by `getAllAccounts` does that mean the user has an active session on the server?

No, the account APIs reflect local account state only. If you need to ensure the user has an active session on the server you should call `acquireTokenSilent` or `ssoSilent` and fallback to interaction if needed.

### How can I switch between multiple logged in users?

Deciding which account to use to acquire tokens is app dependent, however, `@azure/msal-browser` provides 2 convenient APIs to help you keep track of which account is currently "active" and should be used for token requests. Once you've determined which account you wish to use you can call the `setActiveAccount()` API to make sure MSAL uses this account for all subsequent requests. If you would like to switch to a different account, simply call `setActiveAccount()` again and pass it the new account you would like to use. If you need to know which account is currently "active" you can use the `getActiveAccount()` API.

You can read more about the account APIs [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/accounts.md).
You can also find an example implementation of an account switcher using the `@azure/msal-react` wrapper in our [react-router-sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample).

# Configuration

## What is the difference between `sessionStorage` and `localStorage`?

We offer two methods of storage for Msal, `localStorage` and `sessionStorage`.  Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users, but `localStorage` will give you Single Sign On across tabs and user sessions.  We encourage you to explore the options and make the best decision for your application.

## What are the possible configuration options?

For MSAL.js 2.x, please review [this document](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md).

## Where is the `authority` domain string on Azure AD Portal?

The `authority` string that you need to supplant to MSAL app configuration is not explicitly listed among the **Endpoint** links on `Azure Portal/AzureAD/App Registration/Overview` page. It is simply the domain part of a `/token` or `/authorize` endpoint, followed by the tenant name or ID e.g. `https://login.microsoftonline.com/common`.

## What does authority string default to if I provide "authority" and "azureCloudOptions"?

If the developer provides `azureCloudOptions`, MSAL.js will overwrite any value provided in the `authority`. MSAL.js will also give preference to the parameters provided in a `request` over `configuration`. Please note that if `azureCloudOptions` are set in the configuration, they will take precedence over `authority` in the `request`. If the developer needs to overwrite this, they need to set `azureCloudOptions` in the `request`.

## What should I set my `redirectUri` to?

When you attempt to authenticate MSAL will navigate to your IDP's sign in page either in the current window, a popup window or a hidden iframe depending on whether you used a redirect, popup or silent API respectively. When authentication is complete the IDP will redirect the window to the `redirectUri` specified in the request with the authentication response in the url hash. You can use any page in your application as your `redirectUri` but there are some additional considerations you should be aware of depending on which API you are using. All pages used as a `redirectUri` **must** be registered as a Reply Url of type "SPA" on your app registration.

### RedirectUri for popup and silent flows

When using popup and silent APIs we recommend setting the `redirectUri` to a blank page, a page that does not implement MSAL, or a page that does not itself require a user be authenticated. This will help prevent potential issues as well as improve performance. If your application is only using popup and silent APIs you can set this on the `PublicClientApplication` config. If your application also needs to support redirect APIs you can set the `redirectUri` on a per request basis.

### RedirectUri for redirect flows

When using the redirect APIs you **must** set your `redirectUri` to a page that implements MSAL and that page must also invoke `handleRedirectPromise` in order to process the response. If using `msal-react` or `msal-angular`, `handleRedirectPromise` may be invoked by default, please refer to the docs for those libraries for more specific guidance.

Additional notes:

* If the page that you use as your `redirectUri` requires authentication and automatically invokes a login API, you should ensure that `handleRedirectPromise` has resolved and a user is not signed in **before** invoking the login API.
* If the page that invokes `loginRedirect` is **different** than your `redirectUri` you will first be redirected to the `redirectUri` then back to the original page. You should invoke `handleRedirectPromise` on both the `redirectUri` **and** the original page. If this is undesired and you would like to stay on the `redirectUri` you can set `navigateToLoginRequestUrl` to `false` in the `PublicClientApplication` config.

## Why is `fragment` the only valid field for `responseMode` in `msal-browser`?

The library is built to specifically use the fragment response mode. This is a security consideration as the fragment of the URL is not sent to the server and modifying/clearing the fragment does not result in a new page load. We are considering implementing support for other `responseMode` types in the future, specifically to use multiple libraries in the same app.

## How do I configure the position and dimensions of popups?

A popup window's position and dimension can be configured by passing the height, width, top position, and left position in the request. If no configurations are passed, MSAL defaults will be used. See the request documentation for [PopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#popuprequest) and [EndSessionPopupRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#endsessionpopuprequest) for more details.

Note that popup dimensions should be positioned on screen and sized smaller than the parent window. Popups that are positioned off-screen or larger than the parent window will use MSAL defaults instead.

```javascript
const loginRequest = {
    scopes: ["user.read", "mail.send"],
    popupWindowAttributes: {
        popupSize: {
            height: 100,
            width: 100
        },
        popupPosition: {
            top: 100,
            left: 100
        }
    }
};

try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
} catch (err) {
    // handle error
}
```

# Tokens

## How do I acquire an access token? How do I use it?

Please refer to token guide [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md).

## How do I acquire a refresh token?

MSAL.js abstracts away all refresh token complexity and thus refresh tokens are not exposed by MSAL APIs by design. When you need an access token please call the `acquireTokenSilent` API which will return to you a valid token from the cache or internally use the refresh token to acquire a new access token. If you have a backend that needs to be able to use access tokens to call other APIs, your backend should use a server-side library, such as MSAL Node, to acquire tokens for itself.

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

## Register custom scopes for a web API
[How to register custom scopes for my web API](https://docs.microsoft.com/azure/active-directory/develop/quickstart-configure-app-expose-web-apis).

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

## How do I handle the password-reset user-flow?

The [new password reset experience](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended) is now part of the sign-up or sign-in policy. When the user selects the **Forgot your password?** link, they are immediately sent to the Forgot Password experience. You don't need a separate policy for password reset anymore.

Our recommendation is to move to the new password reset experience since it simplifies the app state and reduces error handling on the user-end. If for some reason you have to use the legacy password-reset user-flow, you'll have to handle the `AADB2C90118` error code returned from B2C service when a user selects the **Forgot your password?** link:

```javascript
pca.loginPopup()
    .then((response) => {
        // do something with auth response
    }).catch(error => {
        // Error handling
        if (error.errorMessage) {
            // Check for forgot password error
            // Learn more about AAD error codes at https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes
            if (error.errorMessage.indexOf("AADB2C90118") > -1) {
                // For password reset, initiate a login request against tenant-specific authority with user-flow string appended
                pca.loginPopup({
                    authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_reset"
                });
            }
        }
    });
```

For a full implementation, see the sample: [MSAL.js v2 B2C sample](https://github.com/Azure-Samples/ms-identity-javascript-tutorial/tree/main/1-Authentication/2-sign-in-b2c)

## Why is `getAccountByUsername()` returning null, even though I'm signed in?

In order to use `getAccountByUsername()` in B2C scenarios you must enable your `idTokens` to return the `emails` claim in your B2C tenant. MSAL will fill the `username` field on the `AccountInfo` object with the first element of the array returned on the `emails` claim. In most cases this array will only have one element, however, if you notice that your idTokens are returning more than one email on this claim, ensure you are calling `getAccountByUsername` with the first email.

To enable this claim open up your User Flow configuration in the Azure Portal. Click the `User Attributes` tab and make sure `Email Address` is checked. Then click the `Application Claims` tab and make sure `Email Addresses` is checked. You can verify that the `emails` claim is now being returned by acquiring an `idToken` and inspecting its contents.

## I logged out of my application. Why am I not asked for credentials when I try to log back in?

When you log out of a B2C application by calling MSAL's `logout()` API, MSAL.js will first clear browser storage of your user's tokens then redirect you to the Azure B2C logout endpoint. The B2C service will then close your session but may not log you out of your federated IDP. This happens because the service does not make any assumptions about other apps you may want to log out of. What this means in practice is that when a user attempts to login again the B2C service will prompt the user to select which Social IDP they would like to sign in with. When the user makes their selection, they may be signed back in without interaction.

You can read more about this behavior [here](https://docs.microsoft.com/azure/active-directory-b2c/session-overview#sign-out)

## Why am I not signed in when returning from an invite link?

MSAL.js will only process tokens which it originally requested. If your flow requires that you send a user a link they can use to sign up, you will need to ensure that the link points to your app, not the B2C service directly. An example flow can be seen in the [working with B2C](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/working-with-b2c.md) doc.

## What should I do if I believe my issue is with the B2C service itself rather than with the library

In that case, please file a support ticket with the B2C team by following the instructions here: [B2C support options](https://docs.microsoft.com/azure/active-directory-b2c/support-options).


