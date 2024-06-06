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

## Account retrieval APIs

For detailed usage examples of account retrieval APIs, please visit the platform specific documentation on accounts:

-   [Accounts on msal-browser](../../msal-browser/docs/accounts.md)
-   [Accounts on msal-node](../../msal-node/docs/accounts.md)
