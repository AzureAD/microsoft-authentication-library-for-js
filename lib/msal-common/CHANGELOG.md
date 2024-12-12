# Change Log - @azure/msal-common

This log was last generated on Tue, 05 Nov 2024 18:58:46 GMT and should not be manually modified.

<!-- Start content -->

## 14.16.0

Tue, 05 Nov 2024 18:58:46 GMT

### Minor changes

- Remove NetworkManager class (thomas.norling@microsoft.com)
- Add first order broker parameters #7348 (kshabelko@microsoft.com)
- Make clear synchronous for msal.node (shylasummers@microsoft.com)
- Additional network failure telemetry (thomas.norling@microsoft.com)
- Validate crypto.subtle is available during initialization (thomas.norling@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

### Patches

- Move correlationId to query string on /token calls (thomas.norling@microsoft.com)

## 14.15.0

Thu, 19 Sep 2024 23:48:30 GMT

### Minor changes

- Fix type resolution when using moduleResolution node16 (thomas.norling@microsoft.com)
- Add optional "instanceAware" config auth param #7259 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

## 14.14.2

Wed, 28 Aug 2024 23:06:01 GMT

### Patches

- Remove PerformanceEvent for PopupTokenHelper #7270 (joarroyo@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.14.1

Tue, 13 Aug 2024 23:25:08 GMT

### Patches

- Add retryError to PerformanceEvent #7216 (joarroyo@microsoft.com)
- Add PerformanceEvent for PopupTokenHelper #7216 (joarroyo@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.14.0

Tue, 23 Jul 2024 14:19:34 GMT

### Minor changes

- Track MSAL SKU for broker flows #7182 (kshabelko@microsoft.com)
- Track MSAL node SKU for broker flows #7213 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.13.1

Tue, 16 Jul 2024 18:22:27 GMT

### Patches

- Generate tenantProfile even without idTokenClaims (thomas.norling@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.13.0

Mon, 01 Jul 2024 19:18:29 GMT

### Minor changes

- Add main field to package.json (thomas.norling@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Reformatted ManagedIdentityTokenResponse + adjusted unit tests #7167 (rginsburg@microsoft.com)
- Fix extraQueryParameters being dropped from request (thomas.norling@microsoft.com)
- Make idTokenClaims optional when creating AccountEntity (thomas.norling@microsoft.com)

## 14.12.0

Mon, 10 Jun 2024 22:30:36 GMT

### Minor changes

- Add support for apps to set their own `reqCnf` and correct native flows cnf format #6357 (sameera.gajjarapu@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.11.0

Tue, 04 Jun 2024 00:08:57 GMT

### Minor changes

- Instrument pre-redirect flow #7134 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.10.0

Mon, 06 May 2024 23:48:17 GMT

### Minor changes

- Instrument scenario id for tracking custom user prompts #7043 (kshabelko@microsoft.com)
- Instrument account type #7049 (kshabelko@microsoft.com)
- Instrument server error number #7036 (kshabelko@microsoft.com)
- Do not register duplicate performance callbacks #7069 (kshabelko@microsoft.com)
- Client Assertion Implementation now accepts a callback instead of a string argument (rginsburg@microsoft.com)
- Make performanceClient.discardMeasurements() flush aux cache data in addition to measurements #7061 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

-  Fixed inconsistencies with cancellationToken (timeout) (rginsburg@microsoft.com)

## 14.9.0

Thu, 11 Apr 2024 21:46:57 GMT

### Minor changes

- Capture and instrument cache errors #7021 (kshabelko@microsoft.com)
- Implemented Managed Identity in MSAL-Node (rginsburg@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Skip login_hint opaque claim if domainHint param is set #7008 (kshabelko@microsoft.com)
- New performance event for awaiting parallel iframe calls #6962 (thomas.norling@microsoft.com)

## 14.8.1

Wed, 27 Mar 2024 18:41:17 GMT

### Patches

- Stringify telemetry context #6984 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.8.0

Fri, 22 Mar 2024 20:32:39 GMT

### Minor changes

- Capture telemetry event tree #6948 (kshabelko@microsoft.com)
- Instrument non-auth error name and stack #6937 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Minor cache cleanup (thomas.norling@microsoft.com)
- Append default scopes for the cache lookup #6909 (kshabelko@microsoft.com)

## 14.7.1

Sat, 17 Feb 2024 01:49:05 GMT

### Patches

- Add ID Token secret to AccountInfo in all reponses #6903 (hemoral@microsoft.com)
- fix: Prevents error thrown when Authority URL contains no path segments. (bushb@umich.edu)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 14.7.0

Wed, 07 Feb 2024 22:00:37 GMT

### Minor changes

- Instrument handleRedirectPromise() #6861 (kshabelko@microsoft.com)
- Track number of times an API is invoked in a single request (thomas.norling@microsoft.com)
- Optimize TimeUtils for smaller bundle size #6837 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Ensure cached access token has a defined realm property in certain OIDC scenarios. (bushb@umich.edu)

## 14.6.1

Tue, 23 Jan 2024 00:06:05 GMT

### Patches

- Fix bug affecting metadata resolution for tenanted authorities (thomas.norling@microsoft.com)

## 14.6.0

Tue, 09 Jan 2024 00:03:25 GMT

### Minor changes

- Dynamically load BrowserPerformanceMeasurement to capture browser perf measurements if session storage flag is set #6748 (kshabelko@microsoft.com)

### Patches

- Don't lookup tokens until they are needed (thomas.norling@microsoft.com)
- Handle bad_token by removing bad refresh token from cache #6757 (hemoral@microsoft.com)
- Convert ThrottlingEntity into a Type (thomas.norling@microsoft.com)
- Refactor AuthorityMetadataEntity into type (thomas.norling@microsoft.com)
- Refactor appMetadataEntity into Type (thomas.norling@microsoft.com)
- Check RT expiration before attempting to redeem it #6703 (thomas.norling@microsoft.com)
- Fix external account loading #6744 (hemoral@microsoft.com)
- Fix token refreshes with relative redirectUri #6761 (thomas.norling@microsoft.com)

## 14.5.0

Fri, 01 Dec 2023 18:46:06 GMT

### Minor changes

- Add support for Multi-tenant accounts and cross-tenant token caching #6466 (hemoral@microsoft.com)

### Patches

- Turn on return-await lint rule #6678 (thomas.norling@microsoft.com)
- Move AADServerParamKeys to individual exports #6701 (thomas.norling@microsoft.com)

## 14.4.0

Tue, 07 Nov 2023 00:01:50 GMT

### Minor changes

- Convert ServerTelemetryEntity to Type instead of Class #6651 (thomas.norling@microsoft.com)
- Make SHR header configurable #6654 (hemoral@microsoft.com)
- Instrument functions that drop multiple matched tokens #6647 (kshabelko@microsoft.com)
- Update hash/query parsing to use runtime provided APIs #6646 (thomas.norling@microsoft.com)

### Patches

- Removing allowestsrnonmsi query parameter (trwalke@microsoft.com)
- Update cache outcome log message #6644 (hemoral@microsoft.com)

## 14.3.0

Mon, 30 Oct 2023 21:38:25 GMT

### Minor changes

- Refactor token cache entities to be defined as Types rather than Classes #6580 (thomas.norling@microsoft.com)

### Patches

- Don't use temporary cache for silent & popup flows #6586 (thomas.norling@microsoft.com)
- Fix hardcoded metadata fetching for tenanted authorities #6622 (hemoral@microsoft.com)

## 14.2.0

Wed, 18 Oct 2023 17:24:19 GMT

### Minor changes

- Build account objects from cached ID Token #6529 (hemoral@microsoft.com)

### Patches

- Added some new error codes/messages for NestedAppAuth. #6359 (email not defined)
- Add new PerformanceEvents for create/remove hidden iframe #6533 (thomas.norling@microsoft.com)
- Additional ATS instrumentation #6562 (thomas.norling@microsoft.com)

## 14.1.0

Thu, 05 Oct 2023 18:06:41 GMT

### Minor changes

-   Add getAccount and enhance account filtering #6499 (hemoral@microsoft.com)
-   Modified proactive refresh in silent-flow to also return the cached token when the token needs to be refreshed #6397 (rginsburg@microsoft.com)

### Patches

-   Refactor ClientAuthError for reduced size #6433 (thomas.norling@microsoft.com)
-   Refactor JoseHeaderError and AuthError for reduced size #6497 (thomas.norling@microsoft.com)
-   Do not add v2.0 to authority endpoint if already exists #6457 (kshabelko@microsoft.com)
-   Instrument Crypto APIs #6512 (thomas.norling@microsoft.com)
-   Refactor ClientConfigurationError #6471 (thomas.norling@microsoft.com)
-   Add tokenBodyParameters support in RefreshTokenClient #6504 (sameera.gajjarapu@microsoft.com)
-   Refactor InteractionRequiredAuthError #6472 (thomas.norling@microsoft.com)
-   use invoke for telem measurements #6486 (thomas.norling@microsoft.com)
-   Add missing queue measurement instrumentation #6480 (kshabelko@microsoft.com)

## 14.0.3

Tue, 05 Sep 2023 22:13:47 GMT

### Patches

-   Clear claims from cache when config is not set #6430 (sameera.gajjarapu@microsoft.com)
-   Make AuthToken methods instead of class #6423 (thomas.norling@microsoft.com)
-   Add a linter rule to avoid floating promises #6421 (sameera.gajjarapu@microsoft.com)
-   Fix for source-map related errors #6398 (lalimasharda@microsoft.com)
-   Make `eventName` of type string for `BrowserPerformanceClient` and `PerformanceClient` #6386 (kshabelko@microsoft.com)
-   Add invoke and invokeAsync to wrap functions with logging/telemetry #6383 (thomas.norling@microsoft.com)

### Changes

-   Extend proactive token refresh to client_credentials #6102 (rgins16@gmail.com)
-   Remove isEmpty helper API (thomas.norling@microsoft.com)

## 14.0.2

Fri, 18 Aug 2023 18:40:02 GMT

### Patches

-   Fix authority endpoint version for B2C authorities #6342 (hemoral@microsoft.com)

## 14.0.1

Fri, 11 Aug 2023 19:00:44 GMT

### Patches

-   Update dist settings for packages #6322 (hemoral@microsoft.com)
-   Replaces `multiple matched tokens error` with a log message, removing matching tokens from cache #6311 (kshabelko@microsoft.com)

### Changes

-   Pick up broker extra query params #6286 (kshabelko@microsoft.com)

## 14.0.0

Mon, 07 Aug 2023 18:15:15 GMT

### Major changes

-   Add CIAM Authority Support(#5865) (sameera.gajjarapu@microsoft.com)
-   Prioritize hardcoded metadata over network-sourced metadata #6231 (hemoral@microsoft.com)

### Minor changes

-   Catch errors thrown by "decodeURIComponent" #6226 (kshabelko@microsoft.com)
-   Add storeInCache request parameter to control which tokens are persisted to the cache (thomas.norling@microsoft.com)
-   Append v2 to endpoint when using a Microsoft authority under OIDC protocol mode (shylasummers@users.noreply.github.com)
-   Update "PerformanceClient" for better usability/extendibility #6270 (kshabelko@microsoft.com)
-   Simplify account generation #6271 (thomas.norling@microsoft.com)
-   Update comments to address Policheck rules (thomas.norling@microsoft.com)
-   Added OIDCOptions parameter to config (shylasummers@users.noreply.github.com)
-   Disable telemetry parameters in the token request when using OIDC protocol mode (shylasummers@users.noreply.github.com)
-   Add exports to package.json and update type to module #6194 (thomas.norling@microsoft.com)
-   Make claims-based caching configurable #6163 (hemoral@microsoft.com)
-   Fix performance bug with regional authority detection #6139 (joarroyo@microsoft.com)
-   Switch from enums to object literals to reduce the bundle size #6056 (kshabelko@microsoft.com)
-   Remove unused params in msal-common #6122 (kshabelko@microsoft.com)
-   Support tenant switching for tenant domain names #6022 (kshabelko@microsoft.com)
-   Add logging to Authority.getEndpointMetadataFromNetwork() #5973 (kshabelko@microsoft.com)

### Patches

-   Added new ClientConfigurationError type for authority mismatch in login request #6002 (lalimasharda@microsoft.com)
-   Fix bugs in CIAM Authority Support (#5917) (sameera.gajjarapu@microsoft.com)
-   Update polycheck version (#5901) (sameera.gajjarapu@microsoft.com)
-   Fix: dSTS Token dummy aud claim value for requests with scope input by using v2.0 endpoint (kapjain@microsoft.com)
-   Exception is thrown in acquireTokenByClientCredential if tenantId is missing #5805 (rginsburg@microsoft.com)
-   `removeAccount` does not throw if account does not exist in cache #5911 (thomas.norling@microsoft.com)
-   Remove unused enum (thomas.norling@microsoft.com)

## 13.0.0

Mon, 01 May 2023 20:47:41 GMT

### Major changes

-   Add CIAM Authority Support(#5865) (sameera.gajjarapu@microsoft.com)

### Patches

-   Fix bugs in CIAM Authority Support (#5917) (sameera.gajjarapu@microsoft.com)
-   Update polycheck version (#5901) (sameera.gajjarapu@microsoft.com)

## 12.0.0

Mon, 03 Apr 2023 21:29:31 GMT

### Major changes

-   Optimize token lookups in cache #5806 (thomas.norling@microsoft.com)
-   Optimize account lookups in cache #5792 (thomas.norling@microsoft.com)

### Patches

-   Added tenant_region_scope and tenant_region_sub_scope to TokenClaims #5789 (lalimasharda@microsoft.com)

## 11.0.0

Tue, 07 Mar 2023 16:48:51 GMT

### Major changes

-   Remove deprecated telemetry event "flushMeasurement()" function #5718 (kshabelko@microsoft.com)
-   Reduce telemetry RAM footprint and improve usability/readability #5676 (kshabelko@microsoft.com)

### Minor changes

-   Handle new spa_accountid parameter from server #5759 (lalimasharda@microsoft.com)
-   Capture native bridge telemetry data points #5698 (kshabelko@microsoft.com)
-   Expose native broker types and interfaces #5485 (thomas.norling@microsoft.com)

### Patches

-   Reduce preQueueTimeByCorrelationId RAM footprint #5681 (kshabelko@microsoft.com)
-   Fixed bug in msal-node's httpClient #5722 (rginsburg@microsoft.com)
-   Fix SHR typ header to pop value #5751 (hemoral@microsoft.com)
-   Accomodate suffixes in credential regex #5728 (kshabelko@microsoft.com)
-   fixing get account entity from cache using native account id #5695 (lalimasharda@microsoft.com)

## 10.0.0

Mon, 06 Feb 2023 18:51:50 GMT

### Major changes

-   proxyUrl is now passed to msal-node's httpClient via it's constructor #5599 (rginsburg@microsoft.com)

### Minor changes

-   tokenQueryParameters are now sent to the /token endpoint for all Confidential Client flows #5573 (rginsburg@microsoft.com)
-   Add JS Queue Measurements #5352 (joarroyo@microsoft.com)
-   Truncate integral telemetry fields #5627 (kshabelko@microsoft.com)
-   Track manually completed sub-measurements #5614 (kshabelko@microsoft.com)

### Patches

-   Update discardCache in PerformanceClient #5645 (joarroyo@microsoft.com)
-   Optimize credential regular expressions #5621 (kshabelko@microsoft.com)
-   Added missing fields to InteractionRequiredAuthError #5566 (rginsburg@microsoft.com)

## 9.1.1

Thu, 19 Jan 2023 23:50:24 GMT

### Patches

-   Update startMeasurement in PerformanceClient #5589 (joarroyo@microsoft.com)
-   Add broker timeouts #5580 (kshabelko@microsoft.com)

## 9.1.0

Wed, 18 Jan 2023 00:33:04 GMT

### Minor changes

-   Adding page visibility change event for silent calls like AcquireTokenSilent #5555 (kshabelko@microsoft.com)

### Patches

-   Add startPerformanceMeasurement to IPerformanceClient #5583 (joarroyo@microsoft.com)
-   Revert typo changes #5582 (joarroyo@microsoft.com)
-   Match long domain names #5581 (kshabelko@microsoft.com)
-   -   Remove `lookBehind` regex as not compatible with Safari browser. #5551 (kshabelko@microsoft.com)
-   add claims to request body in OBO class #5493 (v-ssalem@microsoft.com)

## 9.0.2

Mon, 09 Jan 2023 22:44:58 GMT

### Patches

-   Fix cache credential look-up (#5484) (kshabelko@microsoft.com)
-   fix logger explicitly set to undefined error #5355 (bmahal@microsoft.com)
-   http version telemetry data #5211 (bmahal@microsoft.com)
-   fix typos #5531 (bmahal@microsoft.com)

## 9.0.1

Wed, 07 Dec 2022 16:53:07 GMT

### Patches

-   Fixed Typo in Authority Logs #5430 (rginsburg@microsoft.com)
-   Improvement to Cloud Instance Discovery #5448 (rginsburg@microsoft.com)

## 9.0.0

Mon, 21 Nov 2022 19:14:45 GMT

### Major changes

-   Added logging to Authority class (rginsburg@microsoft.com)

## 8.0.0

Mon, 07 Nov 2022 22:46:55 GMT

### Major changes

-   Add static fields to telemetry #5224 (thomas.norling@microsoft.com)

### Patches

-   Add MATS fields to telemetry #5308 (thomas.norling@microsoft.com)

## 7.6.0

Mon, 10 Oct 2022 22:27:03 GMT

### Minor changes

-   Include refresh token in ExternalTokenResponse #5233 (louisv@microsoft.com)

### Patches

-   Fixed broken homeAccountId check in CacheManager #5246 (rginsburg@microsoft.com)

## 7.5.0

Mon, 03 Oct 2022 22:12:26 GMT

### Minor changes

-   Add x-ms-request-id to perf telemetry logging #5244 (joarroyo@microsoft.com)
-   Added 'no_session' to prompt enum #5131 (rginsburg@microsoft.com)
-   Added Support for the OIDC max_age parameter #5125 (rginsburg@microsoft.com)
-   Add initial support for DSTS authorities in MSAL Common #5212 (hemoral@microsoft.com)

### Patches

-   Implemented Cache Lookup Policy for acquireTokenSilent #5014 (rginsburg@microsoft.com)
-   Include Refresh token size in perf telemetry data #5250 (bmahal@microsoft.com)

## 7.4.1

Mon, 12 Sep 2022 18:19:32 GMT

### Patches

-   Exporting constants #5189 (lalimasharda@microsoft.com)

## 7.4.0

Fri, 02 Sep 2022 18:06:53 GMT

### Minor changes

-   Exposed raw id token on account info objects #5036 (rginsburg@microsoft.com)
-   Export ClientInfo APIs #6886 (lalimasharda@microsoft.com)
-   Add query string parsing helpers #5062 (thomas.norling@microsoft.com)

## 7.3.0

Mon, 01 Aug 2022 22:22:35 GMT

### Minor changes

-   adding network performance measurement #4834 (ellymakuba@microsoft.com)

### Patches

-   Add error handling for server errors in device-code (#5033) (sameera.gajjarapu@microsoft.com)
-   Send login_hint claim instead of sid if available #4990 (janutter@microsoft.com)

## 7.2.0

Mon, 18 Jul 2022 23:26:21 GMT

### Minor changes

-   Add local cache support for JS-WAM bridge #4971 (sameera.gajjarapu@microsoft.com)
-   Added new token size field in perf telemetry data #4973 (bmahal@microsoft.com)
-   support caching rt flow response in migration scenarios (#4844) (v-derisen@microsoft.com)
-   App Token Provider extensibiliy for AzureSDK (bogavril@microsoft.com)

### Patches

-   Fix bug with activeAccount when two accounts have same local account id #5004 (t-ssummers@microsoft.com)

## 7.1.0

Tue, 05 Jul 2022 22:37:04 GMT

### Minor changes

-   feat: adding authority metadata resiliency #4536 (samuelkamau@microsoft.com)
-   Add jwks_uri to Authority, OpenIdConfigResponse, and AuthorityMetadataEntity #4905 (joarroyo@microsoft.com)

### Patches

-   Add InteractionRequired error for native account unavailable #4951 (thomas.norling@microsoft.com)

## 7.0.0

Mon, 13 Jun 2022 22:28:09 GMT

### Major changes

-   Add strict assertion checks for OBO (#4691) (bmahal@microsoft.com)

### Minor changes

-   Fix ClientAssertion configuration typing between common and node #4846 (hemoral@microsoft.com)
-   Add errorCode and subErrorCode to performance telemetry events (#4863) (sameera.gajjarapu@microsoft.com)

## 6.4.0

Mon, 06 Jun 2022 22:13:00 GMT

### Minor changes

-   Add PoP support for Encrypted Access Tokens #4730 (hemoral@microsoft.com)
-   Add ability to set Client Assertion on a per-request basis #4806 (hemoral@microsoft.com)

### Patches

-   Fix password encoding on UsernamePassword flow #4807 (hemoral@microsoft.com)
-   Add keyId to SHR header and make x5c_ca claim type string array #4729 (hemoral@microsoft.com)

## 6.3.0

Mon, 02 May 2022 22:23:33 GMT

### Minor changes

-   fix: Allow direct access to Identity Token Claims #4680 (1292510+svrooij@users.noreply.github.com)
-   Add support for acquiring tokens from the native broker #4531 (thomas.norling@microsoft.com)

### Patches

-   acquireTokenByUsernamePassword will now return an id_token in Azure AD B2C #4694 (christian.kumpe@diva-e.com)

## 6.2.0

Mon, 04 Apr 2022 21:12:42 GMT

### Minor changes

-   Add performance telemetry API #4570 (janutter@microsoft.com)
-   Add Client Application telemetry parameters to MSAL #4616 (prithviraj.kanherkar@microsoft.com)

### Patches

-   removed debug dependency from msal-common #4665 (ellymakuba@microsoft.com)

## 6.1.0

Tue, 08 Feb 2022 00:41:06 GMT

### Minor changes

-   Support proxy in msal-node(#4447) (sameera.gajjarapu@microsoft.com)
-   Add support for logout_hint #4450 (hemoral@microsoft.com)

### Patches

-   Add AzureCloudInstance to JS libraries (sameera.gajjarapu@microsoft.com)

## 6.0.0

Tue, 04 Jan 2022 00:20:29 GMT

### Major changes

-   Add support for requested claims in silent token acquisition #4296 (hemoral@microsoft.com)

### Minor changes

-   Gracefully handle tokenType set as bearer for ADFS #4318 (janutter@microsoft.com)

## 5.2.0

Tue, 07 Dec 2021 00:17:01 GMT

### Minor changes

-   Add APIs needed for hybrid spa flow #3978 (janutter@microsoft.com)

### Patches

-   Fix circular dependencies in AuthenticationHeaderParser and AsyncMemoryStorage #4235 (hemoral@microsoft.com)

## 5.1.0

Mon, 01 Nov 2021 23:53:21 GMT

### Minor changes

-   Add support for ephemeral SSH certificate acquisition #4178 (hemoral@microsoft.com)
-   Add support for SHR nonce #3999 (hemoral@microsoft.com)

### Patches

-   Log reason for cache miss #4199 (thomas.norling@microsoft.com)
-   Update authority metadata error messages (thomas.norling@microsoft.com)
-   Gracefully handle B2C ROPC policies not setting end_session_endpoint property #4173 (janutter@microsoft.com)

## 5.0.1

Mon, 04 Oct 2021 23:12:35 GMT

### Patches

-   Export library version #4124 (thomas.norling@microsoft.com)
-   Consistently export error types and messages for errors thrown by MSAL #4117 (jagore@microsoft.com)
-   Make no_tokens_found error an InteractionRequiredAuthError #4089 (thomas.norling@microsoft.com)

## 5.0.0

Tue, 07 Sep 2021 23:22:24 GMT

### Major changes

-   Add pop params to request thumbprint #3973 (hemoral@microsoft.com)
-   Remove token binding key from key store when refreshing pop token #3500 (hemoral@microsoft.com)

### Minor changes

-   Adds state param to logout url #3909 (bmahal@microsoft.com)
-   Add SignedHttpRequest class #3058 (janutter@microsoft.com)

### Patches

-   Add correlationId property to AuthError #3930 (thomas.norling@microsoft.com)
-   Fix logger constructor #3899 (hemoral@microsoft.com)
-   Add correlationId to AuthenticationResult type #3947 (thomas.norling@microsoft.com)
-   Fix accesstoken_with_authscheme implementation #3910 (hemoral@microsoft.com)
-   Add external token server response type #3895 (joarroyo@microsoft.com)
-   Fixes unescaped backslash and inefficient regex patterns #3993 (thomas.norling@microsoft.com)

## 4.5.1

Mon, 02 Aug 2021 23:19:21 GMT

### Patches

-   Fix double encoding state #3903 (bmahal@microsoft.com)

## 4.5.0

Thu, 22 Jul 2021 22:50:22 GMT

### Minor changes

-   Adding ROPC for confidential client apps (#3838) (sameera.gajjarapu@microsoft.com)
-   feat: add regional authority telemetry #3662 (samuelkamau@microsoft.com)
-   Add support for prompt=create #3773 (joarroyo@microsoft.com)

### Patches

-   Add constant for active account cache key #3755 (thomas.norling@microsoft.com)
-   Fix double query string for logout endpoint #3814 (thomas.norling@microsoft.com)

## 4.4.0

Mon, 28 Jun 2021 23:39:48 GMT

### Minor changes

-   Add CCS parameters to headers or form_data #3636 (prkanher@microsoft.com)
-   Add correlationId to log messages #3601 (joarroyo@microsoft.com)

### Patches

-   Export ServerAuthorizationTokenResponse type #3657 (thomas.norling@microsoft.com)
-   Discard tokens cached after current time #3786 (thomas.norling@microsoft.com)
-   Remove input params from Empty Scopes error constructors #3654 (thomas.norling@microsoft.com)
-   feat: modify the access token filter #3375 (samuelkamau@microsoft.com)
-   fix: fix device code polling bug (samuelkamau@microsoft.com)

## 4.3.0

Wed, 12 May 2021 18:35:03 GMT

### Minor changes

-   add support for regional authorities (samuelkamau@microsoft.com)

### Patches

-   Fix double query string when authority endpoints contain query strings #3620 (thomas.norling@microsoft.com)
-   change msal-browser/msal-common to preserveModules to enable treeshaking #3300 (oo.thomas96@gmail.com)
-   Revert expiresOn type to make it nullable #3557 (hemoral@microsoft.com)
-   Add logLevel Trace to Logger #3589 (joarroyo@microsoft.com)
-   Throw untrustedAuthority error if discovery endpoint returns error in response body #3572 (thomas.norling@microsoft.com)
-   Add claims comparison to accountInfoIsEqual function #3527 (thomas.norling@microsoft.com)
-   Add check for empty object string in claims request parameter #3579 (prkanher@microsoft.com)

## 4.2.1

Thu, 22 Apr 2021 23:26:08 GMT

### Patches

-   Fix typing for expiresOn field (#2994) (prkanher@microsoft.com)
-   Move /token headers to POST body to avoid OPTIONS request (#3094) (thomas.norling@microsoft.com)
-   Change "ts" type from string to number in SignedHttpRequest #3474 (prkanher@microsoft.com)
-   Add .browserslistrc #3471 (thomas.norling@microsoft.com)

## 4.2.0

Wed, 14 Apr 2021 18:39:53 GMT

### Minor changes

-   Adding the refresh_in feature for msal.js #3005 (prkanher@microsoft.com)
-   Add support for AccessToken_With_AuthScheme credential type #3426 (hectormgdev@gmail.com)

### Patches

-   Make SHR parameters optional #3320 (hemoral@microsoft.com)

## 4.1.1

Wed, 31 Mar 2021 22:25:57 GMT

### Patches

-   Update StringUtils.matchPattern to account for queries in string #3307 (joarroyo@microsoft.com)
-   Adds tokenQueryParameters request param #3309 (thomas.norling@microsoft.com)
-   Ignore account hints when prompt=select_account #3315 (thomas.norling@microsoft.com)

## 4.1.0

Wed, 24 Mar 2021 22:55:46 GMT

### Minor changes

-   Add client claims support for SHRs (#3089) (hemoral@microsoft.com)

### Patches

-   Properly handle expiration timestamps when returned as strings (janutter@microsoft.com)
-   Add null as possible type for account on EndSessionRequest #3044 (thomas.norling@microsoft.com)

## 4.0.3

Mon, 15 Mar 2021 23:45:17 GMT

### Patches

-   Use sid from account when available #3147 (prkanher@microsoft.com)
-   Add network error for failed requests (#3146) (thomas.norling@microsoft.com)

## 4.0.2

Wed, 03 Mar 2021 21:47:05 GMT

### Patches

-   Fix OIDC Scopes Caching Issue (#3065) (prkanher@microsoft.com)

## 4.0.1

Thu, 18 Feb 2021 00:34:32 GMT

### Patches

-   Clarify Device Code Timeout units (#3031) (hemoral@microsoft.com)

## 4.0.0

Tue, 09 Feb 2021 01:48:22 GMT

### Major changes

-   Add API Extractor for msal-node (sameera.gajjarapu@microsoft.com)

### Patches

-   Fix version.json import errors (#2993) (thomas.norling@microsoft.com)
-   Setting postLogoutRedirectUri as null will disable post logout redirect (janutter@microsoft.com)
-   Ignore OIDC scopes during cache lookup or replacement (#2969) (prkanher@microsoft.com)

## 3.1.0

Tue, 02 Feb 2021 01:56:47 GMT

### Minor changes

-   Add wrapper SKU and version to current telemetry header (#2845) (thomas.norling@microsoft.com)

### Patches

-   Fix token timestamp calculation (prkanher@microsoft.com)
-   Fix B2C policy switching (#2949) (thomas.norling@microsoft.com)
-   Get package version from version.json (#2915) (thomas.norling@microsoft.com)

## 3.0.0

Thu, 21 Jan 2021 21:48:01 GMT

### Major changes

-   Authority metadata caching (#2758) (thomas.norling@microsoft.com)

## 2.1.0

Tue, 12 Jan 2021 00:51:26 GMT

### Minor changes

-   Add interface stubs (#2792) (thomas.norling@microsoft.com)

### Patches

-   Adding account info equality check function (#2728) (prkanher@microsoft.com)
-   Adding device code timeout to the device code request(#2656) (samuel.kamau@microsoft.com)

## 2.0.0

Mon, 07 Dec 2020 22:19:03 GMT

### Major changes

-   Enable StrictNullChecks (#2602) (thomas.norling@microsoft.com)
-   Rename request types and change required fields (#2512) (thomas.norling@microsoft.com)

### Minor changes

-   Add clone to Logger (#2670) (joarroyo@microsoft.com)
-   Enable the instance_aware flow (#1804) (prkanher@microsoft.com)
-   Support id_token_hint on logout request (#2587) (thomas.norling@microsoft.com)

### Patches

-   Fix login loop with empty query string (#2707) (thomas.norling@microsoft.com)
-   Expose idTokenClaims on AccountInfo (#2554) (janutter@microsoft.com)
-   Add matchPattern string util for wildcard matching for urls (#2678) (janutter@microsoft.com)
-   fix: added missing async (AzureAD/microsoft-authentication-library-for-js#2652) (patrick@ruhkopf.me)
-   Log messages contain package name and version (#2589) (thomas.norling@microsoft.com)

## 1.7.2

Wed, 11 Nov 2020 23:33:20 GMT

### Patches

-   Add getAbsolutePath helper function to UrlString class (#2560) (thomas.norling@microsoft.com)

## 1.7.1

Tue, 10 Nov 2020 01:48:44 GMT

### Patches

-   Enhance lookup for IdTokens/AppMetadata (#2530) (sameera.gajjarapu@microsoft.com)
-   Add LocalAccountId for ADFS usecases (#2573) (sameera.gajjarapu@microsoft.com)

## 1.7.0

Sat, 07 Nov 2020 01:50:14 GMT

### Minor changes

-   Implement Password Grant Flow (#2204) (sameera.gajjarapu@microsoft.com)
-   Fixing a bug and adding `localAccountId` in AccountInfo interface (#2516) (sameera.gajjarapu@microsoft.com)

### Patches

-   Mandate localAccount in AccountInfo (sameera.gajjarapu@microsoft.com)
-   Filtered lookup of IdTokens, AppMetadata; Error handling in Node Storage (#2530) (sameera.gajjarapu@microsoft.com)

## 1.6.3

Mon, 26 Oct 2020 21:00:29 GMT

### Patches

-   Fix ServerTelemetry maxErrorToSend bug (#2491) (thomas.norling@microsoft.com)
-   Add missing default headers to device code (sameera.gajjarapu@microsoft.com)
-   msal-browser and msal-node cache Interfaces to msal-common updated (#2415) (sameera.gajjarapu@microsoft.com)

## 1.6.2

Tue, 20 Oct 2020 23:47:28 GMT

### Patches

-   Adds support for any OIDC-compliant authority (#2389). (jamckenn@microsoft.com)

## 1.6.1

Thu, 15 Oct 2020 00:49:18 GMT

### Patches

-   Removing unused errors in msal-common and fixing possible build errors in @azure/msal-common@1.6.0 (#2432) (sameera.gajjarapu@microsoft.com)

## 1.6.0

Wed, 14 Oct 2020 23:45:07 GMT

### Minor changes

-   Add support for persistence cache plugin (#2348) (sameera.gajjarapu@microsoft.com)

### Patches

-   Add Telemetry header size limit (#2223) (thomas.norling@microsoft.com)

## 1.5.0

Fri, 02 Oct 2020 17:42:35 GMT

### Minor changes

-   Implementation of Access Token Proof-of-Possession Flow (#2151, #2153, #2154, #2209, #2289) (prkanher@microsoft.com)

## 1.4.0

Wed, 23 Sep 2020 21:13:48 GMT

### Minor changes

-   FOCI - Family of Client IDs feature (#2201) (sameera.gajjarapu@microsoft.com)

### Patches

-   Remove null in function return types to be compatible with ICacheManager.ts (#2335) (sameera.gajjarapu@microsoft.com)
-   Scopes stored case sensitive, compared case insensitive (#2302) (sameera.gajjarapu@microsoft.com)

## 1.3.0

Thu, 17 Sep 2020 23:16:22 GMT

### Minor changes

-   Add support for On-behalf-of flow (#2157) (sagonzal@microsoft.com)
-   ValidCacheType adds ServerTelemetryEntity (sameera.gajjarapu@microsoft.com)
-   Added client-side throttling to enhance server stability (#1907) (jamckenn@microsoft.com)

### Patches

-   Add name field to AccountInfo (#2288) (jamckenn@microsoft.com)
-   Realm should fallback to an empty string for non AAD scenarios (sameera.gajjarapu@microsoft.com)
-   Add default scopes in all requests and ignore in cache lookups (#2267) (thomas.norling@microsoft.com)
-   Move refreshToken API to RefreshTokenClient (#2264) (thomas.norling@microsoft.com)
-   Track Suberrors in Telemetry (#1921) (thomas.norling@microsoft.com)
-   Separate cache lookup from token refresh (#2189) (thomas.norling@microsoft.com)

## 1.2.0

Tue, 25 Aug 2020 00:40:45 GMT

### Minor changes

-   Client Capabilities Support (#2169) (thomas.norling@microsoft.com)
-   Add support for acquiring tokens with client credentials grant (sagonzal@microsoft.com)

### Patches

-   ignore offline_access in scopes lookup (sameera.gajjarapu@microsoft.com)
-   Adds checks for cache entities (sameera.gajjarapu@microsoft.com)
-   Add claims request to /token calls (#2138) (thomas.norling@microsoft.com)
-   Fix Telemetry cacheHit Bug (#2170) (thomas.norling@microsoft.com)
-   Get username from emails claim in B2C scenarios (#2114) (thomas.norling@microsoft.com)
-   Update POST header to type Record (#2128) (thomas.norling@microsoft.com)

## 1.1.1

Thu, 13 Aug 2020 02:20:48 GMT

### Patches

-   knownAuthorities enhancements (#2106) (thomas.l.norling@gmail.com)
-   Update typing of IdTokenClaims (#2105) (hemoral@microsoft.com)
-   Fix hash parsing issue from #2118 and back button cache clearing (#2129) (prkanher@microsoft.com)

# 1.1.0

## Breaking Changes

-   None

## Features and Fixes

-   Decode state from URI Encoding before comparing (#2049)
-   getAllAccounts() returns empty array instead of `null` (#2059)
-   Updated the `UrlString.canonicalizeUri()` API to be static (#2078)
-   Add sid to `AuthorizationUrlRequest` and as part of request parameters sent to server (#2030)
-   Enable server telemetry headers to be formatted and sent in every request (#1917)
-   Enable platform level state information to be sent and read through the request state (#2045)
-   Add the confidential client flow (#2023)

# 1.0.0

## Breaking Changes

-   None

## Features and Fixes

-   Fixed an issue where scopes were being made lower case before being sent to the service (#1961)
-   Fix an issue where token values were replaced with undefined if not sent by server (#1946)
-   Fix an issue where cache lookup for accounts was not working correctly (#1919)
-   Removed TelemetryOptions from msal-common since they were unused (#1983)
-   Add a response handler for the device code flow (#1947)

# 1.0.0-beta.4

## Breaking Changes

-   None

## Features and Fixes

-   Fix an issue where state may be encoded twice on the server-side (#1852)
-   Fix an issue where extraScopesToConsent was not appending scopes correctly (#1854)
-   Fix an issue where the expiration was not being calculated correctly (#1860)
-   Add correlationId to all requests (#1868)

# 1.0.0-beta.3

## Breaking Changes

-   `Request` update in msal-common (#1682, #1771)
-   AccountInfo interface (#1789)
-   Removal of SPA Client (#1793)
-   Unified Cache support (#1444, #1471, #1519, #1520, #1522, #1609, #1622, #1624, #1655, #1680, #1762)

## Features and Fixes

-   Initialization of B2cTrustedHostList (#1646)
-   SilentFlow support (#1711)
-   Utilize `Scopeset` across all libraries (#1770)
-   `state` support in msal-common (#1790)
-   EndSessionRequest (#1802)

# 1.0.0-beta.2

-   Fixed an issue where types were not being exported from the correct location (#1613)
-   Fixed an issue where system configuration values were being overwritten with `undefined` (#1631)
-   Added support for sub-error codes from the eSTS service (#1533)

# 1.0.0-beta.1

-   Fixed an issue where types are not exported correctly (#1517)
-   Logger class is now exported (#1486)
-   Added knownAuthorities to support B2C authorities (#1416)
-   Refactored authority classes for B2C use cases (#1424)
-   Synced all classes and objects to work for both @azure/msal-browser and @azure/msal-node (#1552)
-   Merged configuration for node and browser classes (#1575)
-   Fixed issue with caching for multiple resources (#1553)
-   Adding support for node classes
    -   Refresh token client (#1496)
    -   Device code client (#1550, #1434)
    -   Authorization Code Client (#1434)

# 1.0.0-beta.0

-   Fully functioning project completed
-   Build and test pipelines in place
-   Added bug fixes from unit testing
-   Added docs and samples

# 0.0.1

-   Created library with initial files for repo structure, build and package dependencies
