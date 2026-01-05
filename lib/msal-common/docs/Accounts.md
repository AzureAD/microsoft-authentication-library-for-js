# Accounts in MSAL JavaScript

MSAL JavaScript libraries (`msal-browser` and `msal-node`) support both single account and multiple accounts scenarios in javascript applications. An `account` object is standardized across the libraries and can be referenced [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#accountinfo).

## Account Identifiers

The following `AccountInfo` attributes are used identify user accounts in authentication contexts.

### homeAccountId

When MSAL obtains an authentication response, it checks if the response includes client information. Specifically, MSAL checks for the presence of:

-   `tenantId` - Unique identifier of the tenant the client application belongs to.
-   `uniqueId` - Unique identifier of the user account within the corresponding tenant.

When these two attributes are present, the `homeAccountId` attribute is built by concatenating them the dot-separated format `uniqueId.tenantId`.

In cases where there is no `tenantId` in the authentication response, such as when using `ADFS`, MSAL looks for the ID Token claim `sub`, which identifies the "subject" the ID Token makes claims about and, if present, sets it as the `homeAccountIdentifier`.

Finally, when the `sub` claim is not present in a scenario where `tenantId` is not available, the `homeAccountIdentifier` is set to an empty string.

### localAccountId

The `localAccountId` attribute is a tenant-specific identifier that is usually utilized in legacy cases. MSAL first looks for the `oid` claim in the ID Token from an authentication response and, if present, sets it as the `localAccountId` in the `AccountInfo` object. If the `oid` claim is not present, MSAL falls back to setting the `sub` claim from the ID Token as the `localAccountId`.

Finally, if neither the `oid` or `sub` claim is present in the ID Token claims, `localAccountId` will be undefined in the `AccountInfo` object.

### idTokenClaims

We add the `claims` retrieved from the idToken with an account. Please note that client credential grant flow, referenced [here](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow) does not have an idToken and hence, this property will not be populated for that particular flow.

## Account Source

The `accountSource` attribute indicates how an account was created and cached in MSAL. This field helps differentiate between accounts obtained through different authentication mechanisms and is useful for tracking the origin of cached accounts.

### Possible Values

-   **`"msal"`** - Account was created directly by MSAL from a network token response during standard authentication flows (e.g., via `acquireTokenPopup`, `acquireTokenRedirect`, or `ssoSilent`).

-   **`"external"`** - Account was loaded from an external source using the `loadExternalTokens` API. This is used when tokens are obtained outside of MSAL (e.g., from a different authentication library or custom token acquisition) and then loaded into MSAL's cache.

-   **`"pwb"`** - Account was cached from a pairwise broker response. This source is used when working with specialized broker implementations like `PairwiseBrokerApplication`.

-   **`"naa"`** - Account was cached from a nested app auth host response. This source is used when working with embedded client scenarios like `EmbeddedClientApplication`.

-   **`"platform_broker"`** - Account was cached from a native or platform broker response. This source is used when MSAL integrates with platform-specific authentication brokers like WAM (Web Account Manager) on Windows.

### Usage

The `accountSource` field is optional and may not be present on all accounts, particularly those cached before this feature was introduced. Applications can use this field to:

-   Identify which accounts were loaded externally versus obtained through MSAL authentication flows
-   Track the authentication mechanism used for different accounts
-   Filter or group accounts based on their source in multi-account scenarios

## Account retrieval APIs

For detailed usage examples of account retrieval APIs, please visit the platform specific documentation on accounts:

-   [Accounts on msal-browser](../../msal-browser/docs/accounts.md)
-   [Accounts on msal-node](../../msal-node/docs/accounts.md)
