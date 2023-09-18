# Multi-tenant Support in MSAL Browser

> This is an advanced document regarding the acquisition of tokensacross tenants in `msal-browser`. For basic account information, please review the [Accounts](./accounts.md) document.

## Multi-tenant Accounts

As of v2.39.0, MSAL Browser supports the acquisition of access tokens for accounts across multiple tenants. In order to achieve this, MSAL caches the account information and auth artifacts for a user for each tenant it has authenticated with. 

This means that with the exception of refresh tokens, which are shared across tenants, the MSAL cache may store multiple accounts, access tokens, and ID tokens for a single user. Each of these account records, in a multi-tenant context, will be referred to as a **"tenant profile"** of the main account.

### Tenant Profiles

A tenant profile is the record of a particular account in a particular tenant. When multi-tenant support is enabled, a distinct `AccountInfo` object will be cached containing the entire tenant profile for every tenant that the user authenticates with.

All tenant profiles of an account include a reference to the original or "home" account. In MSAL, this identifier is the `homeAccountId` in the `AccountInfo` object.

Although full tenant profiles are actually stored as `AccountInfo` objects, MSAL exports a type called `TenantProfile` which encapsulates the information required to retrieve a particular `AccountInfo` object representing a specific tenant profile. This type is shown and explained below:

```javascript
export type TenantProfile = {
    objectId: string;
    tenantId: string;
    isHomeTenant: boolean;
};
```

| Property | Definition |
| -------- | ---------- |
| `objectId`| Sourced from the `oid` claim in an ID token, the `objectId` is the value that uniquely identifies a user object within a specific tenant, also referred to as `localAccountId`.|
| `tenantId` | Source from the `tid` claim in an ID token, the `tenantId` is the value that uniquely identifies a tenant. The combination of `objectId` and `tenantId` will fully and uniquely identify a user account's specfic tenant profile.|
| `isHomeTenant` | A flag that specifies whether the tenant profile is the home tenant profile, determined by comparing the string `"[objectId].[tenantId]"` to the account record's `homeAccountId`.|

## Usage

### Configuration

To make use of this advanced feature, you must enable multi-tenant accounts through the `Configuration` object.

```javascript
const msalConfig = {
	auth: {
		clientId: "your_client_id",
		multiTenantAccountsEnabled: true
	}
}

const myMSALObj = new PubliClientApplication(msalConfig);
```

### Authenticating with Multiple Tenants

In order to authenticate with multiple tenants, you can use either `login` or `acquireToken` APIs normally, only setting the authority to the particular tenant you are requesting tokens for.

```javascript
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/HOME_TENANT", // This is the authority that MSAL will default to for requests that don't specify their own authority.
        multiTenantAccountsEnabled: true
    }
}

const myMSALObj = new PublicClientApplication(msalConfig);

// handleRedirectPromise has to be called to resume redirect requests
myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
    console.error(err);
});

// Authority isn't specified because it is already the default set in the MSAL Config object
const homeTenantRequest = {
    scopes: ["HOME_TENANT_SCOPE"]
};

// Guest tenant authority overrides the MSAL config authority, meaning the user can authenticate with the tenant they are a guest in and acquire tokens for it
const guestTenantRequest = {
    scopes: ["GUEST_TENANT_SCOPE"],
    authority: "https://login.microsoftonline.com/GUEST_TENANT"
};

const homeTenatAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
const guestTenantAuthResponse = await myMSALObj.loginPopup(homeTenantRequest);
```

Once both login requests are successfully completed and the user has authenticated with each tenant, there will be one `AccountInfo` object, one ID token and one access token for each tenant. There will also be a single refresh token that will be used for both in the cache.


### Acquiring Tokens Silently for Multiple Tenants

In order to acquire cached tokens for a particular tenant, the `AccountInfo` object for that particular tenant must be passed into `acquireTokenSilent`. In order to facilitate this, when multi-tenant support is enabled, all returned account objects will include a `Map<String, TenantProfile>` object containing references to all the alternate tenant profiles in the cache. Also, a `getAccountByFilter()` API has been added that allows applications to pass in a `TenantProfile` object that will be used to find the `AccountInfo` object for that specific tenant profile.

The sample code below shows how one can:

- Filter the result of `getAllAccounts()` using the new optional `accountFilter` parameter to "flatten" the cached accounts into home accounts with a map of their tenant profiles (otherwise getAllAccounts will return the `AccountInfo` object for each tenant profile)
- Extract the desired `TenantProfile` object from the home `AccountInfo` object
- Use the `TenantProfile` object to get the `AccountInfo` object for that tenant profile
- Use the guest tenant account object to acquire cached tokens that belong to it

```javascript
// When a filter is passed into getAllAccounts, it returns all cached accounts that match the filter. Use the special isHomeTenant filter to get the home accounts only.
const homeAccount = myMSALObj.getAllAccounts({ isHomeTenant: true })[0]; // Assuming all cached accounts belong to the same user, there should only be one home account in the cache
const tenantId = "GUEST_TENANT_ID"; // This will be the tenant you want to retrieve a cached token for
const guestTenantProfile = homeAccount.tenantProfiles.get(tenantId);
const guestTenantAccount = myMSALObj.getAccountByFilter({ tenantProfile: tenantProfile});


const guestTenantAuthResponse = await myMSALObj.acquireTokenSilent({ ...guestTenantRequest, account: guestTenantAccount }).catch(async (error) => {
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            myMSALObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
});
```


## Multi-tenant Logout

Calling the `logout` API with an account object passed in will result in all tenant profiles corresponding to that account being logged out and all of their account information and auth artifacts being removed from the cache.