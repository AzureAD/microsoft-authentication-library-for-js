# Multi-tenant Support in MSAL JS SDKs

> This document is about the handling of multi-tenant accounts to acquire tokens across tenants in the `msal-browser` and `msal-node` SDKs. For basic account information, please review the [Accounts](./accounts.md) document.

## Table of Contents

-   [Multi-tenant Accounts](#multi-tenant-accounts)
-   [Tenant Profiles](#tenant-profiles)
-   [Usage](#usage)
    -   [Authenticating with Multiple Tenants](#authenticating-with-multiple-tenants)
    -   [Filtering Multi-tenant Accounts](#filtering-multi-tenant-accounts)
        -   [Using getAccount to search for a specific tenanted account](#using-getaccount-to-search-for-a-specific-tenanted-account)
        -   [Using getAllAccounts with an account filter to narrow down the collection of accounts returned](#using-getallaccounts-with-an-account-filter-to-narrow-down-the-collection-of-accounts-returned)
    -   [Multi-tenant Logout](#multi-tenant-logout)

## Multi-tenant Accounts

MSAL supports the acquisition and caching of access and ID tokens across multiple tenants. In order to facilitate this, MSAL utilizes multi-tenant accounts. Multi-tenant accounts are [AccountInfo](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.AccountInfo.html) objects that are returned with the tenant-specific data matching the context of the `acquireToken` or `getAccount` API call.

In addition to tenant-specific account data, multi-tenant accounts also contain a `Map` of the **tenant profiles** for the account corresponding to each tenant the user has authenticated with.

> Note: Access and ID tokens are tenant-specific while Refresh Tokens are shared across tenants.

## Tenant Profiles

Conceptually, a tenant profile is the record of an account in a specific tenant. In MSAL JS SDKs, [TenantProfile](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.TenantProfile.html) objects contain the subset of the `AccountInfo` properties that vary by tenant. They are created by using the claims from the ID token issued by each tenant the user authenticates with.

`AccountInfo` objects returned from `acquireToken` and `getAccount` APIs contain a `Map<string, TenantProfile>` object called `tenantProfiles` where the key is the tenant ID and the value is the `TenantProfile` for that account in that tenant.

MSAL uses these `TenantProfile` objects to match and build the tenant-specific `AccountInfo` objects required through all of MSAL's flows. They can also be used by client applications for different purposes such as facilitating account selection logic and displaying account data for the user across tenants.

> Warning: While MSAL can return a tenant-specific `AccountInfo` object for each tenant profile, tenant profiles are not actually different accounts, they are only representations of the same account in the different tenants the account has authenticated with. **If a user uses different accounts to authenticate to each tenant, these will not be linked as tenant profiles of each other and will be treated as completely different accounts that cannot be used to access each other's tokens**.

## Usage

### Authenticating with Multiple Tenants

In order to authenticate with multiple tenants, you can use either `login` or `acquireToken` APIs normally, only setting the authority to the particular tenant you are requesting tokens for.

> Note:
>
> -   For `login`/`acquireToken` interactive and `ssoSilent` APIs, the tenant context is set from the authority's `tenantId`.
> -   For `acquireTokenSilent` the tenant context is set from the `AccountInfo` object passed in when searching the cache for matching tokens, regardless of the tenantId in the request's authority.

MSAL Browser example:

```javascript
/**
 * Custom function that first attempts to acquire tokens silently from a specific tenant
 * and falls back to interaction if there is no cached token matching the request and tenant
 */
async function getTokenMultiTenant(request, tenantId) {
    // If an account was added to the request, attempt silent token acquisition
    if (request.account) {
        let tenantedAccount = null;
        if (tenantId) {
            // Attempt to get tenant-specific account
            tenantedAccount = myMSALObj.getAccount(
                {
                    homeAccountId: account.homeAccountId,
                    tenantId: GUEST_TENANT_ID
                });
            request.authority = BASE_AUTHORITY + tenantId
        }

        if (tenantedAccount) {
            // Use the cached tenant profile directly to find an access token in the cache
            request.account = tenantedAccount;
        } else {
            // Force acquireTokenSilent to use the cached refresh token to acquire an access token from the tenant in the authority instead
            request.cacheLookupPolicy = CacheLookupPolicy.RefreshToken // alternatively, you can set forceRefresh: true
        }

        return await myMSALObj.acquireTokenSilent(request).catch((error) => {
            if (error instanceof InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails. Possible reasons are expired tokens, MFA (multi-factor authentication) required, etc.
                await myMSALObj.acquireTokenPopup(request);
            } else {
                console.error(error);
            }
        });
    } else {
        // No account means user has yet to authenticate, interaction required
        return await myMSALObj.loginPopup(request);
    }
}

.
.
.

/**
 * Main Script
 */

import { PublicClientApplication, InteractionRequiredError, CacheLookupPolicy } from "@azure/msal-browser";
/**
 * Establish home and guest tenant IDs as well as base authority:
 */
const HOME_TENANT_ID = "HOME_TENANT_ID";
const GUEST_TENANT_ID = "GUEST_TENANT_ID";
const BASE_AUTHORITY = "https://login.microsoftonline.com/"


/**
 * Configure PublicClientApplication
 */
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: BASE_AUTHORITY + HOME_TENANT_ID, // This is the authority that MSAL will default to for requests that don't specify their own authority.
    },
};

/**
 * Initialize PublicClientApplication
 */
const myMSALObj = new PublicClientApplication(msalConfig);
myMSALObj.initialize.then(() => {
    // handleRedirectPromise has to be called to resume redirect requests
    .handleRedirectPromise()
    .then(handleResponse)
    .catch((err) => {
        console.error(err);
    });
})

/**
 * Configure base requests
 */
const homeTenantRequest = {
    scopes: ["HOME_TENANT_SCOPE"],
};
const guestTenantRequest = {
    scopes: ["GUEST_TENANT_SCOPE"]
};

// There is no account at this point, user hasn't logged in
const homeTenantAuthResponse = await getTokenMultiTenant(homeTenantRequest);
// Get the home tenant/base account from the AuthenticationResult
const baseAccount = homeTenantAuthResponse.account;
// Get home tenant access token
const homeAccessToken = homeTenantAuthResponse.accessToken;

// Acquire guest tenant tokens and tenant profile by leveraging the already authenticated account
const guestTenantAuthResponse = await getTokenMultiTenant(
    {
        ...guestTenantRequest,
        account: baseAccount // At this point, this the base account with home account tenant profile information
        },
        GUEST_TENANT_ID
    );

const guestTenantAccount = guestTenantAuthResponse.account;
const guestTenantAccessToken = guestTenantAuthResponse.accessToken;
```

### Filtering Multi-tenant Accounts

With multi-tenant accounts, the [AccountFilter](https://azuread.github.io/microsoft-authentication-library-for-js/ref/types/_azure_msal_common.AccountFilter.html) type can be leveraged to search for a specific tenanted account object using `getAccount()` or narrow down the collection of accounts returned by `getAllAccounts()`.

#### Using getAccount to search for a specific tenanted account

This example uses the `getAccount()` API with the desired `tenantId` as a filter and then uses the `AccountInfo` object returned to acquire a previously cached token for that specific tenant.

```javascript
const homeAccountId = "HOME_ACCOUNT_ID"; // Shared across tenant profiles
const guestTenantId = "GUEST_TENANT_ID";

// Get the guest tenant account
const guestTenantAccount = myMSALObj.getAccount({
    homeAccountId: homeAccountId,
    tenantId: guestTenantId,
});

// Get guest tenant token
let guestTenantAuthResponse;
if (guestTenantAccount) {
    guestTenantAuthResponse = await myMSALObj.acquireTokenSilent({
        account: guestTenantAccount,
        ...guestTenantRequest,
    });
} else {
    // authenticate with the guest tenant for the first time
}
```

#### Using getAllAccounts with an account filter to narrow down the collection of accounts returned

By default, `getAllAccounts` will return an account for every tenant profile that has been previously cached. However, the results of `getAllAccounts` can be filtered by any of the properties in the `AccountFilter` type. Additionally, multi-tenant accounts in the results can be "flattened" into their base/home accounts only by setting the `isHomeTenant` filter to true.

How flattening multit-tenant accounts works:

-   To get base/home accounts only, set `isHomeTenant: true` in the filter object passed in.
    -   If `isHomeTenant` is set to `false`, instead of flattening it will filter our home accounts and return all guest tenant accounts that match the rest of the filter
-   The "flattened" accounts returned will still have a map of all their `tenantProfiles`
-   The `AccountInfo` object for each guest tenant profile would be ommitted from the `getAllAccounts` result array.

The sample code below shows how to:

-   Filter the result of `getAllAccounts()` using the optional `accountFilter` parameter to "flatten" the cached accounts into home accounts with a map of their tenant profiles (otherwise getAllAccounts will return the `AccountInfo` object for each tenant profile)
-   Extract the desired `TenantProfile` object from the home `AccountInfo` object
-   Use the `TenantProfile` object to get the `AccountInfo` object for that tenant profile
-   Use the guest tenant account object to acquire cached tokens that belong to it

```javascript
// When a filter is passed into getAllAccounts, it returns all cached accounts that match the filter. Use the special isHomeTenant filter to get the home accounts only.
const allHomeAccounts = myMSALObj.getAllAccounts({ isHomeTenant: true });
const homeAccount = allHomeAccounts[0]; // Assuming only one user is logged into multiple tenants
const tenantId = "GUEST_TENANT_ID"; // This will be the tenant you want to retrieve a cached token for

// Get the `TenantProfile` account data subset for the desired tenant from the homeAccount object
const guestTenantProfile = homeAccount.tenantProfiles.get(tenantId);

if (guestTenantProfile) {
    // TenantProfile is a subset of AccountInfo, so it can be passed whole as an AccountFilter
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
    // If the tenant profile isn't found in the account, that means the user hasn't authenticated with that tenant. This is the custom getTokenMultiTenant function from the first example.
    const guestTenantAuthResponse = await myMSALObj.getTokenMultiTenant({
        ...guestTenantRequest,
        account: homeAccount,
    });
}
```

## Multi-tenant Logout

Calling the `logout` API with an account object passed in will result in all tenant profiles corresponding to that account being logged out and all of their account information and auth artifacts being removed from the cache.
