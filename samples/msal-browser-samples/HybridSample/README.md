# Hybrid SPA sample application

This sample demonstrates how to use MSAL.js and MSAL Node together in a "hybrid" application that performs both server-side and client-side authentication. 

It shows how to use two new APIs, `enableSpaAuthorizationCode` in MSAL Node and `acquireTokenByCode` in MSAL.js, to authenticate a user server-side using a confidential client, and then SSO that user client-side using a second authorization code that is returned to the confidential client and redeemed by the public client client-side. This helps mitigate user experience and performance concerns that arise when performing server-side and client-side authentication for the same user, especially when third-party cookies are blocked by the browser.



## Setup

1. In the Microsoft Entra admin center, create a new app registration.
1. In the root folder for this sample, create a `.env` file and add the client id for this application as `MSAL_CLIENT_ID`.
1. Add your application authority (e.g. `https://login.microsoftonline.com/common`) to the `.env` file as `MSAL_AUTHORITY`.
1. In the Microsoft Entra admin center, under the **Authentication** tab for your application, add the following **Web** redirect URIs:
    1. `http://localhost:3000/auth/server-redirect`
    1. `http://localhost:3000/auth/implicit-redirect`
1. Also add the following **Single-page application** redirect URIs:
    1. `http://localhost:3000/auth/client-redirect`
1. Under **Implicit grant and hybrid flows**, check the boxes to enable **Access tokens** and **ID tokens**.
1. Under the **Certificats & secrets** tab, create a new client secret. Add this client secret to the `.env` file as `MSAL_CLIENT_SECRET`.
1. In the manifest editor, add the following optional ID token claims:
    1. `sid`
    1. `login_hint`
1. Under the **API permissions** tabs, add the `User.Read` scope from Microsoft Graph.
1. In the root of this sample folder, run `npm install`.
1. Run `npm start` or `npm run dev` to start the sample, which will be available at http://localhost:3000.

### Example .env file

```
MSAL_CLIENT_SECRET=<your client secret here>
MSAL_CLIENT_ID=<your client id here>
MSAL_AUTHORITY=https://login.microsoftonline.com/common
```

### Example app manifest for optional claims

```json
{
    "optionalClaims": {
        "idToken": [
            {
                "name": "sid",
                "source": null,
                "essential": false,
                "additionalProperties": []
            },
            {
                "name": "login_hint",
                "source": null,
                "essential": false,
                "additionalProperties": []
            }
        ],
        "accessToken": [],
        "saml2Token": []
    }
}
```

## Authentication

### Confidential client

In this sample, the user is first authenticated using an MSAL Node confidential client. 

First, configure a new `ConfidentialClientApplication`:

Source: [routes/msal.js](./routes/msal.js)
```typescript
const dotenv = require("dotenv");
const msal = require('@azure/msal-node');
dotenv.config()

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MSAL_CLIENT_ID,
        authority: process.env.MSAL_AUTHORITY,
        clientSecret: process.env.MSAL_CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback: (loglevel, message, containsPii) => {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
});
```

Next, generate an auth code url and navigate the user:

Source: [routes/auth.js](./routes/auth.js)
```typescript
router.get('/login', (req, res) => {
    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/server-redirect",
        responseMode: "form_post"
    };

    // Generate auth code url and redirect the user
    msalInstance.getAuthCodeUrl(authCodeUrlParameters)
        .then((response) => {
            console.log(response);
            res.redirect(response);
        })
        .catch((error) => console.log(JSON.stringify(error)));
});
```

Next, parse the authorization code, and invoke the `acquireTokenByCode` API on the `ConfidentialClientApplication` instance. 

When invoking this API, set `enableSpaAuthorizationCode` to `true`, which will enable MSAL to acquire a second authorization code to be redeemed by your single-page application. 

Your application should parse this second authorization code, as well as any account hints (e.g. `sid`, `login_hint`, `preferred_username`) and return them such that they can be rendered client-side:

Source: [routes/auth.js](./routes/auth.js)
```typescript
router.post('/server-redirect', (req, res) => {
    const tokenRequest = {
        code: req.body.code,
        scopes: ["user.read"],
        redirectUri: "http://localhost:3000/auth/server-redirect",
        enableSpaAuthorizationCode: true
    };

    msalInstance.acquireTokenByCode(tokenRequest)
        .then((response) => {
            const {
                sid, // Session ID claim, used for non-hybrid
                login_hint: loginHint, // New login_hint claim (used instead of sid or email)
                preferred_username: preferredUsername // Email
            } = response.idTokenClaims;

            // Spa auth code that will be redeemed by MSAL.js client-side
            const { code } = response;

            // Attach auth artifacts to session to they can be rendered downstream
            req.session.isAuthenticated = true;
            req.session.code = code;
            req.session.sid = sid;
            req.session.loginHint = loginHint;
            req.session.preferredUsername = preferredUsername;

            res.redirect(`/auth/client-redirect`)
        })
        .catch((error) => {
            console.timeEnd(timeLabel)
            console.log(error);
            res.status(500).send(error);
        });
});
```


### Public client

First, configure a new `PublicClientApplication` from MSAL.js in your single-page application:

Source: [views/client-redirect.hbs](./views/client-redirect.hbs)
```typescript
const msalInstance = new msal.PublicClientApplication({
    auth: {
        clientId: "{{clientId}}",
        redirectUri: "http://localhost:3000/auth/client-redirect",
        authority: "{{authority}}"
    }
})
```

Next, render the `code` that was acquired server-side, and provide it to the `acquireTokenByCode` API on the MSAL.js `PublicClientApplication` instance. Be sure to not include any additional scopes that were not included in the first login request, otherwise the user may be prompted for consent.

The application should also render any account hints, as they will be needed for any interactive requests to ensure the same user is used for both requests.

Source: [views/client-redirect.hbs](./views/client-redirect.hbs)
```typescript
const code = "{{code}}";
const loginHint = "{{loginHint}}";

const scopes = [ "user.read" ];

return msalInstance.acquireTokenByCode({
    code,
    scopes
})
    .catch(error => {
         if (error instanceof msal.InteractionRequiredAuthError) {
            // Use loginHint/sid from server to ensure same user
            return msalInstance.loginRedirect({
                loginHint,
                scopes
            })
        }
    });
```
