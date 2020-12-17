# MSAL.js Jest/Puppeteer Testing Example

⚠️ Warning: The ROPC Flow in msal-node should only be used for testing and is not suitable for authenticating users outside of a testing environment ⚠️

## About this sample

This sample demonstrates how you can run e2e tests against an application that uses msal-browser to obtain tokens and sign users in.
Using the [ROPC flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth-ropc) in [msal-node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) you can pre-populate local or session storage with tokens without requiring your test to navigate through the AAD sign-in pages. This allows you to test your application with a real user and real tokens without testing 3rd party sites.

## Pre-requisites

- Ensure the clientId and authority in `test/browser-test.spec.ts` (msal-node configuration) match what is set in `app/authConfig.js` (msal-browser configuration)
  - You must use a tenanted authority to use the ROPC flow
- Implement a function to get a username and password for the test account
- Ensure the `usernamePasswordRequest` request contains the same scopes your SPA needs tokens for, making several requests if needed.

## Run the test

```javascript
// Install dependencies
npm install
// Run tests using jest and puppeteer
npm test
```
