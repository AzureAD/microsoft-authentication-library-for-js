# Multi-tenant Support in MSAL JS SDKs

> This document is about the handling of multi-tenant accounts to acquire tokens across tenants in the `msal-browser` and `msal-node` SDKs. For basic account information, please review the [Accounts](./accounts.md) document.

## Table of Contents

-   [Multi-tenant Accounts](#multi-tenant-accounts)
-   [Tenant Profiles](#tenant-profiles)
-   [Usage](#usage)
    -   [Authenticating with Multiple Tenants](#authenticating-with-multiple-tenants)
    -   [Acquiring Tokens Silently for Multiple Tenants](#acquiring-tokens-silently-for-multiple-tenants)
    -   [getAllAccounts with Multiple Tenants](#getallaccounts-with-multiple-tenants)
    -   [Multi-tenant Logout](#multi-tenant-logout)

## Multi-tenant Accounts

MSAL supports the acquisition and caching of access and ID tokens across multiple tenants. In order to facilitate this, MSAL utilizes multi-tenant accounts. Multi-tenant accounts are [AccountInfo](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.AccountInfo.html) objects that are returned with the tenant-specific data matching the context of the `acquireToken` or `getAccount` API call.

In addition to tenant-specific account data, multi-tenant accounts also contain a `Map` of the **tenant profiles** for the account corresponding to each tenant the user has authenticated with.

## Tenant Profiles

Conceptually, a tenant profile is the record of an account in a specific tenant. In MSAL JS SDKs, [TenantProfile](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.TenantProfile.html) objects contain the subset of the `AccountInfo` properties that vary by tenant. They are created by using the claims from the ID token issued by each tenant the user authenticates with.

`AccountInfo` objects returned from `acquireToken` and `getAccount` APIs contain a `Map<string, TenantProfile>` object called `tenantProfiles` where the key is the tenant ID and the value is the `TenantProfile` for that account in that tenant.

MSAL uses these `TenantProfile` objects to match and build the tenant-specific `AccountInfo` objects required through all of MSAL's flows. They can also be used by client applications for different purposes such as facilitating account selection logic and displaying account data for the user across tenants.

> Warning: While MSAL can return a tenant-specific `AccountInfo` object for each tenant profile, tenant profiles are not actually different accounts, they are only representations of the same account in the different tenants the account has authentiated with. **If a user uses different accounts to authenticate to each tenant, these will not be linked as tenant profiles of eachother and will be treated as completely different accounts that cannot be used to access eachother's tokens**.

## Usage

### Authenticating with Multiple Tenants

In order to authenticate with multiple tenants, you can use either `login` or `acquireToken` APIs normally, only setting the authority to the particular tenant you are requesting tokens for.

> Note: For `login`/`acquireToken` interactive APIs, the tenant context is set from the authority's `tenantId`.

```javascript
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/HOME_TENANT", // This is the authority that MSAL will default to for requests that don't specify their own authority.
    },
};

const myMSALObj = new PublicClientApplication(msalConfig);

// handleRedirectPromise has to be called to resume redirect requests
myMSALObj
    .handleRedirectPromise()
    .then(handleResponse)
    .catch((err) => {
        console.error(err);
    });

// Authority isn't specified because it is already the default set in the MSAL Config object
const homeTenantRequest = {
    scopes: ["HOME_TENANT_SCOPE"],
};

// Guest tenant authority overrides the MSAL config authority, meaning the user can authenticate with the tenant they are a guest in and acquire tokens for it
const guestTenantRequest = {
    scopes: ["GUEST_TENANT_SCOPE"],
    authority: "https://login.microsoftonline.com/GUEST_TENANT",
};

const homeTenantAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
// Get the home tenant account from the AuthenticationResult
const homeTenantAccount = homeTenantAuthResponse.account;

const guestTenantAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
// Get the guest tenant account from the AuthenticationResult
const guestTenantAccount = guestTenantAuthResponse.account;
```

Assuming the user logs into both tenants with the same account, once both login requests are successfully completed and the user has authenticated with each tenant, the cache will contain:

-   2 ID tokens (one per tenant)
-   2 Access tokens (one per tenant)
-   1 Refresh token (one per account, shared across tenants)
-   1 AccountEntity containing both tenant profiles. The `homeTenantAccount` and `guestTenantAccount` objects shown above are both created from the same cached account entity augmented by the claims in their respective ID tokens.

### Acquiring Tokens Silently for Multiple Tenants

In order to acquire cached tokens for a particular tenant, the `AccountInfo` object for that particular tenant must be passed into `acquireTokenSilent`. In order to get the correct account to pass into acquire token silent, you can either:

-   Use the `AccountInfo` object returned from an interactive API call to that tenant:

```javascript
// Original interactive call to home tenant
const homeTenantAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
// Get the home tenant account from the AuthenticationResult
const homeTenantAccount = homeTenantAuthResponse.account;
.
.
.
// Acquire a home tenant access token silently
const homeTenantSilentResponse = await myMSALObj.acquireTokenSilent({
    account: homeTenantAccount,
    ...homeTenantRequest,
});


// Original interactive call to guest tenant
const guestTenantAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
// Get the guest tenant account from the AuthenticationResult
const guestTenantAccount = guestTenantAuthResponse.account;

// Acquire a guest tenant access token silently
const guestTenantSilentResponse = await myMSALObj.acquireTokenSilent({
    account: guestTenantAccount,
    ...guestTenantRequest,
});
```

-   Use the `getAccount()` API with the desired `tenantId` as a filter and use the `AccountInfo` object returned:

```javascript
const homeAccountId = "HOME_ACCOUNT_ID"; // Shared across tenant profiles
const homeTenantId = "HOME_TENANT_ID";
const guestTenantId = "GUEST_TENANT_ID";

// Get the home tenant account
const homeTenantAccount = myMSALObj.getAccount({
    homeAccountId: homeAccountId,
    tenantId: homeTenantId,
});

// Get home tenant token
const homeTenantAuthResponse = await myMSALObj.acquireTokenSilent({
    account: homeTenantAccount,
    ...homeTenantRequest,
});
```

### getAllAccounts with Multiple Tenants

When any account in the MSAL cache contains multiple tenant profiles, `getAllAccounts()` is expected to return a full `AccountInfo` object for each tenant profile that satisfies the filter provided. If no filter is provided, every tenant profile for every account will be returned as a full `AccountInfo` object by default. This means that even if there is only one account object in the cache, multiple `AccountInfo` objects may be returned from `getAllAccounts`.

The results of `getAllAccounts` can be "flattened" to only return the home accounts which would each still have a map of their `tenantProfiles`. This can be achieved by setting the `isHomeTenant` filter to `true`. The opposite, getting only accounts built from guest tenant profiles, can be achieved by setting the `isHomeTenant` filter to `false.`

The sample code below shows how one can:

-   Filter the result of `getAllAccounts()` using the optional `accountFilter` parameter to "flatten" the cached accounts into home accounts with a map of their tenant profiles (otherwise getAllAccounts will return the `AccountInfo` object for each tenant profile)
-   Extract the desired `TenantProfile` object from the home `AccountInfo` object
-   Use the `TenantProfile` object to get the `AccountInfo` object for that tenant profile
-   Use the guest tenant account object to acquire cached tokens that belong to it

```javascript
// When a filter is passed into getAllAccounts, it returns all cached accounts that match the filter. Use the special isHomeTenant filter to get the home accounts only.
const homeAccount = myMSALObj.getAllAccounts({ isHomeTenant: true })[0];
const tenantId = "GUEST_TENANT_ID"; // This will be the tenant you want to retrieve a cached token for

const guestTenantProfile = homeAccount.tenantProfiles.get(tenantId);

if (guestTenantProfile) {
    // TenantProfile is a subset of AccountInfo, so it can be passed whole as an `AccountFilter`
    const guestTenantAccount = myMSALObj.getAccount({ ...tenantProfile });

    const guestTenantAuthResponse = await myMSALObj
        .acquireTokenSilent({
            ...guestTenantRequest,
            account: guestTenantAccount,
        })
        .catch(async (error) => {
            if (error instanceof msal.InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                myMSALObj.acquireTokenRedirect(request);
            } else {
                console.error(error);
            }
        });
} else {
    // Authenticate with guest tenant first
    const guestTenantAuthResponse = await myMSALObj.loginPopup(
        homeTenantRequest
    );
}
```

## Multi-tenant Logout

Calling the `logout` API with an account object passed in will result in all tenant profiles corresponding to that account being logged out and all of their account information and auth artifacts being removed from the cache.
