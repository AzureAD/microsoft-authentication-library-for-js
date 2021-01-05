# MSAL Node Electron Sample

An Electron application built with TypeScript that uses the MSAL Node library to acquire and store access tokens to authenticate with the Microsoft Graph API. 

## Should I use this sample:

Understanding the way MSAL Node is used in this sample will help you if you're interested in building an Electron.js application to authenticate and acquire tokens using AzureAD.

## How to run the samples:

### Clone this repository

First, clone the MSAL directory:

SSH:

```bash
$ git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
$ git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

You can also download the repository as a zip file by selecting "Download ZIP" from the root repository's dropdown "Code" menu. Once you've downloaded the ZIP file, you can decompress it locally and explore the code.

### Pre-requisites
- By using MSAL Node, you are working with the Microsoft Identity ecosystem. Read about [App Registrations](https://docs.microsoft.com/en-us/graph/auth-register-app-v2) and register one for use with this code.
- Install [Node.js](https://nodejs.org/en/) and [Electron.js](https://www.electronjs.org/) if needed.
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
$ cd samples/msal-node-samples/standalone-samples/ElectronTestApp
```

### Configure the application

The MSAL configuration object in the ElectronTestApp is defined in the `AuthProvider.ts` file. Look for the MSAL_CONFIG object and update the clientId and authority to match your [App Registration](https://docs.microsoft.com/en-us/graph/auth-register-app-v2).

```javascript
const MSAL_CONFIG: Configuration = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY",
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        }
    }
};
```

This application utilizes the `User.Read` and `Mail.Read` Microsoft Graph Scopes, so make sure they are enabled in your App Registration.

**Note: If you'd like to configure custom scopes for this sample application, you'll need to modify the request scopes in the `setRequestObjects()` method within `AuthProvider.ts`.**

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your case, you can install all of the dependencies by running:

```bash
$ npm install
```

When the dependencies have been installed, you can run the sample application by using the following command, after which the Electron application should start.

```bash
$ npm start
```
