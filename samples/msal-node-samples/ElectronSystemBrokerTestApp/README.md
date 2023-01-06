# MSAL Node Electron Sample Using System broker

An Electron application built with TypeScript that uses MSAL Node to acquire and store access tokens to authenticate with the Microsoft Graph API.

## Should I use this sample

This sample demonstrates how to use **MSAL Node** to sign in a user and acquire an access token for a protected resource such as **Microsoft Graph** in an Electron desktop application using the system broker. Native apps that use the broker for authorization are more secure and can take advantage of the user's authentication session in the OS to enable single sign-on.

## How to run the samples

### Clone this repository

First, clone the MSAL directory:

SSH:

```bash
 git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
 git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

You can also download the repository as a zip file by selecting "Download ZIP" from the root repository's dropdown "Code" menu. Once you've downloaded the ZIP file, you can decompress it locally and explore the code.

### Pre-requisites

- By using MSAL Node, you are working with the Microsoft Identity ecosystem. Read about [App Registrations](https://docs.microsoft.com/graph/auth-register-app-v2) and register one for use with this code.
- Install [Node.js](https://nodejs.org/en/), [Electron.js](https://www.electronjs.org/) and [TypeScript](https://www.typescriptlang.org/) if needed.
- Import [Electron forge CLI](https://www.electronforge.io/import-existing-project)
- Install the MSAL Node package:  
  
```bash
npm install @azure/msal-node
```

- If you are customizing or building locally, navigate to the `lib/msal-node` directory and build it using the following command:
  
```bash
npm run build:package
```

- From the repository's root directory, navigate to the Electron sample application:

```bash
cd samples/msal-node-samples/standalone-samples/ElectronSystemBrokerTestApp
```

### Register the application

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
     - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-desktop`.
     - In the **Supported account types** section, select **Accounts in any organizational directory and personal Microsoft accounts (e.g. Skype, Xbox, Outlook.com)**.
     - Select **Register** to create the application.
1. In the list of pages for the app, select **Authentication**.
1. Select **Add a platform**, select **Mobile and desktop applications**.
1. In the **Redirect URIs** list, under **Suggested Redirect URIs for (mobile, desktop)** be sure to add `http://localhost` to the list of **Redirect URIs**.
1. Select **Configure**.

### Configure the application

1. Open the [.customConfig.js](./src/config/customConfig.json) file and provide the required configuration values.
   1. Replace the string `Enter_the_Application_Id_Here` with your app/client ID on Azure AD portal for the `clientId` key.
   1. Replace the string `Enter_the_Tenant_Info_Here` with your tenant ID on Azure AD portal.
   1. Replace the string `Enter_the_Cloud_Instance_Id_Here` with `https://login.microsoftonline.com`.
   1. Replace the string `Enter_the_Graph_Endpoint_Here`. with `https://graph.microsoft.com/v1.0`.

> :information_source: *note*: This is for multi-tenant applications located on the Global Azure cloud. For more information, see: [Use MSAL in a national cloud environment](https://docs.microsoft.com/azure/active-directory/develop/authentication-national-cloud)

> :information_source: *note*: This is for MS Graph instance located on the Global Azure cloud. For more information, see: [Use Microsoft Graph in a national cloud environment](https://docs.microsoft.com/graph/deployments)

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your App Registration and registered Redirect URI, you can install all of the dependencies by running:

```bash
npm install
```

When the dependencies have been installed, you can run the sample application by using the following command, after which the Electron application should start.

```bash
cd samples/msal-node-samples/standalone-samples/ElectronSystemBrowserTestApp/redirect
$ npm start
```

```bash
cd samples/msal-node-samples/ElectronSystemBrowserTestApp
npm start
```
