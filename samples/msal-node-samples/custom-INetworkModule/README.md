# MSAL Node Standalone Sample: Custom INetworkModule Implementation

This sample demonstrates how to implement a custom [INetworkModule](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.INetworkModule.html) that makes it simple for developers to debug network errors and write custom proxy support. There are two ways to run the sample: one is "as-is" in app.ts, the other is via an express server in express.ts.

## Note

This sample is written in TypeScript and was developed with Node version 23.4.0.

## Setup

In a terminal, navigate to the directory where `package.json` resides. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
2. Select the **App Registrations** blade on the left, then select **New registration**.
3. In the **Register an application page** that appears, enter registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `Confidential Client Application`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
4. Select **Register** to create the application.
5. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. These values will be used in the app's configuration file(s) later.
6. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - In the **Client secrets** section, select **New client secret**.
    - Type a key description (for instance `app_secret`),
    - Select one of the available key durations (6 months, 12 months or Custom).
    - The generated key value will be displayed when the **Add** button is selected. Copy and save the generated value for use in later steps.

Before running the sample, the values in the configuration object in app.ts or express.ts will need to be replaced:

```javascript
const config = {
    auth: {
        clientId: "<ENTER_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<ENTER_TENANT_ID>",
        clientSecret: "<ENTER_CLIENT_SECRET>",
    },
    ...
};
```

## Implement a custom INetworkModule

There are two approaches to implementing a custom INetworkModule in this sample.

2. A custom INetworkModule that uses Axios for network requests resides in HttpClientAxios.ts and can be imported to app.ts or express.ts. HttpClientAxios.ts can be edited to include console.log()'s to see how network traffic is processed. `NOTE: Axios does not support proxy functionality. Therefore, neither does HttpClientAxios. Proxy support must be written by the developer.`
3. A custom INetworkModule can be implemeted inline in the system configuration. Stubs to mock the default implementation of INetworkModule have been provided.

## Run the app

Before running the sample (and everytime changes are made to the sample), the TypeScript will need to be compiled. In the same folder, type:

```console
    npx tsc
```

This will compile the TypeScript into JavaScript, and put the compiled files in the /dist folder.

The sample can now be run by typing:

```console
    node dist/app.js
```

or

```console
    node dist/express.js
```

Two different npm scripts, which will run the above npx and node commands, have been configured in package.json. To compile and start either sample, type:

```console
    npm run start:app
```

or

```console
    npm run start:express
```

### If using `npm run start:app`

The token returned from Microsoft Entra ID should be immediately displayed in the terminal.

### If using `npm run start:express`

http://localhost:3000 must be navigated to in a browser.

The token should then be returned from Microsoft Entra ID and displayed in the terminal.
