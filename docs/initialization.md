
#### 1. Initializing the Public Client Application

`PublicClientApplication` can be configured with a variety of different options, detailed in our [Wiki](), but the only required parameters are `auth.clientId` and `auth.tmp_clientSecret`. **IMPORTANT NOTE:** Client secret will not be carried forward in production versions of the library. This is temporary until the server allows CORS requests from public clients. 

```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        tmp_clientSecret: 'tmp_secret1'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
```

#### 2. Choose interaction type - redirect or popup

Choose which APIs you will use in your authentication flows:
- `loginRedirect` and `acquireTokenRedirect`
- `loginPopup` and `acquireTokenPopup`

If you are using the redirect APIs, you will need to include the helper function below with a valid callback API. If you do not use this, your application will error out if any of the redirect APIs are used. This is not needed for any popup APIs.

```javascript
msalInstance.handleRedirectCallback((error, response) => {
    // handle redirect response or error
});
```
