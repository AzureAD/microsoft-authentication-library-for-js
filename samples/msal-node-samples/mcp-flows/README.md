# MSAL Node Sample: MCP Flows

This sample application demonstrates how to use MSAL Node for MCP applications. It shows how to acquire tokens scoped to a specific `resource` using the authorization code flow and silent token acquisition. For a full explanation of MCP flows, see the [MCP documentation](../../lib/msal-node/docs/mcp.md).

### How is this scenario used?

The MCP flow is used when your application needs to acquire tokens bound to a specific resource identifier. When `isMcp` is set to `true` in the MSAL configuration, token requests must include a `resource` parameter. MSAL will cache access tokens keyed by resource, ensuring that silent token lookups match only tokens acquired for the requested resource.

Key behaviors demonstrated in this sample:

- **Resource parameter enforcement**: When `isMcp` is `true`, all token requests must include a `resource`. Omitting it will throw a `resource_parameter_required` error.
- **Resource-scoped caching**: Access tokens are cached with their associated resource. Silent requests return cached tokens only when the resource matches.
- **Cache miss fallback**: When a silent request specifies a different resource than the cached token, MSAL falls back to the network (via refresh token) to acquire a new token for the requested resource.

## Test the Sample

### Configure the application

Open the `config/AAD.json` file.

**config/AAD.json:**

```json
{
    "authOptions": {
        "clientId": "YOUR_CLIENT_ID",
        "authority": "https://login.microsoftonline.com/common/",
        "isMcp": true
    },
    "request": {
        "authCodeUrlParameters": {
            "scopes": ["user.read"],
            "redirectUri": "http://localhost:3000/redirect"
        },
        "tokenRequest": {
            "redirectUri": "http://localhost:3000/redirect",
            "scopes": ["user.read"],
            "resource": "https://example.microsoft.com"
        },
        "silentRequest": {
            "scopes": ["user.read"],
            "resource": "https://example.microsoft.com"
        }
    }
}
```

#### **Client ID**

Go to the Microsoft Entra admin center and open the app registration for this app. Within the "Overview" you will see a GUID labeled **Application (client) ID**. Copy this GUID to the `clientId` field in the config.

#### **Authority**

Set the `authority` to match your app registration's supported account types. The default `https://login.microsoftonline.com/common` supports all Microsoft accounts.

#### **Resource**

Set the `resource` field in both `tokenRequest` and `silentRequest` to the resource your application needs tokens for. This is required when `isMcp` is `true`.

### Executing the application

From the command line, install dependencies (only needs to be done once):

```bash
npm install
```

Run the sample:

```bash
npm start
```

Navigate to `http://localhost:3000` in your browser.

1. Click **Sign In** to authenticate via the authorization code flow.
2. After signing in, click **Acquire Token Silently** to retrieve a cached token for the configured resource.

### Customizing the application

To customize the start script, review the `package.json` file.

## Adding this scenario to an existing application

### Import the Configuration Object

```javascript
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "YOUR_AUTHORITY",
        isMcp: true,
    },
};
```

### Configure Dependencies

```javascript
const msal = require("@azure/msal-node");
```

### Initialize MSAL Node at runtime

```javascript
const pca = new msal.PublicClientApplication(config);
```

### Configure Token Requests with Resource

When `isMcp` is `true`, include a `resource` parameter on all token requests:

```javascript
const tokenRequest = {
    scopes: ["user.read"],
    redirectUri: "http://localhost:3000/redirect",
    resource: "https://example.microsoft.com",
};

pca.acquireTokenByCode(tokenRequest).then((response) => {
    // Token acquired
});
```

### Silent Token Acquisition

Silent requests also require the `resource` parameter. MSAL returns cached tokens only when the resource matches:

```javascript
const silentRequest = {
    scopes: ["user.read"],
    account: account,
    resource: "https://example.microsoft.com",
};

pca.acquireTokenSilent(silentRequest).then((response) => {
    // Returns cached token if resource matches, otherwise falls back to network
});
```
