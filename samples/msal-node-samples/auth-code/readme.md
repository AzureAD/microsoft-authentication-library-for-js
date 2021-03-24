# MSAL Node Sample:  Auth Code

This sample application demonstrates how to use the Authorization Code Grant APIs provided by MSAL Node.js in a Node application.

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

### How is this scenario used?
The Auth Code flow is most commonly used for a web app that signs in users.  General information about this scenario is available [here](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-app-sign-user-overview?tabs=aspnetcore).

>**Note: Although this sample application has a web server component that allows the user to input their credentials in the browser, it is important to remember that MSAL Node does not support browser-based Single Page Applications. If you are looking to use the authorization code grant to acquire tokens in a Single-Page Application, please use [MSAL Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser).**

## Test the Sample

### Configure the application

Open the `config/customConfig.json` file.

We will change this to add details about our app registration and deployment.

By default, this configuration is set to support all Microsoft accounts. This includes Azure AD accounts used by organizations, and MSA accounts typically used by consumers. 

Before proceeding, go to the Azure portal, and open the app registration for this app.

#### **Client ID**

Within the "Overview" you will see a GUID labeled **Application (client) ID**.  Copy this GUID to the clientId field in the config.

Click the **Authentication** link in the left nav.

#### **Authority**
Check that supported account types are: **Accounts in any organizational directory (Any Azure AD directory - Multitenant) and personal Microsoft accounts (e.g. Skype, Xbox)**

If so, then set the authority attribute in the JSON configuraiton file to `https://login.microsoftonline.com/common`

For other supported account types, review the other [Authority options](https://docs.microsoft.com/azure/active-directory/develop/msal-client-application-configuration).  Unless there is a specific need to restrict users of your app to an organization, we strongly suggest that everyone use the default authority. User restrictions can be placed later in the application flow if needed.

#### **Client Secret**

If your AzureAD app registration is configured as a Confidential Client Application, you'll have to add a `clientSecret` attribute to the configuration and change the `PublicClientApplication` object in the sample's `index.js` file into a `ConfidentialClientApplication` object.

This secret helps prevent third parties from using your app registration.
Click on `Certificates and Secrets` in the left nav.
Click `New Client Secret` and pick an expiry.
Click the `Copy to Clipboard` icon, and add the secret to the config object in `./config/customConfig.json`.

**auth-code/config/customConfig.json**
```json
{
    "authOptions":
        {
            "clientId": "YOUR_CLIENT_ID",
            "authority": "YOUR_AUTHORITY",
            "clientSecret": "YOUR_CLIENT_SECRET" // Add client secret here
            
        },
    "request":
    {
        "authCodeUrlParameters": {
            "scopes": ["user.read"],
            "redirectUri": "http://localhost:3000/redirect"
        },
        "tokenRequest": {
            "redirectUri": "http://localhost:3000/redirect",
            "scopes": ["user.read"]
        }
    },
    "resourceApi":
    {
        "endpoint": "https://graph.microsoft.com/v1.0/me"
    }
}
```

**auth-code/index.js**

```javascript
    // Change this
    const publicClientApplication = new msal.PublicClientApplication(clientConfig);
    return getTokenAuthCode(config, publicClientApplication, null);

    // To this
    const confidentialClientApplication = new msa.ConfidentialClientApplication(clientConfig);
    return getTokenAuthCode(config, confidentialClientApplication, null);
```
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

2. Navigate to http://localhost:3000 (or whatever port number specified) with the browser of your choice.

### Customizing the application

To customize the start script, review the `package.json` file.

## Adding this scenario to an existing application

### Import the Configuration Object

If you set up the sample with your app registration, you may be able to copy this object directly into your application.  


```javascript
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY",
        clientSecret: "YOUR_CLIENT_SECRET" // Only for Confidential Client Applications
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


Initialize the app object within your web app.

If you've configured a Public Client Application:

```js
const pca = new msal.PublicClientApplication(config);
```

If you've configured a Confidential Client Application:

```js
const cca = new msal.ConfidentialClientApplication(config);
```

### Configure Sign In Request

Choose the route that requires sign in.  Within that route, set up permissions, and direct the MSAL Node app object to attempt sign in.

In our sample, we immediately sign in the user.  If you want all users to be logged in before they view anything, then you can use the same process.
We add our sign in code to the default route. 

```js
app.get('/', (req, res) => {
```

Next, we have to pick the `scopes` related to the user.  If we are logging in a user, then we must at least request access to basic user information.  The default scope of `user.read` grants that basic access. To learn more see the [Microsoft Graph permissions reference](https://docs.microsoft.com/graph/permissions-reference).

**auth-code/config/customConfig.json:**
```json
{
    ...,
    "request":
        {
            "authCodeUrlParameters": {
                "scopes": ["user.read"],
                "redirectUri": "http://localhost:3000/redirect"
            },
            ...
        },
    ...
```

The ```redirectUri``` is the return route.  After logging in a user, they will hit this route.  Your application logic will take over here.  You will want to customize the redirectUri for your application.

Next we direct the user to authenticate.  The following code block directs the user based on the Authority we set in the config, and directs the user as needed.

**auth-code/index.js:**

```javascript
    clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
```

Putting together the routing and all the logic for starting the sign in yields the following code:

```javascript
app.get('/', (req, res) => {
    // You can also build the authCodeUrlParameters object directly in the JavaScript file like this
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
    };

    clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        res.redirect(response);
    }).catch((error) => console.log(JSON.stringify(error)));
});
```
### Configure Sign In Response

The next step occurs after the redirect.
Your application must first *complete* the sign in flow by processing the code and validating the incoming request.

First, configure the route where you will receive the response.  This must match your application configuration on the Azure portal.

**auth-code/index.js:**
```javascript
app.get('/redirect', (req, res) => {
```

Next,  your app logic will validate the scopes and route.  These settings must match the request.  Make sure the `scopes` match the request. Make sure the `redirectUri` matches the app registration, and the route.

**auth-code/config/customConfig.json:**
```json
{
    ...,
    "request":
        {
            ...,
            "tokenRequest": {
                "scopes": ["user.read"],
                "redirectUri": "http://localhost:3000/redirect"
            }
        },
    ...
```

The above JSON is the *configuration* for the access token request. The following code validates and executes the token request to complete Sign In.

**auth-code/index.js**
```javascript
    tokenRequest.code = "AUTH_CODE_FROM_RESPONSE";

    clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
```
Putting together the routing and all the logic for completing the sign in yields the following code:

```js
app.get('/redirect', (req, res) => {
    // You can also build the tokenRequest object directly in the JavaScript file like this
    const tokenRequest = {
        // The URL from the redirect will contain the Auth Code in the query parameters
        code: req.query.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/redirect",
    };

    // Pass the tokenRequest object with the Auth Code, scopes and redirectUri to acquireTokenByCode API
    clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
        res.sendStatus(200);
    }).catch((error) => {
        console.log(error);
        res.status(500).send(error);
    });
});
```

### The User Experience

What happens if the user logs in, closes the window, returns to the site, and logs in again?  Microsoft supports many, many complex scenarios with many, many forms of authentication: certificates, hardware keys, federated experiences, and even biometrics in some cases.  Let our library handle the complexity of deciding the simplest way of logging in the user.

Silent flows are not used with the this scenario. See [Authentication Flows](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-authentication-flows) for a discussion of the interaction between flows.
