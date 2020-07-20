# Working with MSAL.js and Azure AD B2C

> :warning: Before you start here, make sure you understand [how to initialize an app object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md) and [working with resources and scopes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/resources-and-scopes.md). We also recommend general familiarity with **Azure AD B2C**. See the [B2C documentation](https://docs.microsoft.com/azure/active-directory-b2c/technical-overview) for more.

**MSAL.js supports** authentication with **social** (Microsoft, Google, Facebook etc.) and **local** (Azure AD work and school) identities using **Azure AD B2C** (*B2C* for short). When developing B2C apps with **MSAL.js**, there are a few important details to keep in mind.

## Quick Facts

With B2C:

- You **can** authenticate users with social identities.
- You **can** authorize users to access your **B2C protected** resources.
- You **cannot** obtain tokens for Microsoft APIs (e.g. MS Graph API) using [delegated permissions](#b2c-and-delegated-permissions).
- You **can** obtain tokens for Microsoft APIs using [application permissions](#b2c-and-application-permissions) (management scenarios).

## B2C App Configuration

The following is a B2C app configuration example:

```javascript
const msalConfig = {
  auth: {
    clientId: "<your-clientID>",
    authority: "https://<your-tenant>.b2clogin.com/<your-tenant>.onmicrosoft.com/<your-policyID>",
    validateAuthority: true,
    knownAuthorities: ["<your-tenant>.b2clogin.com"] // array of URIs that are known to be valid
  }
}

const loginRequest = {
  scopes: [ "openid", "offline_access" ]
}

const tokenRequest = {
  scopes: [ "api://<myCustomApiClientId>/My.Scope" ]
}
```

## AAD vs B2C Endpoints

A major difference between **Azure AD** (*AAD* for short) vs. **B2C** tenants are with respect to their **endpoints**.

An **AAD** tenant:

- Contains only AAD endpoints (`login.microsoftonline.com/*`).
- Exposes a **single** token endpoint (`login.microsoftonline.com/.../token`).
- AAD endpoints allow you to obtain tokens for:
  - Your applications protected by AAD.
  - Microsoft APIs, such as **MS Graph API**.

A **B2C** tenant:

- Contains AAD and B2C endpoints (`login.microsoftonline.com/*` and `<your-domain>.b2clogin.com/*`).
- Exposes **separate** token endpoints for each (`login.microsoftonline.com/.../token`, `<your-domain>.b2clogin.com/.../token`).
- B2C endpoints allow you to obtain tokens for:
  - Your applications protected by B2C.

## B2C and Delegated Permissions

**Delegated permissions** specify *scope-based access* using *interactive* authorization from the signed-in user. These permissions are presented to the resource (*e.g.* your web API, MS Graph API etc.) at run-time as `scp` claims in the client's **Access Token**.

A user's B2C authentication cannot be used to authorize to AAD protected apps, or **Microsoft APIs** (which are also protected by AAD). As such, when you use **MSAL.js**, you cannot use the `<your-tenant>.b2clogin.com/.../token` endpoint to obtain a token for **MS Graph API**.

### OpenID Connect Permissions

The exception to the rule above comes from a special set of scopes known as **OpenID Connect** (OIDC) permissions, which includes `openid`, `profile`, `email`. These permissions originate from [Azure AD - OpenID Connect compliance](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc). Another special permission is the `offline_access`, which gives your app access to a resources on behalf of the user for an extended time (using a **Refresh Token**). MSAL.js will supply `openid`, `profile` and `offline_access` by default during `loginPopup()` and `loginRedirect()` requests.

### AAD Authentication against a B2C Tenant

When you use `login.microsoftonline.com` endpoint without providing any `policyID` parameters against a B2C tenant, you hit the **AAD endpoints *of the* B2C tenant**. Only in this case you can get tokens for **MS Graph API** resources, using the signed-in user's context.

## B2C and Application Permissions

**Application permissions** specify *role-based access* using the client application's credentials/identity. These permissions are presented to the resource at run-time as `roles` claims in the client's **Access Token**.

### User Management Scenarios

The `login.microsoftonline.com` endpoints can still be used for any behind the scenes, *non-interactive* work on managing users and attributes, even if they are specific to B2C. When creating an **application registration** for an app that'll use [client credentials grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow) to manage B2C resources using **MS Graph API**, you need to select the **Graph API** scopes that your management app needs to get permission for (see the [documentation](https://docs.microsoft.com/azure/active-directory-b2c/manage-user-accounts-graph-api) for more). Things to keep in mind:

- To obtain **application permissions**, you'll need perform application authentication (using the **client credentials grant**).
- To obtain **delegated permissions**, you'll need to perform user authentication with an admin account.
- Management apps are typically registered as audience **type 1** or sometimes **type 2**, and rarely (discouraged) as **type 3** (see [below](#b2c-and-account/audience-types)).

## Other Topics

### B2C and Account/Audience Types

During application registration, you are prompted to select an **audience**. The audience type you select indicates what type of authentication that you are targeting for.

| Audience Type    | Description                                                       | Authentication Type |
|------------------|-------------------------------------------------------------------|---------------------|
| #1               | Accounts in this organizational directory only (single tenant)    | AAD Authentication  |
| #2               | Accounts in any organizational directory (multi-tenant).          | AAD Authentication  |
| #3               | Accounts in any organizational directory or any identity provider | B2C Authentication  |

### B2C and Sign-out Experience

The sign-out clears the user's *single sign-on* state with **Azure AD B2C**, but it might not sign the user out of their **social identity provider** session. If the user selects the same identity provider during a subsequent sign-in, they might re-authenticate without entering their credentials. The assumption for this is that, if a user wants to sign out of the application, it doesn't necessarily mean they want to sign out of their Facebook account.
