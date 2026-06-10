# MSAL.js Playwright Testing Example

⚠️ Warning: The ROPC Flow should only be used for testing and is not suitable for authenticating users outside of a testing environment ⚠️

## About this sample

This sample demonstrates how you can run e2e tests against an application that uses msal-browser to obtain tokens and sign users in.

Tokens are acquired by making a direct ROPC (Resource Owner Password Credentials) request to the Microsoft identity platform token endpoint. The raw server response is then injected into the browser's MSAL cache using [`loadExternalTokens`](../../../lib/msal-browser/docs/testing.md) via Playwright's `page.evaluate` API.

Because `loadExternalTokens` runs **inside the browser**, it writes tokens using the same cache key schema as `@azure/msal-browser`, which means the application will recognise the user as already signed in without needing to navigate through the Microsoft Entra ID sign-in pages.

## Pre-requisites

- Ensure the `clientId` and `authority` in `test/browser-test.spec.ts` match those in `app/authConfig.js`
  - You must use a tenanted authority to use the ROPC flow
- Supply test credentials via `TEST_USERNAME` and `TEST_PASSWORD` environment variables (or update `getCredentials()` in the test file to use your own secrets manager)
- Ensure the scopes listed in `test/browser-test.spec.ts` cover all the tokens your SPA needs

## Run the test

```bash
# Install dependencies (includes @azure/msal-browser whose UMD bundle is served to the browser)
npm install

# Run tests using Playwright
npm test
```
