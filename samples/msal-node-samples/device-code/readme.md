# MSAL Node Sample:  Device Code

This sample application demonstrates how to use the Device Code Grant APIs provided by MSAL Node.js in a Node application.

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

### How is this scenario used?

The Device Code flow is most commonly used a device that can display text, but not a web ux, and should support user interaction.  General information about this scenario is available [here](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-device-code).

It can be used for devices with a small display, or connected devices over SSH.

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

For other supported account types, review the other [Authority options](https://docs.microsoft.com/azure/active-directory/develop/msal-client-application-configuration).  Unless there is a specific need to restrict users of your app to an organization, we strongly suggest that everyone use the default authority.  User restrictions can be placed later in the application flow if needed.

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

By default, the sample will display a code and the web address to visit to validate the code.  That should be visited by a web capable device.  On completion, the sample will automatically receive the response and complete authentication.

### Customizing the application

To customize the start script, review the `package.json` file.

## Adding this scenario to an existing application

### Import the Configuration Object

If you set up the sample with your app registration, you may be able to copy this object directly into your application.  

```javascript
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY"
    }
};
```

### Configure Dependencies

Add the dependency on MSAL Node to your Node app.

```javascript
const msal = require('@azure/msal-node');
```

### Initialize MSAL Node at runtime

Initialize the app object within your web app.

```javascript
const pca = new msal.PublicClientApplication(msalConfig);
```

### Configure Sign In Request

The device code sample immediately initiates the authentication.  If you want to gate the authentication behind other logic, then move this next configuration and request.

Next we have to pick the `scopes` related to the user.  If we are logging in a user, then we must at least request access to basic user information.  The default scope of `user.read` grants that basic access.  To learn more see the [Microsoft Graph permissions reference](https://docs.microsoft.com/graph/permissions-reference).

**device-code/config/customConfig.json:**
```json
{
    ...,
    "request":
        {
            "deviceCodeUrlParameters": {
                "scopes": ["user.read"]
            }
        },
    ...
```

Next we send the authentication request.  The following code block handles the request and the response.

```javascript
return clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    });
```

### The User Experience

What happens if the user logs in, closes the window, returns to the site, and logs in again?  Microsoft supports many, many complex scenarios with many, many forms of authentication: certificates, hardware keys, federated experiences, and even biometrics in some cases.  Let our library handle the complexity of deciding the simplest way of logging in the user.

For this flow, a new code is generated, and a new user interaction is required with each request. 
