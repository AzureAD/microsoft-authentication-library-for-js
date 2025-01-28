# MSAL Node Sample: Silent flow

This sample application demonstrates how to use the **acquireTokenSilent** API provided by MSAL Node.js in a Node application.

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

### How is this scenario used?

The silent flow is most commonly used for a web app that signs in users. General information about this scenario is available [here](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-app-sign-user-overview?tabs=aspnetcore).

## Test the Sample

### Configure the application

Open the `config/customConfig.json` file.

We will change this to add details about our app registration and deployment.

By default, this configuration is set to support all Microsoft accounts. This includes Microsoft Entra accounts used by organizations, and MSA accounts typically used by consumers.

Before proceeding, go to the Microsoft Entra admin center, and open the app registration for this app.

#### **Client ID**

Within the "Overview" you will see a GUID labeled **Application (client) ID**. Copy this GUID to the clientId field in the config.

Click the **Authentication** link in the left nav.

#### **Authority**

Check that supported account types are: **Accounts in any organizational directory (Any Microsoft Entra ID directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**

If so, then set the authority attribute in the JSON configuraiton file to `https://login.microsoftonline.com/common`

For other supported account types, review the other [Authority options](https://docs.microsoft.com/azure/active-directory/develop/msal-client-application-configuration). Unless there is a specific need to restrict users of your app to an organization, we strongly suggest that everyone use the default authority. User restrictions can be placed later in the application flow if needed.

#### **Client Secret**

If your AzureAD app registration is configured as a Confidential Client Application, you'll have to add a `clientSecret` attribute to a `.env` file and change the `PublicClientApplication` object in the sample's `index.js` file into a `ConfidentialClientApplication` object.

This secret helps prevent third parties from using your app registration.

1. Click on `Certificates and Secrets` in the left nav.
1. Click `New Client Secret` and pick an expiry.
1. Click the `Copy to Clipboard` icon, add this client secret to the `.env` file as `CLIENT_SECRET`.

**silent-flow/config/customConfig.json**

```json
{
    "authOptions": {
        "clientId": "YOUR_CLIENT_ID",
        "authority": "YOUR_AUTHORITY"
    },
    "request": {
        "authCodeUrlParameters": {
            "scopes": ["user.read"],
            "redirectUri": "http://localhost:3000/redirect"
        },
        "tokenRequest": {
            "redirectUri": "http://localhost:3000/redirect",
            "scopes": ["user.read"]
        },
        "silentRequest": {
            "scopes": ["user.read"]
        }
    },
    "resourceApi": {
        "endpoint": "https://graph.microsoft.com/v1.0/me"
    }
}
```

**.env file**

```
CLIENT_SECRET=<your client secret here>
```

**silent-flow/index.js**

```javascript
// Change this
const publicClientApplication = new msal.PublicClientApplication(clientConfig);
const msalTokenCache = publicClientApplication.getTokenCache();
return getTokenSilent(config, publicClientApplication, null, msalTokenCache);

// To this
const confidentialClientApplication = new msal.ConfidentialClientApplication(
    clientConfig
);
const msalTokenCache = confidentialClientApplication.getTokenCache();
return getTokenSilent(
    config,
    confidentialClientApplication,
    null,
    msalTokenCache
);
```

🎉You have finished the basic configuration!🎉

### Executing the application

From the command line, let npm install any needed dependencies. This only needs to be done once.

```bash
$ npm install
```

1. Once the dependencies are installed, you can run the sample application by using the following command:

```bash
$ npm start
```

2. Navigate to http://localhost:3000 (or whatever port number specified) with the browser of your choice.

### The User Experience

What happens if the user logs in, closes the window, returns to the site, and logs in again? Microsoft supports many, many complex scenarios with many, many forms of authentication: certificates, hardware keys, federated experiences, and even biometrics in some cases. Let our library handle the complexity of deciding the simplest way of logging in the user.
