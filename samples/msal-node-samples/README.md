# MSAL Node Samples

The sample applications contained in this directory are independent samples of MSAL Node usage, covering each of the authorization flows that MSAL Node currently supports. MSAL Node covers many scenarios, and most developers will only need one of these samples.

## Which sample should I review?

Review our [scenario docs](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios) to pick an app type and authentication flow. Continue to the appropriate sample to learn how it works, or to build it in to your existing app.

| sample                                                                                   | app type                                      | auth flow                                  |
| ---------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| [auth-code](./auth-code/README.md)                                                       | web app (public client)                       | authorization code                         |
| [auth-code-pkce](./auth-code-pkce/README.md)                                             | web app (public client) (typescript)          | authorization code with PKCE in typescript |
| [auth-code-with-certs](./auth-code-with-certs/README.md)                                 | web app (confidential client)                 | authorization code                         |
| [auth-code-key-vault](./auth-code-key-vault/README.md)                                   | web app (confidential client)                 | authorization code                         |
| [auth-code-distributed-cache](./auth-code-distributed-cache/README.md)                   | web app (confidential client) (typescript)    | authorization code                         |
| [auth-code-cli-app](./auth-code-cli-app/README.md)                                       | console app (public client)                   | authorization code                         |
| [auth-code-cli-brokered-app](./auth-code-cli-brokered-app/README.md)                     | console app (public client)                   | authorization code                         |
| [silent-flow](./silent-flow/README.md)                                                   | web app (confidential client)                 | authorization code                         |
| [on-behalf-of](./on-behalf-of/README.md)                                                 | web API (confidential client)                 | on-behalf-of                               |
| [on-behalf-of-distributed-cache](./on-behalf-of-distributed-cache/README.md)             | web API (confidential client) (typescript)    | on-behalf-of                               |
| [refresh-token](./refresh-token/README.md)                                               | web app (confidential client)                 | refresh token                              |
| [username-password](./username-password/README.md)                                       | console app (public client)                   | resource owner password credentials        |
| [username-password-cca](./username-password-cca/README.md)                               | console app (confidential client)             | resource owner password credentials        |
| [device-code](./device-code/README.md)                                                   | browserless app (public client)               | device code                                |
| [client-credentials](./client-credentials/README.md)                                     | daemon app (confidential client)              | client credentials                         |
| [client-credentials-distributed-cache](./client-credentials-distributed-cache/README.md) | daemon app (confidential client) (typescript) | client credentials                         |
| [b2c-user-flows](./b2c-user-flows/README.md)                                             | web app (confidential client)                 | authorization code                         |
| [ElectronTestApp](./ElectronTestApp/README.md)                                           | desktop app (public client)                   | authorization code with PKCE               |

For in-depth tutorials, see:

-   [Developing a web app with MSAL Node](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-webapp-msal)
-   [Developing a daemon app with MSAL Node](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-console)
-   [Developing a desktop app with MSAL Node](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-desktop)
-   [Tutorial: Enable your Express web app to sign-in users and call APIs with the Microsoft identity platform](https://github.com/Azure-Samples/ms-identity-javascript-nodejs-tutorial)

### Other samples

These samples use MSAL Node in a variety of scenarios:

-   [React SPA with Express web app using the Backend For Frontend (BFF) Proxy architecture to authenticate users with Microsoft Entra ID and call Microsoft Graph](https://github.com/Azure-Samples/ms-identity-javascript-nodejs-tutorial/tree/main/5-AdvancedScenarios/1-call-graph-bff): Sample illustrating the BFF pattern to acquire tokens in a secure backend and share authentication state with a React single-page application.
-   [B2C user management sample](https://github.com/Azure-Samples/ms-identity-b2c-javascript-nodejs-management/tree/main/Chapter2): Command line app using OAuth 2.0 client credentials flow for performing user management operations in an Azure Active Directory B2C tenant
-   [Function API sample deployed to Azure Static Web Apps](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/4-Deployment/2-deploy-static): Azure Function web API using on-behalf-of flow
-   [Teams Tab SSO sample](https://github.com/pnp/teams-dev-samples/tree/main/samples/tab-sso/src/nodejs): Teams tab app demonstrating how integrate MSAL React and MSAL Node to achieve single sign-on

## How to run the samples?

### Clone this repository

First, get the sample files:

SSH:

```bash
    git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
    git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

You can also download the repository as a zip file by selecting **Download ZIP** from the root repository's dropdown **Code** menu. Once you've downloaded the `zip` file, you can decompress it locally and explore the code.

The next step is to navigate to the sample application's folder under `msal-node-samples` and either execute each sample as-is, or customize it to use your own [App Registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app#register-an-application).

From the repository's root directory, navigate to a sample application:

```bash
    cd samples/msal-node-samples/auth-code
```

### Pre-requisites

-   By using MSAL Node, you are working with the Microsoft identity platform. Read about [App Registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app#register-an-application) and register one to use with this code.
-   Install [Node.js](https://nodejs.org/en/) if needed.
-   Build MSAL Node. See the [guide](../../lib/msal-node/README.md#build-and-test).

### Configure the application

Each application has an `index.js` file, which is considered the entry point of the application. This file contains the application code demonstrating how to use each authorization flow. You can customize the sample to use your own Microsoft Entra app registration by changing the configuration values to match your app registration. Below you'll find an example of what the main MSAL configuration object looks like. This is the object you'll want to customize to match your app registration.

Some of the samples, like the `auth-code` sample, have a `config/` directory in which configuration files for different scenarios are included. You can also create your own configuration `.json` file based on the examples in the `config/` directory and just update the `scenario` variable in these sample applications to customize the configuration to match your Microsoft Entra app registration.

An exception is the client secret, which must be stored in an `.env` file instead of the configuration since secrets should never be hardcoded. The dotenv npm package can be used to store secrets or certificates in a .env file (located in project's root directory) that should be included in .gitignore to prevent accidental uploads of the secrets.

Please see "Certificates and Secrets" (https://learn.microsoft.com/azure/active-directory/develop/security-best-practices-for-app-registration#certificates-and-secrets) for more information.

```javascript
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY_URL",
        knownAuthorities: ["YOUR_KNOWN_AUTHORITY"], // typically applies to apps on Azure Active Directory B2C
        clientSecret: process.env.CLIENT_SECRET, // only applies to Confidential Client applications, such as backend web applications
    },
};
```

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your case, you can install all of the dependencies by running:

```bash
    npm install
```

Each sample also includes a `package.json` file that defines a `start` script, meaning you can execute each sample by running `npm start` from it's root folder (i.e. any of the subdirectories contained under `msal-node-samples`). The `npm start` command will either start a web application or a command line app. Either way, the console will instruct you on how to interact with the sample next.

1. Once the dependencies are installed, you can run the sample application by using the following command:

```bash
    npm start
```

2. If you're executing a web application scenario, navigate to `http://localhost:3000` (**3000** is the default port. This configuration can be changed in a sample's `index.js` file.).

3. For command line apps, follow the displayed instructions to use the sample application.
