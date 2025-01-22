# MSAL Node Standalone Sample: Refresh Token Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to exchange a refresh token for an access token when the said access token has expired, using the [OAuth 2.0 Refresh Token](https://oauth.net/2/grant-types/refresh-token/) grant.

Note that MSAL does not expose refresh tokens by default and developers are not expected to build logic around them, as MSAL handles the token refreshing process itself. However, the `acquireTokenByRefreshToken` API is useful in certain cases: for instance, if you are storing refresh tokens in a separate location (e.g. in an encrypted cache file) and you would like to use it to renew an access token or if you're migrating from ADAL Node to MSAL Node and you would like to make use of your previously acquired (and still valid) refresh tokens. With respect to the latter, this sample also demonstrates one possible strategy for migration below.

> :warning: Confidential client applications should not share cache and we do not recommend cache sharing between an ADAL app and an MSAL app. msal-node will not be able to directly read from an ADAL app's cache. Make sure to isolate cache locations and provide only the relevant refresh token string to msal-node's `acquireTokenByRefreshToken` API.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-app`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
    - In the **Redirect URI (optional)** section, select **Web** in the combo-box and enter the following redirect URI: `http://localhost:3000/redirect`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - In the **Client secrets** section, select **New client secret**.
    - Type a key description (for instance `app secret`),
    - Select one of the available key durations (6 months, 12 months or Custom) as per your security posture.
    - The generated key value will be displayed when you select the **Add** button. Copy and add this client secret to the `.env` file as `CLIENT_SECRET`.

Before running the sample, you will need to replace the values in the [customConfig.json](./config/customConfig.json):

**customConfig.json**

```JSON
{
    "tenantInfo:": "ENTER_TENANT_INFO",
    "clientId": "ENTER_CLIENT_ID",
}
```

**.env file**

```
CLIENT_SECRET=<your client secret here>
```

## Test the app

1. First, run the ADAL Node application. In your terminal, type:

```console
    npm run start:adal
```

1. Open a browser and navigate to `http://localhost:3000`. The app will attempt to interactively acquire tokens for the user. Enter your credentials and consent to the permissions required by the app. Once you do, you should be redirected back to the app, and see the token acquisition response printed on the page. At this point, your tokens should be cached in a file named [cache.json](./data/cache.json) under the _data_ folder.
1. Stop the ADAL Node app in your terminal.
1. Now start the MSAL Node app. In your terminal, type:

```console
    npm run start:msal
```

1. Open a browser and navigate to `http://localhost:3000`. The app will attempt to silently acquire tokens for the user. Should the silent token acquisition attempt fails, it will try to obtain a refresh token from ADAL Node app's cache. To do this, the app needs to pass down some unique identifier (such as a username or user OID) for this user as a query for the cache lookup. If no refresh token is found for this user or if the refresh token is expired, the app falls back to interactive token acquisition as a last resort. This logic is shown below:

```JavaScript
app.get('/acquireToken', async (req, res, next) => {
    try {
        // retrieve account
        const account = await (await cca.getTokenCache()).getAccountByHomeId(req.session.account?.homeAccountId);

        if (!account) {
            console.log('Account not found!');
            throw new msal.InteractionRequiredAuthError();
        }

        const tokenResponse = await cca.acquireTokenSilent({
            account: account,
            scopes: ["user.read"],
        });

        res.send(tokenResponse);
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
                /**
                 * If the silent token acquisition throws an interaction_required error,
                 * we catch it and attempt to find a refresh token for this user from ADAL cache.
                 * If no cached refresh token is found or if the refresh token is expired,
                 * we fallback to interactive flow via getAuthCodeUrl -> acquireTokenByCode.
                 */
                diskCache.find({ userId: req.cookies.userId }, async (error, data) => {
                    try {
                        if (error || !data || !data.length) throw new Error('Could not retrieve user cache');

                        /**
                         * You can add the /.default scope suffix to the resource to help migrate your apps
                         * from the v1.0 endpoint (ADAL) to the Microsoft identity platform (MSAL).
                         * For example, for the resource value of https://graph.microsoft.com,
                         * the equivalent scope value is https://graph.microsoft.com/.default
                         */
                        const tokenResponse = await cca.acquireTokenByRefreshToken({
                            refreshToken: data[0].refreshToken,
                            scopes: ['https://graph.microsoft.com/.default'],
                            forceCache: true,
                        });

                        req.session.account = tokenResponse.account;

                        /**
                         * Once you successfully acquire an access token using a refresh token,
                         * we recommend to clear the ADAL cache for this user.
                         */
                        diskCache.remove(data, (error, data) => {
                            if (error) console.error(error)
                            res.send(tokenResponse);
                        })
                    } catch (error) {
                        // create a random string of characters against csrf
                        req.session.state = cryptoProvider.createNewGuid();

                        // Construct a request object for auth code url
                        const authCodeUrlParameters = {
                            scopes: ["user.read"],
                            responseMode: 'form_post',
                            redirectUri: REDIRECT_URI,
                            state: req.session.state,
                        };

                        try {
                            // Request auth code url, then redirect
                            const authCodeUrl = await cca.getAuthCodeUrl(authCodeUrlParameters);
                            res.redirect(authCodeUrl);
                        } catch (error) {
                            next(error);
                        }
                    }
                });
        } else {
            next(error);
        }
    }
});
```

## More information

-   [Microsoft identity platform refresh tokens](https://docs.microsoft.com/azure/active-directory/develop/refresh-tokens)
-   [How to migrate a Node.js app from ADAL to MSAL](https://docs.microsoft.com/azure/active-directory/develop/msal-node-migration)
