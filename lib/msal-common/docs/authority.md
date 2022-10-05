# Authority in MSAL

In OAuth 2.0 and OpenID Connect, a client application (aka *relying party*) acquires tokens from an identity provider (IdP), such as Azure AD, to prove authentication (via ID tokens) and/or authorization (via access tokens). In this relationship, the IdP has the *authority* to issue tokens to the client application, and the client application trusts the *authority* of the IdP.

MSAL is a token acquisition library. The **authority** parameter in MSAL configuration indicates the URL to request tokens from. This URL points to the service that issues tokens, also called as **security token service** (STS). MSAL needs to have accurate information about an STS to be able to requests tokens from it (either directly from the network or from the cache later on). To do so, MSAL performs steps to gather the necessary **metadata** for making a token request (*endpoint discovery*). The [Authority.ts](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_common.authority.html) class encapsulates the methods and data required for endpoint discovery, and is instantiated before each token request.

## Authority URL

The default authority for MSAL is `https://login.microsoftonline.com/common`. This string is a URL made of two parts: a **domain** (aka *instance*), and a **tenant identifier** (aka *realm*):

```console
    https://<domain-of-the-service>/<tenant-identifier>
```

> :warning: The canonical authority URL differs in the case of B2C, ADFS and dSTS. See [Choosing an authority](#choosing-an-authority) below for more.

The authority URL guides MSAL where to look for the 3 endpoints that are required for successfully acquiring a token:

| Endpoint                | Example     | Description |
|-------------------------|-------------|-------------|
| `/openid-configuration` | `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration` | Contains the metadata required for making a token request e.g. supported scopes, claims, request methods, signing keys etc. |
| `/authorize`            | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` | Returns an authorization code in the query parameters via the client app's registered redirect URI. Navigation to this endpoint usually prompts the user with a dialog screen by the IdP. Appropriate query parameters can be used to customize this screen. |
| `/token`                | `https://login.microsoftonline.com/common/oauth2/v2.0/token` | The client app sends the authorizaiton code to this endpoint via a POST request and receives an access and an ID token in return. |

> :bulb: Certain OAuth 2.0 grants may skip the authorize endpoint and go directly for the token endpoint, e.g. [OAuth 2.0 Client Credentials Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)

## Authority configuration

In MSAL, authority can be set in 2 locations:

1. via the [configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#clientconfiguration) object during MSAL instantiation
2. via the [request](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#baseauthrequest) object during `login*` and `acquireToken*` calls

(2) takes precedence over (1) i.e. you can override the initial authority URL set in the configuration object later on during each token request. See [msal-browser configuration](../../msal-browser/docs/configuration.md) and [msal-node configuration](../../msal-node/docs/configuration.md) for more.

## Choosing an authority

The correct authority URL that you need pass to MSAL is ultimately determined by the domain of the IdP you register your application with. When registering an application, consider:

- Who are the users you want your app to sign-in?
- What are the web APIs you want your app to acquire tokens for?

### Azure AD

The authority domain for the global Azure AD instance is `login.microsoftonline.com`. This domain has several aliases (e.g. `login.microsoft.com`) published on the [discovery endpoint](https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=https://login.microsoftonline.com/common/oauth2/v2.0/authorize). For resiliency and performance, MSAL keeps a record of these in cache (see: [AuthorityMetadata.ts](../src/authority/AuthorityMetadata.ts)). MSAL trusts authority URLs with any of these aliases by default.

> :warning: The authority domain differs for national Azure deployments, such as Azure China. See [National clouds](https://docs.microsoft.com/azure/active-directory/develop/authentication-national-cloud) for more.

The authority domain should be followed by a tenant identifier. The tenant identifier controls the [sign-in audience](https://docs.microsoft.com/azure/active-directory/develop/v2-supported-account-types) for your app (see also: [Tenancy in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps)). It can take one of the values below:

| Identifier              | Audience    |
|-------------------------|-------------|
| `common` | user accounts from any tenant and personal Microsoft accounts (e.g. hotmail.com) |
| `organizations` | user accounts from any tenant, but not personal Microsoft accounts |
| `consumers` | personal Microsoft accounts only |
| `<tenantId>` | user accounts from your tenant only |

> :bulb: When an authority domain is followed by a tenant ID (e.g. https://login.microsoftonline.com/aa5d004e-7258-4962-a99d-e1135bdeb68d), it is referred as a *tenanted authority*

> :warning: MSAL always caches tokens with a tenanted authority, never with `common`/`organizations`/`consumers`

### Azure AD B2C

A B2C authority URL consists of a domain and a tenant-identifier like in the case of AAD, but also a *policy-identifier* which lets the IdP know which policy it should load when navigated to the `/authorize` endpoint. Because the sub-domain portion of the URL in B2C is custom to each B2C tenant, MSAL cannot trust this authority by default. As such, you'll need to mark your B2C domain as *known* via the `knownAuthorities` property in MSAL configuration.

```javascript
const pca = new PublicClientApplication({
    auth: {
        clientId: "<your-client-id>",
        authority: "https://<your-tenant-name>.b2clogin.com/<your-tenant-name>.onmicrosoft.com/<your-policy-id>",
        knownAuthorities: ["<your-tenant-name>.b2clogin.com"] // array of domains that are known to be trusted
    }
});
```

> :warning: MSAL does not support providing the policy ID as a query parameter e.g. https://<your-tenant-name>.b2clogin.com/<your-tenant-name>.onmicrosoft.com/?p=<your-policy-id>

See [Working with B2C](../../msal-browser/docs/working-with-b2c.md) for more.

### ADFS

Because ADFS has no concept of tenancy, the authority URL for ADFS is not tenanted. And like B2C, the domain portion of the authority URL in ADFS is custom, meaning that MSAL cannot trust this authority by default, and it must be explicitly told to do so.

```javascript
const pca = new PublicClientApplication({
    auth: {
        clientId: "<your-client-id>",
        authority: "https://<your-adfs-domain>/adfs/",
        knownAuthorities: ["<your-adfs-domain>"] // array of domains that are known to be trusted
    }
});
```

See [ADFS](./ADFS.md) for more.

### dSTS

Given that dSTS also uses custom domains in its authority URLs and does not support instance discovery, dSTS authorities must also be explicitly included in the `knownAuthorities` configuration array.

```javascript
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "<your-client-id>",
        authority: "https://<your-dsts-domain>/dstsv2/<your-tenant-id>",
        knownAuthorities: ["<your-dsts-domain>"] // array of domains that are known to be trusted
    }
});
```

> *Note: dSTS supports both Public and Confidential Client applications.*

### Other OIDC-compliant IdPs

MSAL can be configured to acquire tokens from any OIDC-compliant IdP. See [initialization](../../msal-browser/docs/initialization.md#optional-configure-authority) for more.

## Remarks

- You can obtain the authority URL required for your app via the **Endpoints** panel on the Azure portal [App Registration](https://aka.ms/appregistrations) experience.
- You can improve MSAL's performance during token acquisition by providing authority information out-of-band. See [Performance](../../msal-browser/docs/performance.md) for how to do so.
- When working with national clouds, consider using the [instance-aware](../../msal-browser/docs/instance-aware.md) flow, which indicates the particular instance the tokens are obtained from and Microsoft Graph hosts that they can be used with.

## More information

- [OAuth 2.0 and OpenID Connect (OIDC) in the Microsoft identity platform](https://docs.microsoft.com/azure/active-directory/develop/active-directory-v2-protocols)
- [Microsoft identity platform and OpenID Connect protocol](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc)
- [Use MSAL in a national cloud environment](https://docs.microsoft.com/azure/active-directory/develop/msal-national-cloud?tabs=javascript)
- [National Graph deployments](https://docs.microsoft.com/graph/deployments)
