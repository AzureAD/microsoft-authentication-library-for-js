# MSAL Node Standalone Sample:  Client Credentials

The sample applications contained in this directory are independent samples of MSAL Node usage, covering each of the authorization flows that MSAL Node currently supports. To get started with this sample, first follow the general instructions [here](../readme.me).

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

### How is this scenario used?
The Client Credentials flow is most commonly used for a daemon or command line app that calls web apis and does not have any user interaction.  General information about this scenario is available [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow).

## Prerequisite

This sample has a special prerequisite.  The configuration must use a tenant specific authority. The admin of that tenant must [grant permissions to this app](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow#application-permissions).

## Test the Sample

### Configure the application
Open the `index.js` file.

Find the `config` object.  We will change this to add details about our app registration and deployment.

Before proceeding, go to the Azure portal, and open the app registration for this app.

#### **Client ID**
Within the "Overview" you will see a GUID labeled **Application (client) ID**.  Copy this GUID to the clientId field in the config.

Click the **Authentication** link in the left nav.

#### **Authority**
Check that supported account types are restricted to an organization.  

For other supported account types, review the other [Authority options](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration).  

#### **Client Secret**

This secret helps prevent third parties from using your app registration.
Click on `Certificates and Secrets` in the left nav.
Click `New Client Secret` and pick an expiry.
Click the `Copy to Clipboard` icon, and add the secret to the config object in index.js.

🎉You have finished the basic configuration!🎉

### Executing the application

From the command line, let npm install any needed dependencies.  This only needs to be done once.

```bash
$ npm install
```
Once the dependencies are installed, you can run the sample application by using the following command:

```bash
$ npm start
```

### Customizing the application

To customize the start script, review the `package.json` file.

## Adding this scenario to an existing application

### Import the Configuration Object

If you set up the sample with your app registration, you may be able to copy this object directly into your application.


```js
const config = {
    auth: {
        clientId: "",
        authority: "https://login.microsoftonline.com/ "TENANT" ",
        clientSecret: ""
    },
    system: {
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

### Configure Dependencies

Add the dependency on MSAL Node to your Node app.

```js
const msal = require('@azure/msal-node');
```

### Initialize MSAL Node at runtime


Initialize the app object within your app.

```js
const cca = new msal.ConfidentialClientApplication(config);
```

### Configure Sign In Request

This simple flow only requires the scopes approved by the tenant administrator as additional configuration.

```js
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
};
```

Next you will make the request and process the response. Other than configuring logging, there is little customization needed.

```js
cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
    console.log("Response: ", response);
}).catch((error) => {
    console.log(JSON.stringify(error));
});
```

### The User Experience

This flow has no expected user interaction and very simple configuration. As long as your app remains authorized in the configured tenant, it should continue to work.
