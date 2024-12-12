# Change Log - @azure/msal-browser

This log was last generated on Tue, 05 Nov 2024 18:58:45 GMT and should not be manually modified.

<!-- Start content -->

## 3.27.0

Tue, 05 Nov 2024 18:58:45 GMT

### Minor changes

- Capture runtime errors in telemetry for submeasures (thomas.norling@microsoft.com)
- Additional network failure telemetry (thomas.norling@microsoft.com)
- Add first order broker parameters #7348 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.16.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

### Patches

- Move requestId telemetry collection (thomas.norling@microsoft.com)

## 3.26.1

Tue, 08 Oct 2024 20:45:26 GMT

### Patches

- Respect cache policy and claims set in the request #7363 (sameera.gajjarapu@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

## 3.26.0

Tue, 08 Oct 2024 16:51:05 GMT

### Minor changes

- Add optional event type filter to addEventCallback #7351 (thomas.norling@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

### Patches

- Bug fixes for windowless PCA (shylasummers@microsoft.com)

## 3.25.0

Thu, 03 Oct 2024 00:40:42 GMT

### Minor changes

- Mute no_server_response error when back navigation is detected #7342 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

## 3.24.0

Thu, 19 Sep 2024 23:48:30 GMT

### Minor changes

- Fix type resolution when using moduleResolution node16 (thomas.norling@microsoft.com)
- Allow passing popup parent for multi-window flows (chrp@microsoft.com)
- Add 'instance_aware' auth config param #7259 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.15.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1
- Bump rollup-msal to v0.0.0

### Patches

