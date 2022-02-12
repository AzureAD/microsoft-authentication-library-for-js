# Sample for Token Validation prototype

This is a sample that can run `node-token-validation` and validate a token against claims.

**Note that this library has not been released, and this sample is used for experimental purposes only.**

## Instructions to run prototype

### In the Azure Portal

1. Set up or use an existing SPA application.

1. Create a custom scope. Make note of the tenant id, client id, and custom scope.

### In a msal-browser sample (e.g. [VanillaJSTestApp2.0](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0))

1. Replace client id, authority, and token request scopes with information from above app registration. Note that token request scopes should only have the custom scope, and no MS Graph scopes, otherwise you will get a token that cannot be validated.

1. Run the sample, sign in, and click get profile.

1. In the developers console, get the secret from the access token that has the custom scope (not Graph scopes).

### Go to a website that can open JWT tokens (e.g. [jwt.ms](https://jwt.ms/))

1. Enter the token. Make note of the `iss` and `aud` fields, and any other information you want to validate.

### In the src/lib/node-token-validation library

1. Build the library with `npm run build`.

### In this sample

1. Open `index.js`,

    1. Line 33: replace `client-id-here` with the client Id of your SPA app.
    1. Line 34: replace `common` in the authority with your SPA app tenant id.
    1. Line 44: replace `token-here` with the secret from the msal-browser sample above.
    1. Line 46: replace `issuer-here` with the `iss` field from the decoded token.
    1. Line 47: replace `audience-here` with the `aud` field from the decoded token.

1. Run the sample with `npm install:local` and `npm start:build`.

1. Navigate to `http://localhost:3000`.

1. Successful token validation will display a response in the console, or otherwise throw a validation error.
