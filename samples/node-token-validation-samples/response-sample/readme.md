# Microsoft Identity Token Validation for Node Sample - Token Acquisition with MSAL-Node

## About this sample

This developer sample application demonstrates how to use the Authorization Code Grant APIs provided by MSAL Node.js to acquire tokens in a Node application, and then to validate tokens using the Node Token Validation library.

### How is this scenario used?

The Auth Code flow is most commonly used for a web app that signs in users.  General information about this scenario is available [here](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-app-sign-user-overview?tabs=aspnetcore).

More information about MSAL Node and the different scenarios and flows it supports can also be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node).

## How to run the sample

### Configure the application

#### Default configuration

This sample has been set up with default lab configuration values and can be run as is. If you wish to configure the app to validate tokens from your own app, see the custom configuration instructions below.

#### Custom configuration

##### In the Azure Portal

1. [Register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app#register-an-application) or use an existing application.
1. [Optional] Create a custom scope in the `Expose an API` blade.
1. Make note of the tenant id, client id, and custom scope.

##### In the sample

1. Open `./config/customConfig.json` in an editor.
1. Replace the following:
    1. Client id with the Application (client) ID from the portal registration
    1. Authority with `https://login.microsoftonline.com/YOUR_TENANT_ID_HERE` with your Directory (tenant) ID
    1. Add your Directory (tenant) ID to authOptions

Your configuration should look like this:

```json
{
    "authOptions": {
        "clientId": "YOUR_CLIENT_ID",
        "authority": "https://login.microsoftonline.com/YOUR_TENANT_ID",
        "tenantId": "YOUR_TENANT_ID",
        "protocolMode": "AAD"
    },
    "request": {
        "authCodeUrlParameters": {
            "redirectUri": "http://localhost:3000/redirect"
        },
        "tokenRequest": {
            "redirectUri": "http://localhost:3000/redirect"
        }
    },
    "validationParams": {
        "idTokenOptions": {
            "validIssuers": ["https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0"],
            "validAudiences": ["YOUR_CLIENT_ID"]
        }
    }
}
```

##### Adding access token validation params and validating a custom token

1. Open `./config/customConfig.json` in an editor.
1. In addition to the steps above:
    1. Add a custom scopes to the `tokenRequest`.
    1. Add `accessTokenOptions` to `validationParams`, including both `validIssuers` and `validAudiences` and any other claims you wish to validate on the access token.
1. Open `./index.js` in an editor.
    1. Add `accessTokenOptions` to line 139, after `idTokenOptions`.

**Note:** Only access tokens with custom scopes are able to be validated at this time. Access tokens with Microsoft Graph scopes will result in a signature validation error.

Your configuration should look like this:

```json
{
    "authOptions": {
        "clientId": "YOUR_CLIENT_ID",
        "authority": "https://login.microsoftonline.com/YOUR_TENANT_ID",
        "tenantId": "YOUR_TENANT_ID",
        "protocolMode": "AAD"
    },
    "request": {
        "authCodeUrlParameters": {
            "redirectUri": "http://localhost:3000/redirect",
            "scopes": ["YOUR_CUSTOM_SCOPE"] // Optional
        },
        "tokenRequest": {
            "redirectUri": "http://localhost:3000/redirect",
            "scopes": ["YOUR_CUSTOM_SCOPE"] // Optional
        }
    },
    "validationParams": {
        "idTokenOptions": {
            "validIssuers": ["https://login.microsoftonline.com/YOUR_TENANT_ID/v2.0"],
            "validAudiences": ["YOUR_CLIENT_ID"]
        },
        "accessTokenOptions": {
            "validIssuers": ["https://sts.windows.net/YOUR_TENANT_ID/"],
            "validAudiences": ["api://YOUR_CLIENT_ID"]
        }
    }
}

### Install npm dependencies for sample

```bash
# Install dev dependencies for node-token-validation, msal-node, and msal-common from root of repo
npm install

# Change directory to sample directory
cd samples/node-token-validation/response-sample

# Build packages locally
npm run build:package

# Install local libs
npm run install:local

# Install sample dependencies
npm install
```

### Running the sample

1. Run the sample with `npm start`.
1. Navigate to `http://localhost:3000`.
1. Sign in with your AAD account if prompted.
1. Successful token validation will display a response in the console, or otherwise throw a validation error.

### Learn more about msal-node

To learn more about other supported account types and configuring your app as a Confidential Client Application, see our msal-node samples [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples).