- Add clientLibrary and clientLibraryVersion parameters to NAA Request (#7297) (dasau@microsoft.com)
- Add __initializeNestedAppAuth function for Nested App Auth (#7289) (dasau@microsoft.com)

## 3.23.0

Tue, 03 Sep 2024 21:57:24 GMT

### Minor changes

- Bump version (hemoral@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.22.1

Tue, 03 Sep 2024 21:30:55 GMT

### Patches

- Bump version (hemoral@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.22.0

Wed, 28 Aug 2024 23:06:01 GMT

### Minor changes

- Remove retry for popup and redirect #7270 (joarroyo@microsoft.com)
- Revert 'Use high precision TS for NAA message time (#7243)' (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.14.2
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.21.0

Tue, 13 Aug 2024 23:25:07 GMT

### Minor changes

- Retry in RedirectClient for invalid_grant errors #7231 (joarroyo@microsoft.com)
- Retry in SilentIframeClient for invalid_grant errors #7218 (joarroyo@microsoft.com)
- Retry in PopupClient for invalid_grant errors #7216 (joarroyo@microsoft.com)
- Bump @azure/msal-common to v14.14.1
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Update request retry for invalid_grant #7249 (joarroyo@microsoft.com)
- onRedirectNavigate deprecation fix #7251 (joarroyo@microsoft.com)
- Use high precision TS for NAA message time #7243 (kshabelko@microsoft.com)

## 3.20.0

Tue, 23 Jul 2024 14:19:34 GMT

### Minor changes

- Track MSAL node SKU for broker flows #7213 (kshabelko@microsoft.com)
- Track MSAL SKU for broker flows #7182 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.14.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.19.1

Tue, 16 Jul 2024 18:22:27 GMT

### Patches

- Generate tenantProfile even without idTokenClaims (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.13.1
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.19.0

Fri, 12 Jul 2024 19:56:47 GMT

### Minor changes

- Add missing param to PCA.initialize #7194 (kshabelko@microsoft.com)
- Add correlation id param to initialize and clearTokensAndKeysWithClaims APIs to streamline telemetry data analysis #7190 (kshabelko@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Remove onRedirectNative call back function in native ATRedirect calls #7193 (lalimasharda@microsoft.com)

## 3.18.0

Mon, 01 Jul 2024 19:18:29 GMT

### Minor changes

- Add main field to package.json (thomas.norling@microsoft.com)
- Relax loadExternalTokens requirements to allow loading access or refresh tokens without id_token (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.13.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- fix : msal-browser acquireTokenSilentAsync memory leak (127046736+shaouari-Dev@users.noreply.github.com)
- Update error message typo in NAA errors (sameera.gajjarapu@microsoft.com)

## 3.17.0

Mon, 10 Jun 2024 22:30:36 GMT

### Minor changes

- Add support for apps to set their own `reqCnf` and correct native flows cnf format #6357 (sameera.gajjarapu@microsoft.com)
- Bump @azure/msal-common to v14.12.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.16.0

Tue, 04 Jun 2024 00:08:57 GMT

### Minor changes

- Instrument pre-redirect flow #7134 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.11.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.15.0

Tue, 28 May 2024 21:37:23 GMT

### Minor changes

- Add createNestablePublicClientApplication() (sameera.gajjarapu@microsoft.com)
- Instrument preflight check errors #7113 (kshabelko@microsoft.com)
- Support cache in NAA apps #7072 (sameera.gajjarapu@microsoft.com)
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Fix miscalculation of expiresIn in hydrateCache() API (sameera.gajjarapu@microsoft.com)

## 3.14.0

Mon, 06 May 2024 23:48:17 GMT

### Minor changes

- Instrument scenario id for tracking custom user prompts #7043 (kshabelko@microsoft.com)
- Discard empty redirect telemetry events with no error codes #7058 (kshabelko@microsoft.com)
- Export invoke and invokeAsync functions #7065 (kshabelko@microsoft.com)
- Instrument account type #7049 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.10.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Add getAccount API to IPublicClientApplication (#7019) (dasau@microsoft.com)
- Fix uncaught exceptions in acquireTokenSilent #7073 (thomas.norling@microsoft.com)
- Add additional logging for Nested App Auth initialization errors (#7064) (dasau@microsoft.com)

## 3.13.0

Thu, 11 Apr 2024 21:46:57 GMT

### Minor changes

- Capture and instrument cache errors #7021 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.9.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Nested App Auth: allow empty parameters for loginPopup (#6941) (dasau@microsoft.com)
- Improve perf and reliability of parallel acquireTokenSilent calls that must fallback to iframes #6962 (thomas.norling@microsoft.com)
- fix handleRedirectPromise memoization #6998 (thomas.norling@microsoft.com)
- Add classname to silent token renewal iframe HTML element #6985 (lalimasharda@microsoft.com)

## 3.11.1

Wed, 27 Mar 2024 18:41:17 GMT

### Patches

- Bump @azure/msal-common to v14.8.1
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

## 3.11.0

Fri, 22 Mar 2024 20:32:39 GMT

### Minor changes

- Instrument non-auth error name and stack #6937 (kshabelko@microsoft.com)
- Capture telemetry event tree #6948 (kshabelko@microsoft.com)
- Move preflightBrowserEnvironmentCheck to BrowserUtils (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.8.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Fix AcquireTokenSilentAsync sub-measurement instrumentation #6947 (kshabelko@microsoft.com)
- Export IPerformanceClient and StubPerformanceClient (thomas.norling@microsoft.com)
- move build request functions (thomas.norling@microsoft.com)
- Internal refactor of async storage (thomas.norling@microsoft.com)
- Fix compatibility issue with Nested App Auth and msal-react (#6892) (dasau@microsoft.com)
- Minor cache cleanup (thomas.norling@microsoft.com)

## 3.10.0

Sat, 17 Feb 2024 01:49:05 GMT

### Minor changes

- Export createGuid function #6868 (kshabelko@microsoft.com)
- Use UUIDv7 in PerformanceClient #6866 (kshabelko@microsoft.com)
- Bump @azure/msal-common to v14.7.1
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- Add ID Token secret to AccountInfo in all reponses #6903 (hemoral@microsoft.com)
- Bug fix for user switch error and broker app's native account id being stored in embedded app cache #6846 (lalimasharda@microsoft.com)
- Remove invalid prompt for silent request instead of throwing an error #6895 (kshabelko@microsoft.com)

## 3.9.0

Wed, 07 Feb 2024 22:00:37 GMT

### Minor changes

- Instrument handleRedirectPromise() #6861 (kshabelko@microsoft.com)
- Make BrowserCrypto generate UUID v7 by default #6841 (kshabelko@microsoft.com)
- Add active account update event #6854 (hemoral@microsoft.com)
- Bump @azure/msal-common to v14.7.0
- Bump eslint-config-msal to v0.0.0
- Bump msal-test-utils to v0.0.1

### Patches

- reduce number of calls to resolveEndpoints (thomas.norling@microsoft.com)

## 3.7.1

Tue, 23 Jan 2024 00:06:05 GMT

### Patches

- Support state on acquireTokenSilent (thomas.norling@microsoft.com)
- Fix bug affecting metadata resolution for tenanted authorities (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.6.1

## 3.7.0

Tue, 09 Jan 2024 00:03:25 GMT

### Minor changes

- Dynamically load BrowserPerformanceMeasurement to capture browser perf measurements if session storage flag is set #6748 (kshabelko@microsoft.com)
- Check RT expiration before attempting to redeem it #6703 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.6.0

### Patches

- Fix token refreshes with relative redirectUri #6761 (thomas.norling@microsoft.com)
- Change Nested App Auth internal schema (#6737) (dasau@microsoft.com)
- Allow overriding log level and PII setting with session storage key-values #6704 (kshabelko@microsoft.com)
- Fix external account loading #6744 (hemoral@microsoft.com)
- Handle bad_token by removing bad refresh token from cache #6757 (hemoral@microsoft.com)
- Convert ThrottlingEntity into a Type (thomas.norling@microsoft.com)
- Refactor AuthorityMetadataEntity into type (thomas.norling@microsoft.com)
- Refactor appMetadataEntity into Type (thomas.norling@microsoft.com)

## 3.6.0

Fri, 01 Dec 2023 18:46:06 GMT

### Minor changes

- Increase default iframe timout to 10s #6700 (hemoral@microsoft.com)
- Add support for Multi-tenant accounts and cross-tenant token caching #6466 (hemoral@microsoft.com)
- Bump @azure/msal-common to v14.5.0

### Patches

- Nested App Auth minor fixes (#6672) (dasau@microsoft.com)
- Performance optimization when creating hidden iframe (thomas.norling@microsoft.com)
- Nested App Auth fix for Android response (#6707) (dasau@microsoft.com)
- Fix logoutPopup request type (thomas.norling@microsoft.com)
- Fix bug causing temporary cache not to be cleared #6676 (thomas.norling@microsoft.com)

## 3.5.0

Tue, 07 Nov 2023 00:01:50 GMT

### Minor changes

- Optimize response parsing & address bugs related to query response type #6646 (thomas.norling@microsoft.com)
- Convert ServerTelemetryEntity to Type instead of Class #6651 (thomas.norling@microsoft.com)
- Make SHR header configurable #6654 (hemoral@microsoft.com)
- Bump @azure/msal-common to v14.4.0

### Patches

- Generate one correlation id across a flow #6650 (sameera.gajjarapu@microsoft.com)
- Fix race condition which may cause popups not to close #6652 (thomas.norling@microsoft.com)

## 3.4.0

Mon, 30 Oct 2023 21:38:24 GMT

### Minor changes

- Don't use temporary cache for silent & popup flows #6586 (thomas.norling@microsoft.com)
- Refactor token cache entities to be defined as Types rather than Classes #6580 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.3.0

### Patches

- Fix iframe fallback when RT is not found in cache (thomas.norling@microsoft.com)
- Use invokeAsync in popup/redirect flows (thomas.norling@microsoft.com)
- Add inlineDynamicImports to rollup config to fix CJS build. Make factory methods basic functions #6615 (kshabelko@microsoft.com)

## 3.3.0

Wed, 18 Oct 2023 17:24:19 GMT

### Minor changes

- Build account objects from cached ID Token #6529 (hemoral@microsoft.com)
- Added new PublicClientNext and additional Operating Contexts and associated Controllers; Initially to address NestedAppAuth. #6359 (email not defined)
- Replace custom encoder with TextEncoder in code challenge generator #6560 (thomas.norling@microsoft.com)
- Preconnect to authority to speed up /token calls #6550 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v14.2.0

### Patches

- Instrument create/remove hidden iframe & refactor monitorIframeForHash #6533 (thomas.norling@microsoft.com)
- Additional ATS instrumentation #6562 (thomas.norling@microsoft.com)
- addressing rollup issue based on combined configuration (email not defined)

## 3.2.0

Thu, 05 Oct 2023 18:06:42 GMT

### Minor changes

-   Modified proactive refresh in silent-flow to also return the cached token when the token needs to be refreshed #6397. (rginsburg@microsoft.com)
-   Refactor BrowserConfigurationAuthError #6473 (thomas.norling@microsoft.com)
-   Add getAccount and enhance account filtering #6499 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v14.1.0

### Patches

-   doc: JSDoc for deprecated BrowserAuthErrorMessage (renaud.aste@ocea-sb.com)
-   Instrument Crypto APIs #6512 (thomas.norling@microsoft.com)
-   Refactor ClientAuthError for reduced size #6433 (thomas.norling@microsoft.com)
-   Fix monitorIframeForHash telemetry event name (thomas.norling@microsoft.com)
-   Use the proper algo name for `window.crypto.subtle.digest()` #6521 (kshabelko@microsoft.com)
-   use invoke for telem measurements #6486 (thomas.norling@microsoft.com)
-   Refactor NativeAuthError, JoseHeaderError and AuthError for reduced size #6497 (thomas.norling@microsoft.com)
-   Update telemetry measurements to use invoke #6484 (thomas.norling@microsoft.com)
-   Add tokenBodyParameters support in RefreshTokenClient #6504 (sameera.gajjarapu@microsoft.com)
-   Refactor ClientConfigurationError #6471 (thomas.norling@microsoft.com)
-   Refactor InteractionRequiredAuthError #6472 (thomas.norling@microsoft.com)
-   Bug fix: id token Base64 decoding #6535 (lalimasharda@microsoft.com)
-   Add missing queue measurement instrumentation #6480 (kshabelko@microsoft.com)

## 3.1.0

Tue, 05 Sep 2023 22:13:47 GMT

### Minor changes

-   Remove legacy code (IE11 Detection, XHRClient and custom GUID Generator) (thomas.norling@microsoft.com)
-   Remove redundant controller internal methods and classes from internals #6413 (kshabelko@microsoft.com)
-   New API to silently clear cache #6374 (lalimasharda@microsoft.com)
-   Remove browser internals #6420 (kshabelko@microsoft.com)
-   Bump @azure/msal-common to v14.0.3

### Patches

-   Clear claims from cache when config is not set #6430 (sameera.gajjarapu@microsoft.com)
-   Add a linter rule to avoid floating promises #6421 (sameera.gajjarapu@microsoft.com)
-   Make AuthToken methods instead of class #6423 (thomas.norling@microsoft.com)
-   Make `eventName` of type string for `BrowserPerformanceClient` and `PerformanceClient` #6386 (kshabelko@microsoft.com)
-   Refactor BrowserAuthError to reduce size (thomas.norling@microsoft.com)
-   Make base64 encoder and decoder methods instead of classes #6416 (thomas.norling@microsoft.com)
-   Instrument ssoSilent #6383 (thomas.norling@microsoft.com)
-   Fix for source-map related errors #6398 (lalimasharda@microsoft.com)

### Changes

-   Remove isEmpty helper API (thomas.norling@microsoft.com)

## 3.0.2

Fri, 18 Aug 2023 18:40:03 GMT

### Patches

-   Fix input parameter type for addEventCallback (thomas.norling@microsoft.com)
-   Extend hydrateCache request type to include ssoSilentRequest, PopupRequest and RedirectRequest #6329 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v14.0.2

## 3.0.1

Fri, 11 Aug 2023 19:00:44 GMT

### Patches

-   Update dist settings for packages #6322 (hemoral@microsoft.com)
-   Add `tokenBodyParameters` to silent and interaction request types #6325 (kshabelko@microsoft.com)
-   Bump @azure/msal-common to v14.0.1

### Changes

-   Pick up broker extra query params #6286 (kshabelko@microsoft.com)

## 3.0.0

Mon, 07 Aug 2023 18:15:15 GMT

### Major Changes

-   Revert allowNativeBroker default to false #6280 (hemoral@microsoft.com)
-   Throw when initialize has not been called #6233 (hemoral@microsoft.com)
-   `allowNativeBroker` configuration defaults to `true` #5616 (hemoral@microsoft.com)
-   Fix telemetry typos #5868 (kshabelko@microsoft.com)

### Minor Changes

-   Expose CacheRecord as part of internals API #6291 (kshabelko@microsoft.com)
-   Add exports to package.json and update type to module #6194 (thomas.norling@microsoft.com)
-   Added OIDCOptions parameter to config (shylasummers@users.noreply.github.com)
-   Expose `BrowserPerformanceClient` and `BrowserPerformanceMeasurement` artifacts as public #6273 (kshabelko@microsoft.com)
-   Update "PerformanceClient" for better usability/extendibility #6270 (kshabelko@microsoft.com)
-   Add hydrateCache API #6271 (thomas.norling@microsoft.com)
-   Add storeInCache request parameter to control which tokens are persisted to the cache (thomas.norling@microsoft.com)
-   Make claims-based caching configurable #6163 (hemoral@microsoft.com)
-   Update string conversion function (thomas.norling@microsoft.com)
-   Make account info mandatory for AuthenticationResult and CacheRecord types #6156 (kshabelko@microsoft.com)
-   Export IdTokenClaims & PromptValue types (thomas.norling@microsoft.com)
-   Switch from enums to object literals to reduce the bundle size #6056 (kshabelko@microsoft.com)
-   Fix inProgress state reset when page restored from bfCache #6037 (thomas.norling@microsoft.com)
-   Remove legacy MsCrypto and MsrCrypto polyfill to reduce the bundle size #6086 (kshabelko@microsoft.com)
-   Update bundled files to be included in published package #5997 (hemoral@microsoft.com)
-   Revert to common as a regular dependency #5985 (hemoral@microsoft.com)
-   Add CIAM support for v3(#5915) (sameera.gajjarapu@microsoft.com)
-   Add temporaryCacheLocation to Cache Options #5725 (nicolas.zawada@gmail.com)
-   Randomize native extension response identifiers to facilitate concurrency #5903 (kshabelko@microsoft.com)

### Patches

-   Bump @azure/msal-common to v14.0.0
-   Treat invalid_method as a fatal error for WAM #6094 (thomas.norling@microsoft.com)
-   Added authority check for native and silent flows #6002 (lalimasharda@microsoft.com)
-   Fix silent cache lookup bugs for native flows #6067 (sameera.gajjarapu@microsoft.com)
-   ignore native broker initialize check if application is not top-frame #6129 (lalimasharda@microsoft.com)
-   Fix prepack hook #5967 (kshabelko@microsoft.com)
-   Bundle local version of msal-common into msal-browser #5953 (kshabelko@microsoft.com)
-   Fix missing idToken in response after refresh #5871 (thomas.norling@microsoft.com)
-   Improve iframe error detection #5891 (thomas.norling@microsoft.com)
-   Fix: dSTS Token dummy aud claim value for requests with scope input by using v2.0 endpoint (kapjain@microsoft.com)
-   Exception is thrown in acquireTokenByClientCredential if tenantId is missing #5805 (rginsburg@microsoft.com)
-   `removeAccount` does not throw if account does not exist in cache #5911 (thomas.norling@microsoft.com)
-   Remove unused enum (thomas.norling@microsoft.com)

## 2.37.0

Mon, 01 May 2023 20:47:44 GMT

### Minor changes

-   Add temporaryCacheLocation to Cache Options #5725 (nicolas.zawada@gmail.com)
-   Bump @azure/msal-common to v13.0.0

### Patches

-   Fix missing idToken in response after refresh #5870 (thomas.norling@microsoft.com)

## 2.35.0

Mon, 03 Apr 2023 21:29:32 GMT

### Minor changes

-   Optimize account lookups in cache #5792 (thomas.norling@microsoft.com)
-   Optimize token lookups in cache #5806 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v12.0.0

### Patches

-   Fix missing telemetry queue information #5809 (kshabelko@microsoft.com)
-   Dup code removal in NativeInteractionClient (#5768) (sameera.gajjarapu@microsoft.com)

## 2.34.0

Tue, 07 Mar 2023 16:48:51 GMT

### Minor changes

-   Reduce telemetry RAM footprint and improve usability/readability #5676 (kshabelko@microsoft.com)
-   Capture native bridge telemetry data points #5698 (kshabelko@microsoft.com)
-   Bump @azure/msal-common to v11.0.0

### Patches

-   Reduce preQueueTimeByCorrelationId RAM footprint #5681 (kshabelko@microsoft.com)
-   exporting native classes as internals and separating out native telemetry #5692 (lalimasharda@microsoft.com)
-   Remove deprecated telemetry `flushMeasurements()` function from unit tests #5718 (kshabelko@microsoft.com)
-   Refactor handleNativeResponse (#5757) (sameera.gajjarapu@microsoft.com)
-   Add support for hybrid flow with native bridge enabled #5759 (lalimasharda@microsoft.com)

## 2.33.0

Mon, 06 Feb 2023 18:51:51 GMT

### Minor changes

-   Add JS Queue Measurements to acquireTokenSilent #5352 (joarroyo@microsoft.com)
-   proxyUrl is now passed to msal-node's httpClient via it's constructor #5599 (rginsburg@microsoft.com)
-   Bump @azure/msal-common to v10.0.0

### Patches

-   Removed tokenQueryParameters from Public Client flows because they don't use the /token endpoint. #5573 (rginsburg@microsoft.com)
-   Export browser telemetry classes #5641 (kshabelko@microsoft.com)
-   Adding page visibility change event for silent calls like AcquireTokenSilent #5555 (kshabelko@microsoft.com)
-   Revert typo changes #5582 (joarroyo@microsoft.com)

## 2.32.2

Mon, 09 Jan 2023 22:44:57 GMT

### Patches

-   Export CryptoOps and NativeAuthError for internal use #5482 (lalimasharda@microsoft.com)
-   added http version changes #5211 (bmahal@microsoft.com)
-   fix typos #5531 (bmahal@microsoft.com)
-   fix logger explicitly set to undefined error #5355 (bmahal@microsoft.com)
-   Log number of accounts in trace mode. #5529 (kshabelko@microsoft.com)
-   Bump @azure/msal-common to v9.0.2

## 2.32.1

Wed, 07 Dec 2022 16:53:07 GMT

### Patches

-   Added caching methods to set or get redirect context of application during redirect flow. #5411 (lalimasharda@microsoft.com)
-   Bump @azure/msal-common to v9.0.1

## 2.32.0

Mon, 21 Nov 2022 19:14:45 GMT

### Minor changes

-   Added logging to Authority class (rginsburg@microsoft.com)
-   Bump @azure/msal-common to v9.0.0

### Patches

-   Export popup attributes #5364 (hemoral@microsoft.com)

## 2.31.0

Mon, 07 Nov 2022 22:46:55 GMT

### Minor changes

-   Add static fields to telemetry #5224 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v8.0.0

### Patches

-   Add MATS fields to telemetry #5308 (thomas.norling@microsoft.com)
-   Fix double prompt in native broker redirect flow #5239 (thomas.norling@microsoft.com)

## 2.30.0

Mon, 10 Oct 2022 22:27:02 GMT

### Minor changes

-   Extend msal-browser TokenCache to load refresh tokens #5233 (louisv@microsoft.com)
-   Make popup poll interval configurable #5276 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v7.6.0

## 2.29.0

Mon, 03 Oct 2022 22:12:26 GMT

### Minor changes

-   Implemented Cache Lookup Policy for acquireTokenSilent #5014 (rginsburg@microsoft.com)
-   Add support for MSR Crypto #3826 (janutter@microsoft.com)
-   Add x-ms-request-id to perf telemetry logging #5244 (joarroyo@microsoft.com)
-   Added 'no_session' to prompt enum #5131 (rginsburg@microsoft.com)
-   Bump @azure/msal-common to v7.5.0

### Patches

-   Include Refresh token size in perf telemetry data #5250 (bmahal@microsoft.com)

## 2.28.3

Mon, 12 Sep 2022 18:19:32 GMT

### Patches

-   Fix keystore clearing on Firefox #5112 (hemoral@microsoft.com)
-   Restore error codes for acquireTokenSilent telemetry #5190 (janutter@microsoft.com)
-   Bump @azure/msal-common to v7.4.1

## 2.28.2

Fri, 02 Sep 2022 18:06:53 GMT

### Patches

-   Bump @azure/msal-common to v7.4.0

## 2.28.1

Mon, 01 Aug 2022 22:22:35 GMT

### Patches

-   Rename native request property scopes to scope #5043 (thomas.norling@microsoft.com)
-   adding network performance measurement #4834 (ellymakuba@microsoft.com)
-   Send login_hint claim instead of sid if available #4990 (janutter@microsoft.com)
-   Bump @azure/msal-common to v7.3.0

## 2.28.0

Mon, 18 Jul 2022 23:26:21 GMT

### Minor changes

-   Added new token size field in the perf telemetry data #4973 (bmahal@microsoft.com)
-   Add local cache support for JS-WAM bridge #4971 (sameera.gajjarapu@microsoft.com)
-   Bump @azure/msal-common to v7.2.0

### Patches

-   Fix bug with activeAccount when two accounts have same local account id #5004 (t-ssummers@microsoft.com)

## 2.27.0

Tue, 05 Jul 2022 22:37:04 GMT

### Minor changes

-   feat: adding authority metadata resiliency #4536 (samuelkamau@microsoft.com)
-   Bump @azure/msal-common to v7.1.0

### Patches

-   Fix prompt behavior for native broker requests #4949 (thomas.norling@microsoft.com)
-   Non-fatal native broker errors should clear interaction in progress flag #4950 (thomas.norling@microsoft.com)
-   Mark temporary cache cookies as SameSite lax #4957 (janutter@microsoft.com)
-   Handle ACCOUNT_UNAVAILABLE error status from native broker #4951 (thomas.norling@microsoft.com)

## 2.26.0

Mon, 13 Jun 2022 22:28:09 GMT

### Minor changes

-   Add errorCode and subErrorCode to client telemetry events (#4863) (sameera.gajjarapu@microsoft.com)
-   Bump @azure/msal-common to v7.0.0

### Patches

-   Add strict assertion checks for OBO clients (#4691) (bmahal@microsoft.com)
-   Update redirect_in_iframe message to include messaging for embedded applications #4895 (janutter@microsoft.com)
-   preflightBrowserEnvironmentCheck should not always set interaction in progress #4893 (janutter@microsoft.com)
-   Return correct fromCache value when tokens are acquired from native broker #4880 (thomas.norling@microsoft.com)

## 2.25.0

Mon, 06 Jun 2022 22:13:00 GMT

### Minor changes

-   Fix empty hash errors in popups #4793 (thomas.norling@microsoft.com)
-   Add PoP support for Encrypted Access Tokens #4730 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v6.4.0

### Patches

-   Add keyId to SHR header and make x5c_ca claim type string array #4729 (hemoral@microsoft.com)
-   Fixes assignment of expiresOn inside loadExternalTokens to fix issue where all access tokens appear expired during E2E #4711 (paulrsauer@gmail.com)
-   SHR params renamed as per MSAL JS's naming convention #4794 (sameera.gajjarapu@microsoft.com)
-   Fallback to web flow when native broker throws 'DISABLED' status #4837 (thomas.norling@microsoft.com)
-   Change log message level in initialize from warning to info #4820 (thomas.norling@microsoft.com)

## 2.24.0

Mon, 02 May 2022 22:23:33 GMT

### Minor changes

-   Move internals needed for msal-browser-1p to separate export #4742 (janutter@microsoft.com)
-   Add support for acquiring tokens from the native broker #4531 (thomas.norling@microsoft.com)
-   Bump @azure/msal-common to v6.3.0

### Patches

-   Fix for WAM window parenting #4755 (thomas.norling@microsoft.com)
-   Ensure interaction status is properly set during logout with onRedirectNavigate #4719 (janutter@microsoft.com)

## 2.23.0

Mon, 04 Apr 2022 21:12:42 GMT

### Minor changes

-   Add performance telemetry API #4570 (janutter@microsoft.com)
-   Add Client Application telemetry parameters to MSAL #4616 (prithviraj.kanherkar@microsoft.com)
-   Bump @azure/msal-common to v6.2.0

### Patches

-   Fix persistent key store deletion on logout #4617 (hemoral@microsoft.com)

## 2.22.1

Mon, 07 Mar 2022 23:28:43 GMT

### Patches

-   Clear temporary cache when back button is clicked during redirect flow #4513 (thomas.norling@microsoft.com)
-   Don't reassign request object properties #4563 (thomas.norling@microsoft.com)

## 2.22.0

Tue, 08 Feb 2022 00:41:06 GMT

### Minor changes

-   Add support for logout_hint #4450 (hemoral@microsoft.com)
-   Add AzureCloudInstance to JS libraries (sameera.gajjarapu@microsoft.com)
-   Bump @azure/msal-common to v6.1.0

### Patches

-   Expose OIDC_DEFAULT_SCOPES constant #4280 (thomas.norling@microsoft.com)
-   Improve reliability of interaction_in_progress #4460 (thomas.norling@microsoft.com)
-   Clear hash only if it contains known response properties #4415 (thomas.norling@microsoft.com)
-   Adding exports and other changes for extensibility #4459 (prkanher@microsoft.com)

## 2.21.0

Tue, 04 Jan 2022 00:20:29 GMT

### Minor changes

-   Add support for requested claims in silent token acquisition #4296 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v6.0.0

### Patches

-   Clear interaction status even if there is no ongoing request #4314 (janutter@microsoft.com)

## 2.20.0

Tue, 07 Dec 2021 00:17:01 GMT

### Minor changes

-   Add acquireTokenByCode API for hybrid spa flow #3978 (janutter@microsoft.com)
-   Bump @azure/msal-common to v5.2.0

### Patches

-   Fix circular dependencies in AuthenticationHeaderParser and AsyncMemoryStorage #4235 (hemoral@microsoft.com)

## 2.19.0

Mon, 01 Nov 2021 23:53:21 GMT

### Minor changes

-   Add support for in-memory storage of token binding keys #4183 (hemoral@microsoft.com)
-   Add support for ephemeral SSH certificate acquisition #4178 (hemoral@microsoft.com)
-   Add support for in-memory storage of token binding keys #4183 (hemoral@microsoft.com)
-   Add support for SHR nonce #3999 (hemoral@microsoft.com)
-   Bump @azure/msal-common to v5.1.0

### Patches

-   Add support for different key types in IndexedDB storage #4052 (hemoral@microsoft.com)
-   Ensure correlation is passed to all interaction clients in acquireTokenSilent #4186 (janutter@microsoft.com)
-   Fix typo in noTokenRequestCacheError (#4136) (Michael.Currie@rjwgroup.com)
-   Fix redirect processing when allowRedirectInIframe: true #4142 (thomas.norling@microsoft.com)

## 2.18.0

Mon, 04 Oct 2021 23:12:35 GMT

### Minor changes

-   Emit event when user logs in or out from a different tab or window #3981 (thomas.norling@microsoft.com)
-   Remove requirement of user hint on ssoSilent API #4123 (prkanher@microsoft.com)
-   Bump @azure/msal-common to v5.0.1

### Patches

-   Consistently export error types and messages for errors thrown by MSAL #4117 (jagore@microsoft.com)
-   Move helper functions up to BaseInteractionClient #4049 (thomas.norling@microsoft.com)
-   Export library version #4124 (thomas.norling@microsoft.com)

## 2.17.0

Tue, 07 Sep 2021 23:22:24 GMT

### Minor changes

-   Add configuration for popup window size and placement #3946 (joarroyo@microsoft.com)
-   Add API to sideload tokens to msal-browser #3895 (joarroyo@microsoft.com)
-   Add SignedHttpRequest class #3058 (janutter@microsoft.com)
-   Refactor acquireToken logic into InteractionClients #3871 (thomas.norling@microsoft.com)

### Patches

-   Clear cache before constructing logout url #3982 (thomas.norling@microsoft.com)
-   Add pop params to request thumbprint #3973 (hemoral@microsoft.com)
-   Update ADAL to MSAL SSO logic to use preferred_username instead of upn by default #3945 (ellymakuba@microsoft.com)
-   Populate msal v2 loginHint from cached msal v1 id token #4027 (janutter@microsoft.com)
-   Throw interaction in progress if any msal instance has interaction in progress #4014 (thomas.norling@microsoft.com)
-   Only emit handleRedirect start event on first invocation of handleRedirectPromise #4013 (thomas.norling@microsoft.com)
-   Add correlationId to AuthenticationResult type #3947 (thomas.norling@microsoft.com)
-   Remove token binding key from key store when refreshing pop token #3500 (hemoral@microsoft.com)
-   Fix clearing active account on logout #3948 (hemoral@microsoft.com)
-   Add correlationId to errors thrown #3930 (thomas.norling@microsoft.com)

## 2.16.0

Thu, 22 Jul 2021 22:50:22 GMT

### Minor changes

-   Msal-Browser supports parallel silent requests #3837 (joarroyo@microsoft.com)
-   Persist active account #3755 (thomas.norling@microsoft.com)

### Patches

-   Add fix for loginRedirect failure when angular index.html base href is different from the origin (#3875) (rishanthakumar@gmail.com)
-   fix: fixing the npm audit issues (samuelkamau@microsoft.com)
-   Expose isInPopup helper function #3825 (thomas.norling@microsoft.com)

## 2.15.0

Mon, 28 Jun 2021 23:39:48 GMT

### Minor changes

-   Add correlationId to log messages #3601 (joarroyo@microsoft.com)
-   Add CCS parameters to headers or form_data #3636 (prkanher@microsoft.com)

### Patches

-   Update monitor_window_timeout error message with link to error docs #3783 (thomas.norling@microsoft.com)
-   Refactor event APIs into EventHandler class #3770 (thomas.norling@microsoft.com)
-   Fix logoutPopup parameter type on IPublicClientApplication #3663 (thomas.norling@microsoft.com)

## 2.14.2

Wed, 12 May 2021 18:35:03 GMT

### Patches

-   Adjust log messages #3589 (joarroyo@microsoft.com)
-   Fix hash removal from URL and browser history after interactive request #3609 (hemoral@microsoft.com)
-   Update account equality check #3527 (thomas.norling@microsoft.com)
-   Close popup if error is thrown before popup window navigation occurs #3572 (thomas.norling@microsoft.com)
-   change msal-browser/msal-common to preserveModules to enable tree-shaking #3300 (oo.thomas96@gmail.com)

## 2.14.1

Thu, 22 Apr 2021 23:26:08 GMT

### Patches

-   Add .browserslistrc #3471 (thomas.norling@microsoft.com)
-   Look for temp cache items in local storage as fallback #3509 (janutter@microsoft.com)

## 2.14.0

Wed, 14 Apr 2021 18:39:53 GMT

### Minor changes

-   Add support for AccessToken_With_AuthScheme credential type #3426 (hectormgdev@gmail.com)

### Patches

-   Make SHR parameters optional (#3320) (hemoral@microsoft.com)

## 2.13.1

Wed, 31 Mar 2021 22:25:57 GMT

### Patches

-   Export PopupEvent #3360 (joarroyo@microsoft.com)

## 2.13.0

Wed, 24 Mar 2021 22:55:46 GMT

### Minor changes

-   Add logoutPopup API #3044 (thomas.norling@microsoft.com)

### Patches

-   Fix errors thrown on cache lookups when reading non-msal cache values #3245 (thomas.norling@microsoft.com)
-   Update blockReloadInIframe error message with link to error doc #3294 (thomas.norling@microsoft.com)
-   Block nested popups #3249 (thomas.norling@microsoft.com)

## 2.12.1

Mon, 15 Mar 2021 23:45:17 GMT

### Patches

-   Clear temporary cache cookies on page load #3129 (prkanher@microsoft.com)
-   Throw BrowserAuthError when fetch fails #3146 (thomas.norling@microsoft.com)

## 2.12.0

Wed, 03 Mar 2021 21:47:05 GMT

### Minor changes

-   Add option to make MSAL browser cookies secure (#3001) (hemoral@microsoft.com)
-   Add setNavigationClient API and expose INavigationClient interface (#2985) (thomas.norling@microsoft.com)

### Patches

-   Separate telemetry for ssoSilent and ATS iframe renewal (#3064) (thomas.norling@microsoft.com)
-   Add instrumentation to msal-browser (#3004) (joarroyo@microsoft.com)
-   Memoize multiple calls to handleRedirectPromise (#3072) (thomas.norling@microsoft.com)

## 2.11.2

Thu, 18 Feb 2021 00:34:32 GMT

### Patches

-   Ensure scrollbars are enabled for popups in browser (janutter@microsoft.com)

## 2.11.1

Tue, 09 Feb 2021 01:48:22 GMT

### Patches

-   Fix version.json import errors (#2993) (thomas.norling@microsoft.com)
-   Add missing network types to browser exports (#2995) (prkanher@microsoft.com)
-   Ignore OIDC scopes during cache lookup or replacement (#2969) (prkanher@microsoft.com)
-   Allow apps to not use the current page as default postLogoutRedirectUri in MSAL Browser (#2789) (janutter@microsoft.com)
-   Fix PCA stub errors (#2963) (thomas.norling@microsoft.com)

## 2.11.0

Tue, 02 Feb 2021 01:56:47 GMT

### Minor changes

-   Add initializeWrapperLibrary API (#2845) (thomas.norling@microsoft.com)
-   Add getInteractionStatusFromEvent to msal-browser (#2885) (joarroyo@microsoft.com)

### Patches

-   Fix temp cache cleanup when using localStorage (#2935) (thomas.norling@microsoft.com)
-   Get package version from version.json (#2915) (thomas.norling@microsoft.com)

## 2.10.0

Thu, 21 Jan 2021 21:48:01 GMT

### Minor changes

-   Authority metadata caching (#2758) (thomas.norling@microsoft.com)

### Patches

-   Fix handling of multiple popup windows (#2842) (janutter@microsoft.com)
-   redirectStartPage supports relative URIs (#2866) (thomas.norling@microsoft.com)

## 2.9.0

Tue, 12 Jan 2021 00:51:26 GMT

### Minor changes

-   Adding an active account API to PublicClientApplication (#2728) (prkanher@microsoft.com)
-   Add internal in-memory storage to BrowserCacheManager (#2765) (thomas.norling@microsoft.com)
-   Enable strict TypeScript option (#2792) (thomas.norling@microsoft.com)

## 2.8.0

Mon, 07 Dec 2020 22:19:03 GMT

### Minor changes

-   Enable the instance_aware flow (#1804) (prkanher@microsoft.com)

### Patches

-   Fix clearing of temporary cache items (#2696) (thomas.norling@microsoft.com)
-   Add exports to index.ts (#2680) (joarroyo@microsoft.com)
-   Expose idTokenClaims on AccountInfo (#2554) (janutter@microsoft.com)
-   Add onRedirectNavigate to redirect operations in browser (#2669) (janutter@microsoft.com)
-   Update Internal PCA Configuration (#2602) (thomas.norling@microsoft.com)
-   Add allowRedirectInIframe flag to browser (#2593) (janutter@microsoft.com)
-   Log messages contain package name and version (#2589) (thomas.norling@microsoft.com)
-   Update request types (#2512) (thomas.norling@microsoft.com)

## 2.7.0

Wed, 11 Nov 2020 23:33:20 GMT

### Minor changes

-   Support relative paths on redirectUri parameter (#2560) (thomas.norling@microsoft.com)

### Patches

-   Adds getAccountByLocalId to PCA Interface (#2588) (thomas.norling@microsoft.com)
-   Add navigateFrameWait and change loadFrameTimeout to browser to match core behavior (#2545) (janutter@microsoft.com)

## 2.6.1

Tue, 10 Nov 2020 01:48:44 GMT

### Patches

-   Export stubbed PCA instance (#2540) (thomas.norling@microsoft.com)

## 2.6.0

Sat, 07 Nov 2020 01:50:14 GMT

### Minor changes

-   Fixing a bug and adding `localAccountId` in AccountInfo interface (#2516) (sameera.gajjarapu@microsoft.com)

## 2.5.2

Mon, 02 Nov 2020 23:33:39 GMT

### Patches

-   Fix JSON.parse issue and cache value validation (#2527) (prkanher@microsoft.com)

## 2.5.1

Fri, 30 Oct 2020 00:52:19 GMT

### Patches

-   Restore string to cacheLocation type (#2523) (janutter@microsoft.com)

## 2.5.0

Thu, 29 Oct 2020 20:36:48 GMT

### Minor changes

-   Add getLogger and setLogger to msal-browser (#2513) (joarroyo@microsoft.com)
-   Adding memory storage option for cache location (#2481) (prkanher@microsoft.com)

### Patches

-   Add handleRedirect End Event (#2518) (thomas.norling@microsoft.com)
-   Ensure history.replaceState is a function (janutter@microsoft.com)
-   Allow hash to be passed into handleRedirectPromise, reset non-msal after processing (janutter@microsoft.com)

## 2.4.1

Mon, 26 Oct 2020 21:00:29 GMT

### Patches

-   msal-browser and msal-node cache Interfaces to msal-common updated (#2415) (sameera.gajjarapu@microsoft.com)

## 2.4.0

Tue, 20 Oct 2020 23:47:28 GMT

### Minor changes

-   Add removeEventCallback API (#2462) (thomas.norling@microsoft.com)
-   Add event api to msal-browser (#2394) (joarroyo@microsoft.com)

### Patches

-   Use history API to clear hash for msal-browser (janutter@microsoft.com)
-   Export InteractionType (#2438) (thomas.norling@microsoft.com)
-   Add extraQueryParameters to acquireTokenSilent in msal-browser (janutter@microsoft.com)
-   Fix unexpected interaction_required error in redirect flow (#2404) (thomas.norling@microsoft.com)
-   Adds support for any OIDC-compliant authority (#2389). (jamckenn@microsoft.com)

## 2.3.1

Wed, 14 Oct 2020 23:45:07 GMT

### Patches

-   Remove rogue console.log() in the BrowserCrypto.ts file and add a lint rule to prevent future issues (#2410) (prkanher@microsoft.com)
-   Check for Headers class when configuring network client (janutter@microsoft.com)
-   Update getItem to return ServerTelemetryEntity (#2223) (thomas.norling@microsoft.com)

## 2.3.0

Fri, 02 Oct 2020 17:42:35 GMT

### Minor changes

-   Implementation of Access Token Proof-of-Possession Flow (#2151, #2153, #2154, #2209, #2289) (prkanher@microsoft.com)

## 2.2.1

Wed, 30 Sep 2020 17:58:33 GMT

### Patches

-   Support SSR in msal-browser (#2073) (thomas.norling@microsoft.com)

## 2.2.0

Thu, 17 Sep 2020 23:16:22 GMT

### Minor changes

-   Added client-side throttling to enhance server stability (#1907) (jamckenn@microsoft.com)

### Patches

-   Fix issue with base64 encoding of spaces (#2248) (prkanher@microsoft.com)
-   Properly support multiple concurrent RT requests (#2290) (janutter@microsoft.com)
-   Default scope addition done in msal-common (#2267) (thomas.norling@microsoft.com)
-   acquireTokenSilent calls ssoSilent (#2264) (thomas.norling@microsoft.com)
-   Check for interaction in progress when processing redirect hash (#2183) (thomas.norling@microsoft.com)
-   Creating ClientApplication.ts subclass (#2199) (prkanher@microsoft.com)
-   Add SsoSilentRequest for ssoSilent, update tests and samples (joarroyo@microsoft.com)
-   Add Angular 10 browser sample, update documentation (joarroyo@microsoft.com)

## 2.1.0

Tue, 25 Aug 2020 00:40:45 GMT

### Minor changes

-   Client Capabilities Support (#2169) (thomas.norling@microsoft.com)

### Patches

-   update APP_META_DATA to APP_METADATA (sameera.gajjarapu@microsoft.com)
-   Add getAccountByHomeId API (#2114) (thomas.norling@microsoft.com)
-   Change msal-browser loginPopup and openPopup, add ability to configure popup delay (#2132) (joarroyo@microsoft.com)
-   Update POST header to type Record (#2128) (thomas.norling@microsoft.com)

## 2.0.2

Thu, 13 Aug 2020 02:20:48 GMT

### Patches

-   Fix hash parsing issue from #2118 and back button cache clearing (#2129) (prkanher@microsoft.com)

# 2.0.1

## Breaking Changes

-   None

## Features and Fixes

-   Make request object optional for login APIs in PublicClientApplication (#2061)
-   Fix `getAccountByUsername()` API signatures to return null (#2059)
-   (#2078) Fix issues with `handleRedirectPromise()` where:
    -   state mismatches occur if `handleRedirectPromise()` is called multiple times.
    -   `currentUrl` and `loginRequestUrl` being evaluated as not equal if one has a trailing slash and the other does not
    -   When `loginRequestUrl` is not in the cache, msal redirects to the homepage but would not process the hash
-   Add `sid` from `AuthorizationUrlRequest` to SSO check in `ssoSilent()` (#2030)
-   Add interaction type to platform state and check before processing hash (#2045)
-   Implements telemetry error calculation and caching for server telemetry information in browser scenarios (#1918)
-   Fix promise handling in PublicClientApplication (#2091)

# 2.0.0

## Breaking Changes

-   None

## Features and Fixes

-   Fix an issue where logout was not clearing all accounts (#1919)
-   Typescript sample for browser (#1920)
-   Add SilentRequest.ts object (#1964)
-   Fix an issue where popup window position value did not have a floor (#1981)
-   Fix an issue where getAccountByUsername was case-sensitive for the given username (#1982)
-   Fix an issue where `openid` and `profile` were being added to silent requests (#1962)
-   Fix an issue where the hash was not handled if `navigateToLoginRequestUrl`=`false` (#1973)
-   Fix an error that occurs when the request object is not provided to login and the redirectStartPage is expected (#1998)

# 2.0.0-beta.4

## Breaking Changes

-   Updated all APIs to send `openid` and `profile` by default in all requests (#1868)

## Features and Fixes

-   add interface for PublicClientApplication (#1870)
-   Update `monitorIframeForHash` to be purely time-based (#1873)
-   Instantiate Logger instance for PublicClientApplication (#1882)
-   Fix an issue with encoding in cookies and state values (#1852)
-   Fix issue where cache isn't being cleaned correctly (#1856)
-   Fix issue where expiration isn't calculated correctly (#1860)
-   Fix an issue where the crypto APIs were not truly random (#1872)
-   Remove all non-application specific initialization from PublicClientApplication constructor (#1885, #1886)
-   Added support for IE11 (#1883, #1884)
-   Added support for redirection to pages with custom hashes or query params (#1862)
-   Remove deprecated `handleRedirectCallback()` API (#1863)
-   Remove function typings for `redirectUri` and `postLogoutRedirectUri` (#1861).
-   Add support for Instance Discovery, combine all authority classes into a single generic class (#1811)

# 2.0.0-beta.3

## Breaking Changes

-   `@azure/msal-browser` now follows a unified cache schema similar to other MSAL libraries (#1624, #1655, #1680, #1711, #1762, #1771)
-   Updated browser library to follow common format for request, response, and client configurations (#1682, #1711, #1762, #1770, #1771, #1793)
-   Account interface updated to AccountInfo.ts (#1789)

## Features and Fixes

-   add `setKnownAuthorities` to constructor call for B2C Authority scenarios (#1646)
-   Library state is now sent as a encoded JSON object (#1790)
-   Added a request object for logout APIs, made logout async (#1802)

# 2.0.0-beta.2

-   Fixed an issue where the system config values were being overwritten with `undefined` (#1631)

# 2.0.0-beta.1

## Features

-   Added a silent iframe flow in the @azure/msal-browser package (#1451)
    -   Includes an ssoSilent() API to acquire tokens silently with a user context (loginHint)

## Bugs

-   Fixed an issue where TokenResponse is not exported

## Enhancements

-   handleRedirectCallback flow was modified, will be deprecated in favor of handleRedirectPromise(), added log message (#1490, #1543)

# 2.0.0-beta.0

## Features

-   Removed client_secret from config and added docs for new registration experience (#1421)

## Enhancements

-   Test pipelines in place. (#1393)
-   Added docs and samples. (#1421, #1321)

## Bugs

-   Minor bug fixes from unit testing. (#1236)
-   navigateToLoginRequestUrl works correctly (#1320)

# 2.0.0-alpha.0

## Features

-   Added Rollup as build tool (#1108)
-   Added APIs and major type files (#1109)
-   Added tests and code coverage (#1127)
-   Added Authority and protocol classes (#1133)
-   Added browser storage implementation (#1140)
-   Added implementation of crypto for browser (#1141)
-   Added fetch client (#1144)
-   Creating of login url (#1149)
-   Added logger class (#1155)
-   Added redirect handling code (#1164)
-   Successful token exchange (#1181)
-   Response handling code (#1183)
-   Token caching (#1185)
-   Popup handling (#1190)
-   Silent renewal using refresh tokens and logout (#1208)
-   SSO fixes for login_hint (#1211)

# 0.0.1

-   Created library with initial files for repo structure, build and package dependencies
