# Microsoft Identity Token Validation for Node Sample - Basic Token Validation

**Note that this library has not been released, and this sample is used for experimental purposes only.**

## About this sample

This developer sample application demonstrates how to validate a token against claims using `node-token-validation`.

## How to run the sample

### Getting a token

#### In the Azure Portal

1. [Register a Single Page Application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration) or use an existing SPA application.

1. Create a custom scope in the `Expose an API` blade. Make note of the tenant id and custom scope.

#### In a msal-browser sample (e.g. [VanillaJSTestApp2.0](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0))

1. Replace authority and token request scopes with information from above app registration. Note that token request scopes should only have the custom scope, and no MS Graph scopes, otherwise the token will not be able to be validated using this library.

1. Run the sample, sign in, and click get profile.

1. In the developers console, get the secret from the access token that has the custom scope (not Graph scopes).

#### Get claims from token

1. Go to a website that can open JWT tokens (e.g. [jwt.ms](https://jwt.ms/))

1. Enter the token. Make note of the `iss` and `aud` fields, and any other information you want to validate.

### Run this sample

#### Configuration

1. Open `index.js`,

    1. Line 34: replace `common` in the authority with your SPA app tenant id.
    1. Line 44: replace `token-here` with the secret from the msal-browser sample above.
    1. Line 46: replace `issuer-here` with the `iss` field from the decoded token.
    1. Line 47: replace `audience-here` with the `aud` field from the decoded token.

#### Installation

```bash
# Install dev dependencies for node-token-validation and msal-common from root of repo
npm install

# Change directory to sample directory
cd samples/node-token-validation/basic-sample

# Build packages locally
npm run build:package

# Install local libs
npm run install:local

# Install sample dependencies
npm install
```

#### Running the sample

1. Run the sample with `npm start`.

1. Navigate to `http://localhost:3000`.

1. Successful token validation will display a response in the console, or otherwise throw a validation error.
