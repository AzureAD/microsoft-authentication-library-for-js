# MSAL.js errors

### `unexpected_error`
- Unexpected error in authentication.

### `post_request_failed`
- Post request failed from the network, could be a 4xx/5xx or a network unavailability. Please check the exact error code for details.

### `cache_quota_exceeded`
- Exceeded cache storage capacity.

This error occurs when MSAL.js surpasses the allotted storage limit when attempting to save token information in the [configured cache storage](./caching.md#cache-storage). See [here](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria#web_storage) for web storage limits.

**Mitigation**:

1. Make sure the configured cache storage has enough capacity to allow MSAL.js to persist token payload. The amount of cache storage required depends on the number of [cached artifacts](./caching.md#cached-artifacts).
2. Disable [claimsBasedCachingEnabled](./configuration.md#cache-config-options) cache config option. When enabled, it caches access tokens under a key containing the hash of the requested claims. Depending on the MSAL.js API usage, it may result in the vast number of access tokens persisted in the cache storage.

### `cache_error_unknown`
- An unknown error occurred while accessing the browser cache.

### `client_info_decoding_error`
- The client info could not be parsed/decoded correctly.

### `client_info_empty_error`
- The client info was empty.

### `token_parsing_error`
- Token cannot be parsed.

### `null_or_empty_token`
- The token is null or empty.

### `endpoints_resolution_error`
- Could not resolve endpoints. Please check network and try again.

### `network_error`
- Network request failed. Please check network and try again.

### `openid_config_error`
- Could not retrieve endpoints. Check your authority and verify the .well-known/openid-configuration endpoint returns the required endpoints.

### `hash_not_deserialized`
- The hash parameters could not be deserialized.

### `invalid_state`
- State was not the expected format.

### `state_mismatch`
- State mismatch error.

### `state_not_found`
- State not found.

### `nonce_mismatch`
- Nonce mismatch error.

### `auth_time_not_found`
- Max Age was requested and the ID token is missing the auth_time variable auth_time is an optional claim and is not enabled by default - it must be enabled. See https://aka.ms/msaljs/optional-claims for more information.

### `max_age_transpired`
- Max Age is set to 0, or too much time has elapsed since the last end-user authentication.

### `multiple_matching_tokens`
- The cache contains multiple tokens satisfying the requirements. Call AcquireToken again providing more requirements such as authority or account.

### `multiple_matching_appMetadata`
- The cache contains multiple appMetadata satisfying the given parameters. Please pass more info to obtain the correct appMetadata.

### `request_cannot_be_made`
- Token request cannot be made without authorization code or refresh token.

### `cannot_remove_empty_scope`
- Cannot remove null or empty scope from ScopeSet.

### `cannot_append_scopeset`
- Cannot append ScopeSet.

### `empty_input_scopeset`
- Empty input ScopeSet cannot be processed.

### `no_account_in_silent_request`
- Please pass an account object, silent flow is not supported without account information.

### `invalid_cache_record`
- Cache record object was null or undefined.

### `invalid_cache_environment`
- Invalid environment when attempting to create cache entry.

### `no_account_found`
- No account found in cache for given key.

### `no_crypto_object`
- No crypto object detected.

### `unexpected_credential_type`
- Unexpected credential type.

### `token_refresh_required`
- Cannot return token from cache because it must be refreshed. This may be due to one of the following reasons: forceRefresh parameter is set to true, claims have been requested, there is no cached access token or it is expired.

### `token_claims_cnf_required_for_signedjwt`
- Cannot generate a POP jwt if the token_claims are not populated.

### `authorization_code_missing_from_server_response`
- Server response does not contain an authorization code to proceed.

### `binding_key_not_removed`
- Could not remove the credential's binding key from storage.

### `end_session_endpoint_not_supported`
- The provided authority does not support logout.

### `key_id_missing`
- A keyId value is missing from the requested bound token's cache record and is required to match the token to it's stored binding key.

### `no_network_connectivity`
- No network connectivity. Check your internet connection.

### `user_canceled`
- User cancelled the flow.

### `method_not_implemented`
- This method has not been implemented.

### `nested_app_auth_bridge_disabled`
- The nested app auth bridge is disabled.

### `redirect_uri_empty`
- A redirect URI is required for all calls, and none has been set.

### `claims_request_parsing_error`
- Could not parse the given claims request object.

### `authority_uri_insecure`
- Authority URIs must use https. Please see here for valid authority configuration options: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-initializing-client-applications#configuration-options.

### `url_parse_error`
- URL could not be parsed into appropriate segments.

### `empty_url_error`
- URL was empty or null.

### `empty_input_scopes_error`
- Scopes cannot be passed as null, undefined or empty array because they are required to obtain an access token.

### `invalid_prompt_value`
- Invalid prompt value. Please see here for valid configuration options: https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#commonauthorizationurlrequest

### `invalid_claims`
- Given claims parameter must be a stringified JSON object.

### `token_request_empty`
- Token request was empty and not found in cache.

### `logout_request_empty`
- The logout request was null or undefined.

### `invalid_code_challenge_method`
- code_challenge_method passed is invalid. Valid values are "plain" and "S256".

### `pkce_params_missing`
- Both params: code_challenge and code_challenge_method are to be passed if to be sent in the request.

### `invalid_cloud_discovery_metadata`
- Invalid cloudDiscoveryMetadata provided. Must be a stringified JSON object containing tenant_discovery_endpoint and metadata fields.

### `invalid_authority_metadata`
- Invalid authorityMetadata provided. Must by a stringified JSON object containing authorization_endpoint, token_endpoint, issuer fields.

### `untrusted_authority`
- The provided authority is not a trusted authority. Please include this authority in the knownAuthorities config parameter.

### `missing_ssh_jwk`
- Missing sshJwk in SSH certificate request. A stringified JSON Web Key is required when using the SSH authentication scheme.

### `missing_ssh_kid`
- Missing sshKid in SSH certificate request. A string that uniquely identifies the public SSH key is required when using the SSH authentication scheme.

### `missing_nonce_authentication_header`
- Unable to find an authentication header containing server nonce. Either the Authentication-Info or WWW-Authenticate headers must be present in order to obtain a server nonce.

### `invalid_authentication_header`
- Invalid authentication header provided.

### `cannot_set_OIDCOptions`
- Cannot set OIDCOptions parameter. Please change the protocol mode to OIDC or use a non-Microsoft authority.

### `cannot_allow_platform_broker`
- Cannot set allowPlatformBroker parameter to true when not in AAD protocol mode.

### `authority_mismatch`
- Authority mismatch error. Authority provided in login request or PublicClientApplication config does not match the environment of the provided account. Please use a matching account or make an interactive request to login to this authority.

### `no_tokens_found`
- No refresh token found in the cache. Please sign-in.

### `native_account_unavailable`
- The requested account is not available in the native broker. It may have been deleted or logged out. Please sign-in again using an interactive API.

### `refresh_token_expired`
- Refresh token has expired.

### `interaction_required`
- User interaction is required.

### `consent_required`
- User consent is required.

### `login_required`
- User login is required.

### `bad_token`
- Identity provider returned bad_token due to an expired or invalid refresh token. Please invoke an interactive API to resolve.

### `missing_kid_error`
- The JOSE Header for the requested JWT, JWS or JWK object requires a keyId to be configured as the 'kid' header claim. No 'kid' value was provided.

### `missing_alg_error`
- The JOSE Header for the requested JWT, JWS or JWK object requires an algorithm to be specified as the 'alg' header claim. No 'alg' value was provided.
