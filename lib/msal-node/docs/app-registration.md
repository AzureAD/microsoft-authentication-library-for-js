# Register an application for MSAL Node

Use Node.js 20 or later and install `@azure/msal-node`. Choose the application type before registering its authentication settings:

- **Public client**: a desktop app or CLI that cannot keep credentials confidential. Use `PublicClientApplication`; do not provision a client secret for it.
- **Confidential client**: a server-side web app, web API, or daemon that can protect its credentials. Use `ConfidentialClientApplication` with a certificate, assertion, or secret appropriate to the deployment.

## Collect registration values

In the Microsoft Entra admin center, open **App registrations**, create or select the application, and record the following values:

| Value | Where it is used |
| --- | --- |
| Application (client) ID | Set `auth.clientId` to this ID, not the registration's object ID. |
| Directory (tenant) ID | For a single-tenant app, use `https://login.microsoftonline.com/<tenant-id>` as `auth.authority`. |
| Supported account types | Align the registration's audience with the authority. `organizations` is for work/school accounts; `common` also allows personal accounts when the registration permits them; `consumers` is for personal accounts. |
| Redirect URI | Register under the platform matching the application. Supply it on the applicable authorization-code requests; it is not a top-level MSAL Node `auth` setting. |
| API permissions and scopes | Configure delegated permissions for user flows or application permissions for app-only flows, and arrange user/admin consent as required. |
| Client credential | Confidential clients only. Register the certificate, federated credential, or secret; keep private material out of code and source control. |

Use the authority's supported cloud host in sovereign-cloud deployments rather than assuming the public-cloud hostname. See [authority configuration](../../msal-common/docs/authority.md).

## Choose authentication settings by flow

| Scenario | Registration considerations |
| --- | --- |
| Desktop/CLI interactive sign-in | Configure **Mobile and desktop applications** with an appropriate loopback redirect. See the [loopback server](./loopback-server.md) and [request APIs](./request.md). |
| Native broker | Register the platform-specific broker redirect URI; it is distinct from a normal browser/loopback redirect. See [brokering](./brokering.md). |
| Device code | Enable the registration's public-client flow setting where required. No redirect listener or client secret is needed for device code flow. |
| Server-side web app | Configure a **Web** redirect URI and a confidential client credential. Use the same redirect URI when requesting and redeeming the authorization code. |
| Daemon/client credentials | Use a tenant-specific authority, an application credential, application permissions, and admin consent. Request the resource's `/.default` scope. No interactive redirect URI is required. |
| Web API calling a downstream API | Configure the API's exposed scope and downstream delegated permissions for on-behalf-of flow. The incoming access token must be intended for your API. |

Do not enable public-client flows or add redirect platforms indiscriminately to fix an unrelated error. A browser SPA should use MSAL Browser, not put confidential MSAL Node credentials in JavaScript delivered to a browser.

## Next steps

Initialize a [public client](./initialize-public-client-application.md) or [confidential client](./initialize-confidential-client-application.md), then choose the [token acquisition API](./request.md) and [cache strategy](./caching.md) for your application.
