## About
This is a sample that depicts how to integrate the `msal-node-extensions` library to your [electron](https://www.electronjs.org/) application that has been bundled by [webpack](https://webpack.js.org/).

## Getting started
To get started using this sample, you need to do the following:

**1. Change the MSAL Electron Configuration** \
Navigate to the `main.ts` file in the src folder and replace the `<CLIENT_ID>` with your client ID. Follow this [steps](https://docs.microsoft.com/en-us/graph/toolkit/get-started/build-an-electron-app#add-new-application-registration-in-azure-ad-to-get-a-client-id) to generate the client ID from Azure.

```js
// Initialize the electron authenticator
const config: MsalElectronConfig = {
    clientId: '<CLIENT_ID>', // <<== Replace this placeholder with your client ID
    mainWindow: mainWindow, //BrowserWindow instance that requires auth
    scopes: [
        'user.read',
        'people.read',
        'user.readbasic.all',
        'contacts.read',
        'presence.read.all',
        'presence.read',
        'user.read.all',
        'calendars.read',
        'Sites.Read.All',
        'Sites.ReadWrite.All',
    ],
    cachePlugin: new PersistenceCachePlugin(persistence),
};
```

**2. Run `npm install`** \
Run `npm install` or your preferred alternative to it, to install the dependencies necessary to run the sample.

```bash
npm install
```

**3. Start your application** \
To start your application, run the command below:

```bash
npm run start
```

> NOTE: If you encounter any errors related to having some of the binaries built with a different NODE_VERSION, run `npm run rebuild` to try rebuild the application with the right NODE_VERSION target