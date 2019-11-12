
Microsoft Authentication Library for JavaScript (MSAL.js) (DRAFT)
=========================================================

| [Getting Started](https://docs.microsoft.com/en-us/azure/active-directory/develop/guidedsetups/active-directory-javascriptspa)| [AAD Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples)
| --- | --- | --- | --- | --- |


The MSAL library for JavaScript enables client-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)

## Installation
### Via NPM:

    npm install msal-browser

## How to Run Samples for Authorization Code Flow POC
The current VanillaJSTestApp sample is set up to run the authorization code flow in the browser. However, there are a few pre-requisites that you will need to complete before being able to run the POC. 

### Pre-requisites

1. Create an application registration in the portal. Use whatever audience you wish, as long as it is testable on your machine. It is recommended to use the common audience (a.k.a. accounts in any Azure tenant) for simplest use.
    - Go to the Authentication tab. Register the redirect URI for the application as "http://localhost:30662/". Also select "Yes" when asked if you would like to treat this application as a public client.
    - Go the Certificates & Secrets tab. Create a Client Secret that you can use for testing. This will most likely not be a required step in future production versions for Auth Code in the browser, but for now in order to run the POC you will need to create one.
2. Keep the app registration page open. You will now need a browser with CORS disabled in order to be able to retrieve tokens from the token endpoint. This is once again not a recommended production setting, but for the purposes of this POC you should follow these instructions:
    - We recommend using Chrome for this. You can follow the steps [here](https://alfilatov.com/posts/run-chrome-without-cors/) to figure out how to run Chrome withput CORS enabled for your OS.
    - For Windows machines, you can do the following:
        - Right click on your desktop -> New -> Shortcut
        - Paste the following: 
        ```javascript
        "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=~/chromeTemp
        ```
        - Click next and create a name for the shortcut (i.e. Chrome-no-cors)
3. You should now have a shortcut for a CORS-disabled Chrome browser and an application registration for a public client with the correct redirect URI registered and a client secret. You can now run the sample! When you run the browser shortcut, ensure you run as an administrator.

### Run the POC

1. Right click and run the browser shortcut you create as an administrator. You should see a new Chrome browser with the message:
    ```
    You are using an unsupported command-line flag: --disable-web-security. Stability and security will suffer.
    ```
    This means you have configured your browser correctly for this POC. Open the developer tools so you can see the console. You can click the drop down in the top-right of the developer tools to create a separate window. In the console and network tabs, hit the Settings icon and enable the `Preserve Log` option.

2. Clone this repository, and navigate to samples/VanillaJSTestApp. Open the index.html file and paste your Client Id and Client Secret in the appropriate configuration strings and save the file. If you are using a single tenant audience, change the authority string as well.

3. In your command line environment, ensure you have npm 6+ installed. Navigate to the root of the microsoft-authentication-library-for-js cloned repository folder and run the following commands (in order):
    ```javascript
    cd lib/msal-common-poc
    npm i
    cd ../msal-browser-poc
    npm i
    npm run build:all
    ```
    This will install all packages for the common and browser projects, and then build both projects successively.

4. Once both projects successfully build, you can run the sample:
    ```javascript
    cd ../../samples/VanillaJSTestApp
    npm i
    npm start
    ```

5. Navigate to `localhost:30662` in the browser you opened in (1). Click sign-in, and you should navigate to the sign-in page. Enter your credentials and submit. You should be navigated back to the sample page, and the response with your tokens will eventually appear in the console window of your Chrome developer tools.

## Roadmap and What To Expect From This Library
MSAL support on Javascript is a collection of libraries. `msal-common` is the platform agnostic core library, and `msal-browser` is our core library for Single Page Applications (SPAs) without a backend. This library includes improvements for new browser requirements in Safari, as well as an updated token acquisition flow utilizing the OAuth 2.0 Authorization Code Flow.

Our goal is to communicate extremely well with the community and to take their opinions into account. We would like to get to a monthly minor release schedule, with patches comming as often as needed.  The level of communication, planning, and granularity we want to get to will be a work in progress.

Please check our [roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki#roadmap) to see what we are working on and what we are tracking next.

## OAuth 2.0 and the Implicit Flow vs Authorization Code Flow with PKCE
Msal used to only implement the [Implicit Grant Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), as defined by the OAuth 2.0 protocol and [OpenID](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc).

Our goal is that the library abstracts enough of the protocol away so that you can get plug and play authentication, but it is important to know and understand the implicit flow from a security perspective.
The implicit flow runs in the context of a web browser which cannot manage client secrets securely. It is optimized for single page apps and has one less hop between client and server so tokens are returned directly to the browser. These aspects make it naturally less secure.
These security concerns are mitigated per standard practices such as- use of short lived tokens (and so no refresh tokens are returned), the library requiring a registered redirect URI for the app, library matching the request and response with a unique nonce and state parameter.

However, recent discussion among the IETF community has uncovered numerous vulnerabilities in the implicit flow. The MSAL library will now support the Authorization Code Flow with PKCE for Browser-Based Applications without a backend web server. You can read more about the [disadvantages of the implicit flow here](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-04#section-9.8.6).

We plan to continue support for the implicit flow in the library.

## Usage
The example below walks you through how to login a user and acquire a token to be used for Microsoft's Graph Api.

#### Prerequisite

Before using MSAL.js you will need to [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

> TBD

You can learn further details about MSAL.js functionality documented in the [MSAL Wiki](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki) and find complete [code samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples).

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
