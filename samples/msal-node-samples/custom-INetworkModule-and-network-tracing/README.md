# MSAL Node Standalone Sample: Custom INetworkModule Implementation and Network Tracing Via "Fiddler Everywhere"

This sample demonstrates how to implement a custom [INetworkModule](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.inetworkmodule.html) that makes it simple for developers to debug network errors. Additionally, instructions are provided on how to use [Fiddler Everywhere](https://www.telerik.com/fiddler/fiddler-everywhere) to perform a network trace of the application.

Fiddler Everywhere is not supported on all operating systems. [Fiddler Classic](https://www.telerik.com/fiddler/fiddler-classic) is a free Windows-only version of Fiddler Everywhere.

## Note
This sample is written in TypeScript and was developed with Node version 16.14.0.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
2. Select the **App Registrations** blade on the left, then select **New registration**.
3. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `Confidential Client Application`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
4. Select **Register** to create the application.
5. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
6. In the app's registration screen, select the **Certificates & secrets** blade in the left.
   - In the **Client secrets** section, select **New client secret**.
   - Type a key description (for instance `app_secret`),
   - Select one of the available key durations (6 months, 12 months or Custom) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy and save the generated value for use in later steps.

Before running the sample, you will need to replace the values in the configuration object in app.ts:

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

## Implement your own custom INetworkModule

There are two approaches to implementing a custom INetworkModule in this sample.
1. The default msal-node (as of v1.14.2) INetworkModule has been copied to HttpClient.ts and can be imported to app.ts to be used as custom INetworkModule. You can edit HttpClient.ts to include console.log()'s to see how network traffic is processed.
2. You can implement your own custom INetworkModule inline. Stubs to mock the default implementation of INetworkModule have been provided.

## Use Fiddler Everywhere to perform a network trace
Fiddler acts as a proxy and monitors all traffic on your local network

1. Download and install [Fiddler Everywhere](https://www.telerik.com/download/fiddler-everywhere)
2. Uncomment the proxyUrl line - this tells the sample app to route all traffic through the proxy that Fiddler Everywhere operates on (the port can be configured in the settings of Fiddler Everywhere)

## Run the app

Before running the sample (and everytime you make changes to the sample), the TypeScript will need to be compiled. In the same folder, type:

```console
    npx tsc
```
This will compile the TypeScript into JavaScript, and put the compiled files in the /dist folder.

The sample can now be run by typing:
```console
    node dist/app.js
```

An npm script, which will run both of these commands, has been configured in package.json. To compile and start the sample, type:
```console
    npm run start
```

After that, you should see the token returned from Azure AD in your terminal.

If you downloaded, installed, are running Fiddler Everywhere, and uncommented the proxyUrl line, you will see the network requests inside of Fiddler Everywhere.