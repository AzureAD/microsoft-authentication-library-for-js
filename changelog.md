# Change Log - @azure/msal-common

This log was last generated on Tue, 02 Feb 2021 01:56:47 GMT and should not be manually modified.

<!-- Start content -->

## 3.1.0

Tue, 02 Feb 2021 01:56:47 GMT

### Minor changes

- Add wrapper SKU and version to current telemetry header (#2845) (thomas.norling@microsoft.com)

### Patches

- Fix token timestamp calculation (prkanher@microsoft.com)
- Fix B2C policy switching (#2949) (thomas.norling@microsoft.com)
- Get package version from version.json (#2915) (thomas.norling@microsoft.com)

## 3.0.0

Thu, 21 Jan 2021 21:48:01 GMT

### Major changes

- Authority metadata caching (#2758) (thomas.norling@microsoft.com)

## 2.1.0

Tue, 12 Jan 2021 00:51:26 GMT

### Minor changes

- Add interface stubs (#2792) (thomas.norling@microsoft.com)

### Patches

- Adding account info equality check function (#2728) (prkanher@microsoft.com)
- Adding device code timeout to the device code request(#2656) (samuel.kamau@microsoft.com)

## 2.0.0

Mon, 07 Dec 2020 22:19:03 GMT

### Major changes

- Enable StrictNullChecks (#2602) (thomas.norling@microsoft.com)
- Rename request types and change required fields (#2512) (thomas.norling@microsoft.com)

### Minor changes

- Add clone to Logger (#2670) (joarroyo@microsoft.com)
- Enable the instance_aware flow (#1804) (prkanher@microsoft.com)
- Support id_token_hint on logout request (#2587) (thomas.norling@microsoft.com)

### Patches

- Fix login loop with empty query string (#2707) (thomas.norling@microsoft.com)
- Expose idTokenClaims on AccountInfo (#2554) (janutter@microsoft.com)
- Add matchPattern string util for wildcard matching for urls (#2678) (janutter@microsoft.com)
- fix: added missing async (AzureAD/microsoft-authentication-library-for-js#2652) (patrick@ruhkopf.me)
- Log messages contain package name and version (#2589) (thomas.norling@microsoft.com)

## 1.7.2

Wed, 11 Nov 2020 23:33:20 GMT

### Patches

- Add getAbsolutePath helper function to UrlString class (#2560) (thomas.norling@microsoft.com)

## 1.7.1

Tue, 10 Nov 2020 01:48:44 GMT

### Patches

- Enhance lookup for IdTokens/AppMetadata (#2530) (sameera.gajjarapu@microsoft.com)
- Add LocalAccountId for ADFS usecases (#2573) (sameera.gajjarapu@microsoft.com)

## 1.7.0

Sat, 07 Nov 2020 01:50:14 GMT

### Minor changes

- Implement Password Grant Flow (#2204) (sameera.gajjarapu@microsoft.com)
- Fixing a bug and adding `localAccountId` in AccountInfo interface (#2516) (sameera.gajjarapu@microsoft.com)

### Patches

- Mandate localAccount in AccountInfo (sameera.gajjarapu@microsoft.com)
- Filtered lookup of IdTokens, AppMetadata; Error handling in Node Storage (#2530) (sameera.gajjarapu@microsoft.com)

## 1.6.3

Mon, 26 Oct 2020 21:00:29 GMT

### Patches

- Fix ServerTelemetry maxErrorToSend bug (#2491) (thomas.norling@microsoft.com)
- Add missing default headers to device code (sameera.gajjarapu@microsoft.com)
- msal-browser and msal-node cache Interfaces to msal-common updated (#2415) (sameera.gajjarapu@microsoft.com)

## 1.6.2

Tue, 20 Oct 2020 23:47:28 GMT

### Patches

- Adds support for any OIDC-compliant authority (#2389). (jamckenn@microsoft.com)

## 1.6.1

Thu, 15 Oct 2020 00:49:18 GMT

### Patches

- Removing unused errors in msal-common and fixing possible build errors in @azure/msal-common@1.6.0 (#2432) (sameera.gajjarapu@microsoft.com)

## 1.6.0

Wed, 14 Oct 2020 23:45:07 GMT

### Minor changes

- Add support for persistence cache plugin (#2348) (sameera.gajjarapu@microsoft.com)

### Patches

- Add Telemetry header size limit (#2223) (thomas.norling@microsoft.com)

## 1.5.0

Fri, 02 Oct 2020 17:42:35 GMT

### Minor changes

- Implementation of Access Token Proof-of-Possession Flow (#2151, #2153, #2154, #2209, #2289) (prkanher@microsoft.com)

## 1.4.0

Wed, 23 Sep 2020 21:13:48 GMT

### Minor changes

- FOCI - Family of Client IDs feature (#2201) (sameera.gajjarapu@microsoft.com)

### Patches

- Remove null in function return types to be compatible with ICacheManager.ts (#2335) (sameera.gajjarapu@microsoft.com)
- Scopes stored case sensitive, compared case insensitive (#2302) (sameera.gajjarapu@microsoft.com)

## 1.3.0

Thu, 17 Sep 2020 23:16:22 GMT

### Minor changes

- Add support for On-behalf-of flow (#2157) (sagonzal@microsoft.com)
- ValidCacheType adds ServerTelemetryEntity (sameera.gajjarapu@microsoft.com)
- Added client-side throttling to enhance server stability (#1907) (jamckenn@microsoft.com)

### Patches

- Add name field to AccountInfo (#2288) (jamckenn@microsoft.com)
- Realm should fallback to an empty string for non AAD scenarios (sameera.gajjarapu@microsoft.com)
- Add default scopes in all requests and ignore in cache lookups (#2267) (thomas.norling@microsoft.com)
- Move refreshToken API to RefreshTokenClient (#2264) (thomas.norling@microsoft.com)
- Track Suberrors in Telemetry (#1921) (thomas.norling@microsoft.com)
- Separate cache lookup from token refresh (#2189) (thomas.norling@microsoft.com)

## 1.2.0

Tue, 25 Aug 2020 00:40:45 GMT

### Minor changes

- Client Capabilities Support (#2169) (thomas.norling@microsoft.com)
- Add support for acquiring tokens with client credentials grant (sagonzal@microsoft.com)

### Patches

- ignore offline_access in scopes lookup (sameera.gajjarapu@microsoft.com)
- Adds checks for cache entities (sameera.gajjarapu@microsoft.com)
- Add claims request to /token calls (#2138) (thomas.norling@microsoft.com)
- Fix Telemetry cacheHit Bug (#2170) (thomas.norling@microsoft.com)
- Get username from emails claim in B2C scenarios (#2114) (thomas.norling@microsoft.com)
- Update POST header to type Record (#2128) (thomas.norling@microsoft.com)

## 1.1.1

Thu, 13 Aug 2020 02:20:48 GMT

### Patches

- knownAuthorities enhancements (#2106) (thomas.l.norling@gmail.com)
- Update typing of IdTokenClaims (#2105) (hemoral@microsoft.com)
- Fix hash parsing issue from #2118 and back button cache clearing (#2129) (prkanher@microsoft.com)

# 1.1.0
## Breaking Changes
- None

## Features and Fixes
- Decode state from URI Encoding before comparing (#2049)
- getAllAccounts() returns empty array instead of `null` (#2059)
- Updated the `UrlString.canonicalizeUri()` API to be static (#2078)
- Add sid to `AuthorizationUrlRequest` and as part of request parameters sent to server (#2030)
- Enable server telemetry headers to be formatted and sent in every request (#1917)
- Enable platform level state information to be sent and read through the request state (#2045)
- Add the confidential client flow (#2023)

# 1.0.0
## Breaking Changes
- None

## Features and Fixes
- Fixed an issue where scopes were being made lower case before being sent to the service (#1961)
- Fix an issue where token values were replaced with undefined if not sent by server (#1946)
- Fix an issue where cache lookup for accounts was not working correctly (#1919)
- Removed TelemetryOptions from msal-common since they were unused (#1983)
- Add a response handler for the device code flow (#1947)

# 1.0.0-beta.4
## Breaking Changes
- None

## Features and Fixes
- Fix an issue where state may be encoded twice on the server-side (#1852)
- Fix an issue where extraScopesToConsent was not appending scopes correctly (#1854)
- Fix an issue where the expiration was not being calculated correctly (#1860)
- Add correlationId to all requests (#1868)

# 1.0.0-beta.3
## Breaking Changes
- `Request` update in msal-common (#1682, #1771)
- AccountInfo interface (#1789)
- Removal of SPA Client (#1793)
- Unified Cache support (#1444, #1471, #1519, #1520, #1522, #1609, #1622, #1624, #1655, #1680, #1762)

## Features and Fixes
- Initialization of B2cTrustedHostList (#1646)
- SilentFlow support (#1711)
- Utilize `Scopeset` across all libraries (#1770)
- `state` support in msal-common (#1790)
- EndSessionRequest (#1802)

# 1.0.0-beta.2
- Fixed an issue where types were not being exported from the correct location (#1613)
- Fixed an issue where system configuration values were being overwritten with `undefined` (#1631)
- Added support for sub-error codes from the eSTS service (#1533)

# 1.0.0-beta.1
- Fixed an issue where types are not exported correctly (#1517)
- Logger class is now exported (#1486)
- Added knownAuthorities to support B2C authorities (#1416)
- Refactored authority classes for B2C use cases (#1424)
- Synced all classes and objects to work for both @azure/msal-browser and @azure/msal-node (#1552)
- Merged configuration for node and browser classes (#1575)
- Fixed issue with caching for multiple resources (#1553)
- Adding support for node classes
    - Refresh token client (#1496)
    - Device code client (#1550, #1434)
    - Authorization Code Client (#1434)

# 1.0.0-beta.0
- Fully functioning project completed
- Build and test pipelines in place
- Added bug fixes from unit testing
- Added docs and samples

# 0.0.1
- Created library with initial files for repo structure, build and package dependencies
