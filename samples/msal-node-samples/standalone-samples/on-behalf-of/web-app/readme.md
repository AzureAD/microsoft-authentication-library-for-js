# MSAL Node Standalone Sample:  Web app calling Web API, On Behalf Of

The sample applications contained in this directory are independent samples of MSAL Node usage, covering each of the authorization flows that MSAL Node currently supports. To get started with this sample, first follow the general instructions [here](../readme.me).

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

### How is this scenario used?
The On Behalf Of flow is most commonly used for a web app calling a web api.  That web api can also use the same flow to call a subsequent web api.

General information about this scenario is available [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows#on-behalf-of).

## Test the Sample

### Configure the web app
Since the on behalf of flow relies on a web app calling a web api, we rely on two separate app registrations, and two running processes.  This sample works in tandem with the sample in the Web API folder.  Both index.js files must be configured.

Open the `web-app/index.js` file.

Find the `config` object.  We will change this to add details about our app registration and deployment.  

By default, this configuration is set to support all Microsoft accounts. This includes Azure AD accounts used by organizations, and MSA accounts typically used by consumers. 

Before proceeding, go to the Azure portal, and open the app registration for this app.

#### **Client ID**
Within the "Overview" you will see a GUID labeled **Application (client) ID**.  Copy this GUID to the clientId field in the config.

Click the **Authentication** link in the left nav.

#### **Authority**
Check that supported account types are: **Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**

If so, then leave the default setting for authority as `https://login.microsoftonline.com/common`

For other supported account types, review the other [Authority options](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-client-application-configuration).  Unless there is a specific need to restrict users of your app to an organization, we strongly suggest that everyone use the default authority.  User restrictions can be placed later in the application flow if needed.

#### **Client Secret**

This secret helps prevent third parties from using your app registration.
Click on `Certificates and Secrets` in the left nav.
Click `New Client Secret` and pick an expiry.
Click the `Copy to Clipboard` icon, and add the secret to the config object in index.js.

### Configure the web api

Open the `web-app/index.js` file.

Find the `config` object.  You will make the same changes here.  Use a new clientId and clientSecret.  The authority should be the same.

🎉You have finished the basic configuration!🎉

### Executing the application

From the command line, let npm install any needed dependencies.  This only needs to be done once.

```bash
$ npm install
```
1. Once the dependencies are installed, you can run the sample application by using the following command:

```bash
$ npm start
```

1. Change to the Web API directory and repeat the steps `npm install` and `npm start`.  The Web API by default will run on port 8000.

1. Navigate to http://localhost:3000 (or whatever port number specified) with the browser of your choice.

### Customizing the application

To customize the start script, review the `package.json` file.

## Adding this scenario to an existing application

### Import the Configuration Object For Web App or Web API

If you set up the sample with your app registration, you may be able to copy this object directly into your application.  


```js
const config = {
    auth: {
        clientId: "12d77c73-d09d-406a-ae0d-3d4e576f7d9b",
        authority: "https://login.microsoftonline.com/common",
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

### Configure Dependencies for Web App or Web API

Add the dependency on MSAL Node to your Node app.

```js
const msal = require('@azure/msal-node');
```

### Initialize MSAL Node at runtime for Web App or Web API


Initialize the app object within your web app.

```js
const pca = new msal.ConfidentialClientApplication(config);
```

### Configure Web App

The Web App uses the Auth Code flow for initial login.  Follow the steps in the [Auth Code flow](../../auth-code/readme.md) for additional detail.

After user authentication, we will configure the call to the Web API.
We explicitly set the headers for the call using this option block.  This accessToken

```js
    const options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    };
```

The access token was retrieved from the Auth Code flow, when parsing the response from the authority.

```js
cca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("Response received. Calling web API");
        accessToken = response.accessToken;
```

The code needed for an existing app that implements auth code is:

1. Setting up the function to call the web api:
```js
const callWebApi = (accessToken, callback) => {
    const options = {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        }
    };

    const req = http.request(new URL("http://localhost:8000/obo"), options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
            callback(chunk);
        });
    });
    req.on('error', (err) => {
        console.log(err);
    });
    req.end();
}
```

1. Executing that function based on a route:
```js
app.get('/oboCall', (req, res) => {
    callWebApi(accessToken, (oboResponse) => {
        console.log(oboResponse);
        res.sendStatus(200);
    });
});
```

1. And finally, parsing the response.  We are not providing sample code to parse the response.  The response is generally a simple json object.


### Configure Web Api

The web api receives a web request with a bearer token in the request header:
```js
'Authorization': 'Bearer ' + accessToken,
```

The web api should first use the `validateJwt` function to process and validate the incoming request.  That function also calls the `getSigningKeys` function to do signature validation.  Most apps can use these functions as is from the sample.  Some apps may do additional validations on the JWT claims.



### The User Experience

The user experience of this flow is related to how the response from the Web API is displayed.  That is beyond the scope of this sample.  Visit the [graph explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) for sample MS Graph calls and responses.