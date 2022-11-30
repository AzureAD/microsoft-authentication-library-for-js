# MSAL Node Electron Sample that integrates MSAL Node Extensions to enable cache persistence

This is a sample that depicts how to integrate the `msal-node-extensions` library to your [electron](https://www.electronjs.org/) application that has been bundled by [webpack](https://webpack.js.org/).

## How to run the samples

### Clone this repository

SSH:

```bash
 git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
 git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

You can also download the repository as a zip file by selecting "Download ZIP" from the root repository's dropdown "Code" menu. Once you've downloaded the ZIP file, you can decompress it locally and explore the code (see: [Register the application](#register-the-application)).

### Pre-requisites

- By using MSAL Node, you are working with the Microsoft Identity ecosystem. Read about [App Registrations](https://docs.microsoft.com/graph/auth-register-app-v2) and register one for use with this code.
- Install [Node.js](https://nodejs.org/en/), [Electron.js](https://www.electronjs.org/) and [TypeScript](https://www.typescriptlang.org/) if needed.
- Import [Electron forge CLI](https://www.electronforge.io/import-existing-project)
- Install the MSAL Node package:  

```bash
npm install @azure/msal-node
npm install @azure/msal-node-extensions
```

- If you are customizing or building locally, navigate to the `lib/msal-node` directory and build it using the following command:

```bash
npm run build:package
```

- From the repository's root directory, navigate to the Electron sample application:

```bash
cd extensions/samples/electron-webapp
```

### Register the application

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
     - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-desktop`.
     - In the **Supported account types** section, select **Accounts in this organizational directory only**.
     - Select **Register** to create the application.
1. In the list of pages for the app, select **Authentication**.
1. Select **Add a platform**, select **Mobile and desktop applications**.
1. In the **Redirect URIs** list, under **Suggested Redirect URIs for (mobile, desktop)** be sure to add `http://localhost` to the list of **Redirect URIs**.
1. Select **Configure**.

### Configure the application

1. Open the [.authConfig.ts](./src/authConfig.ts) file and provide the required configuration values.
   1. Replace the string `Enter_the_Application_Id_Here` with your app/client ID on Azure AD portal.
   1. Replace the string `Enter_the_Tenant_Info_Here` with your tenant ID on Azure AD portal.
   1. Replace the string `Enter_the_Cloud_Instance_Id_Here` with `https://login.microsoftonline.com`.

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your App Registration and registered Redirect URI, you can install all of the dependencies by running:

```bash
cd extensions/samples/electron-webapp
npm install
npm start
```
