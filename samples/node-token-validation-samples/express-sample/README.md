# Microsoft Identity Token Validation for Node Sample - Express.js Application

## About this sample

This developer sample application demonstrates how to use the Authorization Code Grant APIs provided by MSAL Node.js to sign in and acquire tokens in an Express.js application, and then validate tokens using the Node Token Validation library.

### How is this scenario used?

The Auth Code flow is most commonly used for a web app that signs in users.  General information about this scenario is available [here](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-app-sign-user-overview?tabs=aspnetcore).

More information about MSAL Node and the different scenarios and flows it supports can also be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node).

## How to run the sample

### Configure the application

#### In the Azure Portal

1. [Register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app#register-an-application) or use an existing application.
1. Make note of the client id, tenant id, and redirectUri.
1. Create a custom scope in the `Expose an API` blade.
1. Create a client secret in the `Certificates & Secrets` blade.

#### In the sample

1. Open `./appSettings.js` in an editor.
    1. Add the following from your portal registration:
        1. Replace `client-id` with the Application (client) ID
        1. Replace `authority` with `https://login.microsoftonline.com/YOUR_TENANT_ID_HERE` with your Directory (tenant) ID
        1. Replace `tenant-id` with the Directory (tenant) ID
        1. Replace `client-secret` with your client secret
        1. Replace `add-custom-scope-here` with your custom scope
    1. Add claims to validate your token:
        1. Add valid issuers, or replace `YOUR_TENANT_ID_HERE` with your Directory (tenant) ID
        1. Add valid audience, or replace `YOUR_CLIENT_ID_HERE` with your Application (client) ID
1. Open `app.js`
    1. Replace `ADD_CLIENT_SECRET_HERE` with your client secret on line 34.

Your configuration should look like this:

```js
const appSettings = {
    appCredentials: {
        clientId: "YOUR_CLIENT_ID",
        authority: "http://login.microsoftonline.com/YOUR_TENANT_ID",
        tenantId: "YOUR_TENANT_ID",
        clientSecret: "YOUR_CLIENT_SECRET",
        protocolMode: "AAD"
    },
    authRoutes: {
        redirect: "/redirect",
        error: "/error",
        unauthorized: "/unauthorized"
    },
    settings: {
        redirectUri: "http://localhost:4000/redirect",
        postLogoutRedirectUri: 'http://localhost:4000/'
    },
    protectedResources: {
        custom: {
            scopes: ["YOUR_CUSTOM_SCOPE"]
        }
    },
    validationParameters: {
        validIssuers: [`https://sts.windows.net/YOUR_TENANT_ID_HERE/`],
        validAudiences: [`api://YOUR_CLIENT_ID_HERE`]
    }
}
```

**Note:** Only access tokens with custom scopes are able to be validated at this time. Access tokens with Microsoft Graph scopes will result in a signature validation error.

### Install npm dependencies for sample

```bash
# Install dev dependencies for node-token-validation, msal-node, and msal-common from root of repo
npm install

# Change directory to sample directory
cd samples/node-token-validation/express-sample

# Build packages locally
npm run build:package

# Install local libs
npm run install:local

# Install sample dependencies
npm install
```

### Running the sample

1. Run the sample with `npm start`.
1. Navigate to `http://localhost:4000`.
1. Sign in with your AAD account if prompted.
1. Click the `Get and validate a token` button to acquire a token and validate it.
1. Successful token validation will display the token scope on the page, or otherwise throw a validation error.

### Learn more about msal-node

To learn more about other supported account types and configuring your app as a Confidential Client Application, see our msal-node samples [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples).
