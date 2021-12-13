# MS Identity Node - Proof of Concept for Token Validation Library
**Note: With this library being a proof of concept, it is not recommended to be used for applications intended for production.**

Ms-identity-node is a proof of concept that allows JWT tokens to be validated.

## Getting started

### Register an application in the Azure Portal

1. Set up or use an existing SPA application.

1. Create a custom scope. Make note of the tenant id, client id, and custom scope.

### Getting a token from a msal-browser sample (e.g. VanillaJSTestApp2.0)

1. Replace client id, authority, and token request scopes with information from above app registration. Note that token request scopes should only have the custom scope, and no MS Graph scopes, otherwise you will get a token that cannot be validated.

1. Run the sample, sign in, and click get profile.

1. In the developers console, get the secret from the access token that has the custom scope (not Graph scopes).

### In this POC library

1. Open `src/api/TokenValidator.ts`. Replace the URL in line 38 with your tenant information: e.g. `https://login.microsoftonline.com/<YOUR-SPA-APP-TENANT-ID>/discovery/v2.0/keys`

1. Build the library with `npm run build`.

### Configuring in the ms-identity-node-samples token validation sample

1. Open `index.js`,

    1. Line 25: replace `common` in the authority with your SPA app tenant id. 
    1. Line 32: replace `raw-access-token` with the secret from the msal-browser sample above
    1. Remove lines 36-37 (unless you want to open the access token and add the issuer and audience here)

1. Run the sample with `npm install:local` and `npm start:build`

1. Navigate to `http://localhost:3000`

1. A successful token validation will display the token in the console, or otherwise show a validation error.

## What to expect from this library

Because this library is a proof of concept, it is scoped to specific features and does not implement all the capabilities of an official MS token validation library.

This proof of concept is scoped to consider:

* Parsing JWT tokens
* Checking the type and signature of a JWT token
* Checking certain claims of a JWT token (currently issuer, audience, and token lifetime)

This proof of concept does not implement:

* Claims checks for all claims relevant to id tokens and access tokens
* Validating scopes
* Retrieving tokens from headers or bodies of requests
* Token validation for protected forward tokens, B2C tokens, PoP tokens, or refresh tokens
* App proxy or Conditional Access Evaluation

## Methods

The only method currently available in this POC is `validateToken` on the `TokenValidator` class. Other methods and APIs will be added to the official token validation library.

Method                                 | Description |
-------------------------------------- | ----------- |
validateToken                          | Validates a provided token's type, signature, and selected claims. Returns an object with `isValid` flag, the protected header, and the token payload. |
