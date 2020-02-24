# Microsoft Authentication Library for JavaScript (MSAL.js) 2.0 for Browser-Based Single-Page Applications
[![npm version](https://img.shields.io/npm/v/@azure/msal-browser.svg?style=flat)](https://www.npmjs.com/package/@azure/msal-browser/)[![npm version](https://img.shields.io/npm/dm/@azure/msal-browser.svg)](https://nodei.co/npm/@azure/msal-browser/)[![Coverage Status](https://coveralls.io/repos/github/AzureAD/microsoft-authentication-library-for-js/badge.svg?branch=dev)](https://coveralls.io/github/AzureAD/microsoft-authentication-library-for-js?branch=dev)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/guidedsetups/active-directory-javascriptspa" target="_blank">Getting Started</a> | <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-core/" target="_blank">Library Reference</a> |
| --- | --- | --- | --- | --- |

1. [About](#about)
2. [FAQ](./FAQ.md)
3. [Releases](#releases)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Usage](#usage)
    - [Advanced Topics](#advanced-topics)
7. [Samples](#samples)
8. [Authorization Code vs Implicit](#oauth-2.0-and-the-implicit-flow-vs-authorization-code-flow-with-pkce)
9. [Security Reporting](#security-reporting)
10. [License](#license)
11. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

The MSAL library for JavaScript enables client-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

The msal-browser package described by the code in this folder uses the msal-common package as a dependency to enable authentication in Javascript Single-Page Applications without backend servers. This version of the library uses the OAuth 2.0 Authorization Code Flow with PKCE. To read more about this protocol, as well as the differences between implicit flow and authorization code flow, see the section [below](#oauth-2.0-and-the-implicit-flow-vs-authorization-code-flow-with-pkce). If you are looking for the version of the library that uses the implicit flow, please see the [msal-core library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-core).

## FAQ

See [here](./FAQ.md).

## Installation
### Via NPM (Not available yet):

    npm install @azure/msal-browser

## Build and Run

### Build Library
```javascript
// bootstrap for sym-links (go to base folder)
lerna bootstrap
cd /lib/msal-common/
// To run build only for browser package
npm run build
// To run build for common and browser package
npm run build:all
```

### Run
To run sample, ensure the client_id and client_secret are updated and filled in.

```Javascript
cd samples/VanillaJSTestApp
npm start
```

## About this library - Authorization Code Flow (Alpha)
This is an improvement upon the current `msal-core` library which will utilize the authorization code flow in the browser. Most features available in the old library will be available in this one, but there are nuances to the authentication flow in both. 

**IMPORTANT:** Please be aware that this is not a production ready library. You are required to use a browser that disables CORS checks, and will be exposing a client secret. The server will be making changes that will allow CORS requests and remove the requirement for client secret for applications which are registered in a specific way, and we will have documentation explaining this when the features are available.

## Samples

The current VanillaJSTestApp sample is set up to run the authorization code flow in the browser. However, there are a few pre-requisites that you will need to complete before being able to run the VanillaJS sample. 

### Pre-requisites

- MSAL.js is meant to be used in [Single-Page Application scenarios](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-overview).

- Before using MSAL.js you will need to [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

1. Create a new application registration in the portal. Use whatever audience you wish, as long as it is testable on your machine. It is recommended to use the common audience (a.k.a. accounts in any Azure tenant) for simplest use.
    - Go to the Authentication tab. Register the redirect URI for the application as "http://localhost:30662/". Also select "Yes" when asked if you would like to treat this application as a public client.
    - Go the Certificates & Secrets tab. Create a Client Secret that you can use for testing. This will most likely not be a required step in future production versions for Auth Code in the browser, but for now in order to run the alpha you will need to create one.
2. Keep the app registration page open. You will now need a browser with CORS disabled in order to be able to retrieve tokens from the token endpoint. This is once again not a recommended production setting, but for the purposes of this alpha you should follow these instructions:
    - We recommend using Chrome for this. 
        - For Windows machines, you can do the following:
            - Right click on your desktop -> New -> Shortcut
            - Paste the following: 
            ```javascript
            "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=~/chromeTemp
            ```
            - Click next and create a name for the shortcut (i.e. Chrome-no-cors)
        - For other machines, you can follow the steps [here](https://alfilatov.com/posts/run-chrome-without-cors/) to figure out how to run Chrome withput CORS enabled for your OS.
3. You should now have a shortcut for a CORS-disabled Chrome browser and an application registration for a public client with the correct redirect URI registered and a client secret. You can now run the sample! When you run the browser shortcut, ensure you run as an administrator.

## Roadmap and What To Expect From This Library
MSAL support on Javascript is a collection of libraries. `msal-common` is the platform agnostic core library, and `msal-browser` is our core library for Single Page Applications (SPAs) without a backend. This library includes improvements for new browser requirements in Safari, as well as an updated token acquisition flow utilizing the OAuth 2.0 Authorization Code Flow.

Our goal is to communicate extremely well with the community and to take their opinions into account. We would like to get to a monthly minor release schedule, with patches comming as often as needed.  The level of communication, planning, and granularity we want to get to will be a work in progress.

Please check our [roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki#roadmap) to see what we are working on and what we are tracking next.

## OAuth 2.0 and the Implicit Flow vs Authorization Code Flow with PKCE
MSAL formerly only implemented the [Implicit Grant Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), as defined by the OAuth 2.0 protocol and [OpenID](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc).

Our goal is that the library abstracts enough of the protocol away so that you can get plug and play authentication, but it is important to know and understand the implicit flow from a security perspective.
The implicit flow runs in the context of a web browser which cannot manage client secrets securely. It is optimized for single page apps and has one less hop between client and server so tokens are returned directly to the browser. These aspects make it naturally less secure.
These security concerns are mitigated per standard practices such as- use of short lived tokens (and so no refresh tokens are returned), the library requiring a registered redirect URI for the app, library matching the request and response with a unique nonce and state parameter.

However, recent discussion among the IETF community has uncovered numerous vulnerabilities in the implicit flow. The MSAL library will now support the Authorization Code Flow with PKCE for Browser-Based Applications without a backend web server. You can read more about the [disadvantages of the implicit flow here](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-04#section-9.8.6).

We plan to continue support for the implicit flow in the library.

## Usage
The example below walks you through how to login a user and acquire a token to be used for Microsoft's Graph Api.

#### Prerequisites

Before using MSAL.js you will need to [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get a valid `clientId` and `clientSecret` for configuration, and to register the routes that your app will accept redirect traffic on.

Once you have created an application registration, create a new secret in the `Certificates & Secrets` section. **IMPORTANT NOTE:** Client secret will not be carried forward in production versions of the library. This is temporary until the server allows CORS requests from public clients.

#### 1. Initializing the Public Client Application

`PublicClientApplication` can be configured with a variety of different options, detailed in our [Wiki](), but the only required parameters are `auth.clientId` and `auth.tmp_clientSecret`. **IMPORTANT NOTE:** Client secret will not be carried forward in production versions of the library. This is temporary until the server allows CORS requests from public clients. 

```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        tmp_clientSecret: 'tmp_secret1'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
```

#### 2. Choose interaction type - redirect or popup

Choose which APIs you will use in your authentication flows:
- `loginRedirect` and `acquireTokenRedirect`
- `loginPopup` and `acquireTokenPopup`

If you are using the redirect APIs, you will need to include the helper function below with a valid callback API. If you do not use this, your application will error out if any of the redirect APIs are used. This is not needed for any popup APIs.

```javascript
msalInstance.handleRedirectCallback((error, response) => {
    // handle redirect response or error
});
```

#### 3. Login the user

Your app must login the user with either the `loginPopup` or the `loginRedirect` method to establish user context.

When the login methods are called and the authentication of the user is completed by the Azure AD service, an [id token](https://docs.microsoft.com/en-us/azure/active-directory/develop/id-tokens) is returned which is used to identify the user with some basic information.

When you login a user, you can pass in scopes that the user can pre-consent to on login. However, this is not required. Please note that consenting to scopes on login, does not return an access_token for these scopes, but gives you the opportunity to obtain a token silently with these scopes passed in, with no further interaction from the user.

It is best practice to only request scopes you need when you need them, a concept called dynamic consent. While this can create more interactive consent for users in your application, it also reduces drop-off from users that may be uneasy granting a large list of permissions for features they are not yet using.

AAD will only allow you to get consent for 3 resources at a time, although you can request many scopes within a resource.
When the user makes a login request, you can pass in multiple resources and their corresponding scopes because AAD issues an idToken pre consenting those scopes. However acquireToken calls are valid only for one resource / multiple scopes. If you need to access multiple resources, please make separate acquireToken calls per resource.

```JavaScript
var loginRequest = {
    scopes: ["user.read", "mail.send"] // optional Array<string>
};

msalInstance.loginPopup(loginRequest)
.then(response => {
    // handle response
})
.catch(err => {
    // handle error
});
```

#### 4. Get an access token to call an API

In MSAL, you can get access tokens for the APIs your app needs to call using the `acquireTokenSilent` method which makes a silent request(without prompting the user with UI) to Azure AD to obtain an access token. The Azure AD service then returns an [access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can use `acquireTokenRedirect` or `acquireTokenPopup` to initiate interactive requests, although, it is best practice to only show interactive experiences if you are unable to obtain a token silently due to interaction required errors. If you are using an interactive token call, it must match the login method used in your application. (`loginPopup`=> `acquireTokenPopup`, `loginRedirect` => `acquireTokenRedirect`).

If the `acquireTokenSilent` call fails, you may need to initiate an interactive request. This could happen for many reasons including scopes that have been revoked, expired tokens, or password changes.

`acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you.

See [Request and Response Data Types]() for reference.

```JavaScript
    // if the user is already logged in you can acquire a token
    if (msalInstance.getAccount()) {
        var tokenRequest = {
            scopes: ["user.read", "mail.send"]
        };
        msalInstance.acquireTokenSilent(tokenRequest)
            .then(response => {
                // get access token from response
                // response.accessToken
            })
            .catch(err => {
                // handle error
            });
    } else {
        // user is not logged in, you will need to log them in to acquire a token
    }
```

#### 5. Use the token as a bearer in an HTTP request to call the Microsoft Graph or a Web API

```JavaScript
    var headers = new Headers();
    var bearer = "Bearer " + token;
    headers.append("Authorization", bearer);
    var options = {
         method: "GET",
         headers: headers
    };
    var graphEndpoint = "https://graph.microsoft.com/v1.0/me";

    fetch(graphEndpoint, options)
        .then(resp => {
             //do something with response
        });
```

You can learn further details about MSAL.js functionality documented in the [MSAL Wiki](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki) and find complete [code samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples).

You can learn further details about MSAL.js functionality documented in the [MSAL Wiki](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki) and find complete [code samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples).

## Cache Storage

We offer two methods of storage for Msal, `localStorage` and `sessionStorage`.  Our recommendation is to use `sessionStorage` because it is more secure in storing tokens that are acquired by your users, but `localStorage` will give you Single Sign On accross tabs and user sessions.  We encourage you to explore the options and make the best decision for your application.

### forceRefresh to skip cache
If you would like to skip a cached token and go to the server, please pass in the boolean `forceRefresh` into the `AuthenticationParameters` object used to make a login / token request. **WARNING:** This should not be used by default, because of the performance impact on your application.  Relying on the cache will give your users a better experience, and skipping it should only be used in scenarios where you know the current cached data does not have up to date information.  Example: Admin tool to add roles to a user that needs to get a new token with updates roles.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
