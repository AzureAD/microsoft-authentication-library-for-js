# Sample for Token Validation prototype

This is a sample that can run the prototype at `experimental/ms-identity-node`. Note that this is not a finished prototype or a finished sample, and is used for experimental purposes only.

## Instructions to run prototype

### In the Azure Portal

1. Set up or use an existing SPA application.

1. Create a custom scope. Make note of the tenant id, client id, and custom scope.

### In a msal-browser sample (e.g. VanillaJSTestApp2.0)

1. Replace client id, authority, and token request scopes with information from above app registration. Note that token request scopes should only have the custom scope, and no MS Graph scopes, otherwise you will get a token that cannot be validated.

1. Run the sample, sign in, and click get profile.

1. In the developers console, get the secret from the access token that has the custom scope (not Graph scopes).

### In the src/experimental/ms-identity-node POC library

1. Open `src/api/TokenValidator.ts`. Replace the URL in line 38 with your tenant information: e.g. `https://login.microsoftonline.com/<YOUR-SPA-APP-TENANT-ID>/discovery/v2.0/keys`

1. Build the library with `npm run build`.

### In this sample

1. Open `index.js`,

    1. Line 25: replace `common` in the authority with your SPA app tenant id. 
    1. Line 32: replace `raw-access-token` with the secret from the msal-browser sample above
    1. Remove lines 36-37 (unless you want to open the access token and add the issuer and audience here)

1. Run the sample with `npm install:local` and `npm start:build`

1. Navigate to `http://localhost:3000`

1. A successful token validation will display the token in the console, or otherwise show a validation error.
