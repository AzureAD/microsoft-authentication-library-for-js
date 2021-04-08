# MSAL Node Samples

The sample applications contained in this directory are independent samples of MSAL Node usage, covering each of the authorization flows that MSAL Node currently supports. MSAL Node covers many scenarios, and most developers will only need one of these samples.

## Should I use this sample:

Use these samples to get an idea of the flows that work for you.

## How to run the samples:

### Clone this repository

First, get the sample files:

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
- By using MSAL Node, you are working with the Microsoft identity platform.  Read about [App Registration](https://docs.microsoft.com/graph/auth-register-app-v2) and register one for use with this code.
- Install [Node.js](https://nodejs.org/en/) if needed
- Install the MSAL Node package:  
```bash
npm install @azure/msal-node
```
- If you are customizing or building locally:
```bash
npm run build:package
```

The next step is to navigate to the sample application directories under `msal-node-samples` and either execute each sample as-is, or customize it to use your own [App Registration](https://docs.microsoft.com/graph/auth-register-app-v2).

From the repository's root directory, navigate to a sample application:

```bash
$ cd samples/msal-node-samples/auth-code
```

### Which sample should I review?

Review our [scenario docs](https://docs.microsoft.com/azure/active-directory/develop/authentication-flows-app-scenarios) to pick a sample.

Continue to the appropriate sample to learn how it works, or to build it in to your existing app.

- [Auth Code](auth-code/readme.md) [web app]
- [Client Credentials](client-credentials/readme.md) [console app]
- [Device Code](device-code/readme.md) [headless app]
- [On Behalf Of](on-behalf-of/web-app/readme.md) [calling MS Graph]
- [Silent Flow](silent-flow) [web app showing cache usage]
- [B2C Auth Code](b2c-auth-code/README.md) [web app on Azure AD B2C]
- [Auth Code w/ PKCE](ElectronTestApp/README.md) [desktop app]

For in-depth tutorials, see:

- [Securing a web app](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-webapp-msal)
- [Securing a console app](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-console)
- [Securing a desktop app](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-desktop)

### Configure the application

Each application has an `index.js` file, which is considered the entry point of the application. This file contains the application code demonstrating how to use each authorization flow. You can customize the sample to use your own AzureAD app registration by changing the configuration values to match your app registration. Below you'll find an example of what the main MSAL configuration object looks like. This is the object you'll want to customize to match your app registration.

Some of the samples, like the `auth-code` sample, have a `config/` directory in which configuration files for different scenarios are included. You can also create your own configuration `.json` file based on the examples in the `config/` directory and just update the `scenario` variable in these sample applications to customize the configuration to match your AzureAD app registration.

```javascript
// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret when using a ConfidentialClientApplication
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY_URL",
        knownAuthorities: ["YOUR_KNOWN_AUTHORITY"], // typically applies to apps on Azure AD B2C
        clientSecret: "YOUR_CLIENT_SECRET" // only applies to Confidential Client applications, such as desktop and backend web applications
    },
    system: {
        // You can add the loggerOptions below if you'd like to see MSAL's debug logs during execution.
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
```

### Executing the application

Once you are in the sample application directory and you've configured the sample application to match your case, you can install all of the dependencies by running:

```bash
$ npm install
```

Each sample also includes a `package.json` file that defines a `start` script, meaning you can execute each sample by running `npm start` from it's root folder (i.e. any of the subdirectories contained under `msal-node-samples`). The `npm start` command will either start a web application or a command line app. Either way, the console will instruct you on how to interact with the sample next.

1. Once the dependencies are installed, you can run the sample application by using the following command:

```bash
$ npm start
```

2. If you're executing a web application scenario, navigate to http://localhost:3000 (3000 is the default port. This configuration can be changed in a sample's `index.js` file.).

3. For command line apps, follow the displayed instructions to use the sample application.
