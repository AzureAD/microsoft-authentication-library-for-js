# MSAL Node Standalone Samples

The sample applications contained in this directory are independent samples of MSAL Node usage, covering all of the authorization flows that MSAL Node currently supports. While all the samples include default configuration values that work out-of-the-box, their configuration is easily customizable to use your own Azure AD app registration.

## How to run the samples:

### Clone this repository

There are several options to download the sample code. The first is to clone the root repository (microsoft-auhtentication-library-for-js) using SSH or HTTP:

SSH:

```bash
$ git clone git@github.com:AzureAD/microsoft-authentication-library-for-js.git
```

HTTP:

```bash
$ git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
```

Another option is to download the repository as a zip file by selecting "Download ZIP" from the root repository's dropdown "Code" menu. Once you've downloaded the ZIP file, you can decompress it locally and explore the code.

Once you've successfully cloned the source code, which includes the samples, you can go through the pre-requisites list below in order to make sure you have all of the dependencies required to run these samples. 

### Pre-requisites
- Ensure [all pre-requisites](../../../lib/msal-node/README.md#prerequisites) have been completed to run msal-node.
- Install Node.js if needed (https://nodejs.org/en/).
- Build the `msal-node` project with instructions provided in the [`README.md`](../../../lib/msal-node/README.md) or using the command `npm run build:package`.

Once you've completed all the pre-requisites, you can navigate to any of the sample application directories under `standalone-samples` and either execute each sample as-is, or customize it to use your own AzureAD app registration.

From the repository's root directory, navigate to a sample application (for example, the auth-code sample):

```bash
$ cd samples/msal-node-samples/standalone-samples/auth-code
```

### Configure the application

Each application has an `index.js` file, which is considered the entrypoint of the application. This file both contains the MSAL configuration and the application code that shows how to use each authorization flow. The sample works out-of-the-box with the default configuration in the `index.js` files, but you can customize it to use your own AzureAD app registration by changing the configuration values to match your app registration's. Below you'll find an example of what the main MSAL configuration object looks like. This is the object you'll want to customize to match your app registration.

```javascript
// Before running the sample, you will need to replace the values in the config, 
// including the clientSecret
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY_URL",
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

Each sample also includes a `package.json` file that defines a `start` script, meaning you can execute each sample by running `npm start` from it's root folder (i.e. any of the subdirectories contained under `standalone-samples`). Depending on the application type and the flow the sample is written for, the `npm start` command will either start a Node.js web application (using Express.js) or a Node CLI (Command Line Interface) app. Either way, the console will instruct you on how to interact with the sample next.