# Change Log - @azure/msal-node

This log was last generated on Mon, 07 Nov 2022 22:46:55 GMT and should not be manually modified.

<!-- Start content -->

## 1.14.3

Mon, 07 Nov 2022 22:46:55 GMT

### Patches

- Bump @azure/msal-common to v8.0.0

## 1.14.2

Mon, 10 Oct 2022 22:27:03 GMT

### Patches

- Bump @azure/msal-common to v7.6.0

## 1.14.1

Mon, 03 Oct 2022 22:12:27 GMT

### Patches

- sanitize client credentials request against oidc scopes #4999 (v-derisen@microsoft.com)
- This PR modifies HttpClient to return apprpropriate underlying error that is handled upstream.  #5175 (bmahal@microsoft.com)
- Bump @azure/msal-common to v7.5.0

## 1.14.0

Mon, 12 Sep 2022 18:19:32 GMT

### Minor changes

- Add support for the state parameter #4723 (marionminayo@microsoft.com)
- Bump @azure/msal-common to v7.4.1

## 1.13.0

Fri, 02 Sep 2022 18:06:53 GMT

### Minor changes

- Add acquireTokenInteractive API #5062 (thomas.norling@microsoft.com)
- Bump @azure/msal-common to v7.4.0

## 1.12.1

Mon, 01 Aug 2022 22:22:36 GMT

### Patches

- Bump @azure/msal-common to v7.3.0

## 1.12.0

Mon, 18 Jul 2022 23:26:21 GMT

### Minor changes

- App Token Provider extensibiliy for AzureSDK (bogavril@microsoft.com)
- add forceCache property to rt token request (#4844) (v-derisen@microsoft.com)
- Bump @azure/msal-common to v7.2.0

## 1.11.0

Tue, 05 Jul 2022 22:37:04 GMT

### Minor changes

- feat: adding authority metadata resiliency #4536 (samuelkamau@microsoft.com)
- Bump @azure/msal-common to v7.1.0

## 1.10.0

Mon, 13 Jun 2022 22:28:09 GMT

### Minor changes

- Fix ClientAssertion configuration typing between common and node #4846 (hemoral@microsoft.com)
- Bump @azure/msal-common to v7.0.0

### Patches

- Add strict assertion checks for OBO clients (#4691) (bmahal@microsoft.com)

## 1.9.1

Mon, 06 Jun 2022 22:13:00 GMT

### Patches

- Use native http modules instead of axios for regular and proxied network requests #4744 (rginsburg@microsoft.com)
- Updated the regex and added a test for detecting public cert for SNI #4790 (email not defined)
- export AuthorizationCodePayload type from msal-common #4803 (git@hens.by)
- Bump @azure/msal-common to v6.4.0

## 1.9.0

Mon, 02 May 2022 22:23:33 GMT

### Minor changes

- Add Node 18 to msal-node supported versions #4727 (13023439+WikiRik@users.noreply.github.com)
- Bump @azure/msal-common to v6.3.0

## 1.8.0

Mon, 04 Apr 2022 21:12:42 GMT

### Minor changes

- Add Client Application telemetry parameters to MSAL #4616 (prithviraj.kanherkar@microsoft.com)
- Bump @azure/msal-common to v6.2.0

### Patches

- Use IGuidGenerator interface for GuidGenerator class #4570 (janutter@microsoft.com)

## 1.7.0

Mon, 07 Mar 2022 23:28:43 GMT

### Minor changes

- Added nonce support to MSAL Node #4504 (marionminayo@microsoft.com)

### Patches

- Fix support for claims-based token caching #4533 (hemoral@microsoft.com)
- Persist authority in in memory cache #4081 (sameera.gajjarapu@microsoft.com)

## 1.6.0

Tue, 08 Feb 2022 00:41:06 GMT

### Minor changes

- feat: add the redis distributed cache layer (kamausamuel11@gmail.com)
- Add AzureCloudInstance to JS libraries (sameera.gajjarapu@microsoft.com)
- Support proxy in msal-node(#4447) (sameera.gajjarapu@microsoft.com)
- Bump @azure/msal-common to v6.1.0

## 1.5.0

Tue, 04 Jan 2022 00:20:29 GMT

### Minor changes

- Bump @azure/msal-common to v6.0.0

## 1.4.0

Tue, 07 Dec 2021 00:17:01 GMT

### Minor changes

- Add support for hybrid spa flow #3478 (janutter@microsoft.com)
- Bump @azure/msal-common to v5.2.0

## 1.3.3

Mon, 01 Nov 2021 23:53:22 GMT

### Patches

- Bump @azure/msal-common to v5.1.0

## 1.3.2

Mon, 04 Oct 2021 23:12:35 GMT

### Patches

- Export library version #4124 (thomas.norling@microsoft.com)
- feat: improve the test code coverage for msal-node (samuelkamau@microsoft.com)
- Consistently export error types and messages for errors thrown by MSAL #4117 (jagore@microsoft.com)
- Axios upgrade to 0.21.4 to address a high severity vulnerability (sameera.gajjarapu@microsoft.com)
- Bump @azure/msal-common to v5.0.1

## 1.3.1

Tue, 07 Sep 2021 23:22:24 GMT

### Patches

- Add removeTokenBindingKey missing method to Node's CryptoProvider #3500 (hemoral@microsoft.com)
- Add correlationId to errors #3930 (thomas.norling@microsoft.com)
- Remove non-null assertions #3994 (thomas.norling@microsoft.com)
- Add correlationId to AuthenticationResult type #3947 (thomas.norling@microsoft.com)
- Fixes biased code verifier generation #3993 (thomas.norling@microsoft.com)

## 1.3.0

Thu, 22 Jul 2021 22:50:22 GMT

### Minor changes

- feat: add regional authority telemetry, #3662 (samuelkamau@microsoft.com)
- ROPC added for Confidential Clients (#3838) (sameera.gajjarapu@microsoft.com)

## 1.2.0

Mon, 28 Jun 2021 23:39:48 GMT

### Minor changes

- Add correlationId to log messages #3601 (joarroyo@microsoft.com)

### Patches

- fix: have the log level propagate to msal-common (samuelkamau@microsoft.com)
- fix: update the client capabilities type in configuration #3678 (samuelkamau@microsoft.com)

## 1.1.0

Wed, 12 May 2021 18:35:03 GMT

### Minor changes

- Add Node 16 to msal-node supported versions (janutter@microsoft.com)
- add support for regional authorities (samuelkamau@microsoft.com)

## 1.0.3

Thu, 22 Apr 2021 23:26:08 GMT

### Patches

- Add .browserslistrc #3471 (thomas.norling@microsoft.com)

## 1.0.2

Wed, 14 Apr 2021 18:39:53 GMT

### Patches

- feat: fix the device code cancellation flag (samuelkamau@microsoft.com)
- Add support for AccessToken_With_AuthScheme credential type #3426 (hectormgdev@gmail.com)

## 1.0.0

Thu, 18 Feb 2021 00:34:32 GMT

### Patches

- update msal-node landing page & samples page (dogan.erisen@gmail.com)

### Changes

- ADD FAQs (#3038) (sameera.gajjarapu@microsoft.com)
- Update node version support in package.json(#2998) (sameera.gajjarapu@microsoft.com)

## 1.0.0-beta.6

Tue, 09 Feb 2021 01:48:22 GMT

### Changes

- Fix version.json import errors (#2993) (thomas.norling@microsoft.com)
- Ignore OIDC scopes during cache lookup or replacement (#2969) (prkanher@microsoft.com)
- Set the validateStatus locally than globally for `axios` (#2959) (sameera.gajjarapu@microsoft.com)
- Add API Extractor for msal-node (sameera.gajjarapu@microsoft.com)

## 1.0.0-beta.5

Tue, 02 Feb 2021 01:56:47 GMT

### Changes

- Get package version from version.json (#2915) (thomas.norling@microsoft.com)
- Add interfaces to public APIs in msal-node (#2623) (sameera.gajjarapu@microsoft.com)

## 1.0.0-beta.4

Thu, 21 Jan 2021 21:48:01 GMT

### Changes

- Authority metadata caching (#2758) (thomas.norling@microsoft.com)

## 1.0.0-beta.3

Tue, 12 Jan 2021 00:51:26 GMT

### Patches

- change the code challenge encoding to uniform base64 (samuel.kamau@microsoft.com)

### Changes

- ClientAssertion.parseCertificate - allow newlines in cert (#2721). (email not defined)
- feat: bump up the axios version on msal-node (samuel.kamau@microsoft.com)
- Add getKVStore to tokenCache (#2771) (thomas.norling@microsoft.com)

## 1.0.0-beta.2

Mon, 07 Dec 2020 22:19:03 GMT

### Changes

- Expose idTokenClaims on AccountInfo (#2554) (janutter@microsoft.com)
- Add null to API response signatures (#2602) (thomas.norling@microsoft.com)
- Enforce triple equals in eslint (janutter@microsoft.com)
- Log messages contain package name and version (#2589) (thomas.norling@microsoft.com)
- Update request types (#2512) (thomas.norling@microsoft.com)

## 1.0.0-beta.1

Wed, 11 Nov 2020 23:33:20 GMT

### Changes

- Add support for SubjectName/Issuer authentication (#2471). (jamckenn@microsoft.com)

## 1.0.0-alpha.16

Tue, 10 Nov 2020 01:48:44 GMT

### Changes

- Enhance lookup for IdTokens/AppMetadata (#2530) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.15

Sat, 07 Nov 2020 01:50:14 GMT

### Changes

- Fixing a bug and adding `localAccountId` in AccountInfo interface (#2516) (sameera.gajjarapu@microsoft.com)
- Filtered lookup of IdTokens, AppMetadata; Error handling in Node Storage (#2530) (sameera.gajjarapu@microsoft.com)
- Implement Password Grant Flow (#2204) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.14

Mon, 02 Nov 2020 23:33:39 GMT

### Changes

- Add getLogger and setLogger to msal-node (#2520) (joarroyo@microsoft.com)
- Remove `debug` from the `msal-node` library (#2496) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.13

Mon, 26 Oct 2020 21:00:29 GMT

### Changes

- msal-browser and msal-node cache Interfaces to msal-common updated (#2415) (sameera.gajjarapu@microsoft.com)
- Export Node Cache Serializer for use in end-to-end testing framework (#2414) (hemoral@microsoft.com)

## 1.0.0-alpha.12

Tue, 20 Oct 2020 23:47:28 GMT

### Changes

- Adds support for any OIDC-compliant authority (#2389). (jamckenn@microsoft.com)

## 1.0.0-alpha.11

Thu, 15 Oct 2020 00:49:18 GMT

### Changes

- Export all "Request" types in msal-node (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.10

Wed, 14 Oct 2020 23:45:07 GMT

### Changes

- Docs update for msal-node release (sameera.gajjarapu@microsoft.com)
- Export error types for msal-node (sameera.gajjarapu@microsoft.com)
- Add uuid as dependency in msal-node package.json so it is installed with the library (hectormgdev@gmail.com)
- Update TokenCache interface (#2348) (sameera.gajjarapu@microsoft.com)

## 1.0.0-alpha.9

Fri, 02 Oct 2020 17:42:35 GMT

### Changes

- Dummy implementation of access token proof-of-possession (prkanher@microsoft.com)

## 1.0.0-alpha.7

Wed, 23 Sep 2020 21:13:48 GMT

### Changes
- Make network interface public (#2335) (sameera.gajjarapu@microsoft.com)
- Rename TokenCache.cacheHasChanged to TokenCache.hasChanged (#2332) (sagonzal@microsoft.com)
- FOCI - Family of Client IDs feature (#2201) (sameera.gajjarapu@microsoft.com)
- Fix issue with token cache not removing old cache entities (#2304) (sagonzal@microsoft.com)

## 1.0.0-alpha.6

Thu, 17 Sep 2020 23:16:22 GMT

### Changes

- Address tsdx warnings (#2202) (thomas.norling@microsoft.com)
- Implement Telemetry in msal-node (#1921) (thomas.norling@microsoft.com)
- Changes node storage: getItem(), setItem() and removeItem() simplified and no longer need a 'type' (sameera.gajjarapu@microsoft.com)
- Add support for on-behalf-of flow (sagonzal@microsoft.com)

## 1.0.0-alpha.5

Tue, 25 Aug 2020 00:40:45 GMT

### Changes

- update APP_META_DATA to APP_METADATA (sameera.gajjarapu@microsoft.com)
- Client Capabilities Support (#2169) (thomas.norling@microsoft.com)
- Remove log statement (email not defined)
- undefined (sagonzal@microsoft.com)

# 1.0.0-alpha.4
- Add confidential client support (#2023)

# 1.0.0-alpha.3
- Fix an issue where the types were not defined correctly in the package.json (#2014)

# 1.0.0-alpha.2
- Fix an issue where the `dist` folder was not published (#2013)

# 1.0.0-alpha.1

- Add `response` to device code in `msal-node` (#1947)
- `msal-node` docs update (#1948)
- Export `AccountInfo` in `msal-node (#2005)

# 1.0.0-alpha.0

- scaffolding (#1328)
- Configuration and Client (#1325)
- Account and Authority (#1330)
- initial compatibility with other libs (#1342)
- `msal-node` crypto module (#1368)
- `msal-node` network module (#1371)
- `msal-node` lerna support (#1383)
- `msal-common` and `msal-node` Client applications, authorization code and device code flow (#1409)
- `msal-node` add DEBUG logging (#1423)
- `msal-common` authority changes (#1424)
- `msal-node` and `msal-common` unit tests for changes in #1409 (#1449)
- `msal-node` switch `strictNullChecks:true` for msal-node (#1478)
- `msal-node` and `msal-common` Update generation of client info headers (#1482)
- `msal-node` and `msal-common` Support for acquiring a token with refresh token (#1496)
- `msal-node` and `msal-common` Move authority generation from common to node (#1537)
- `msal-node` fix casing issue (#1630)
- `msal-node` Cache implementation (#1444, #1471, #1519, #1520, #1522, #1622, #1655, #1680)
- `msal-node` Silent Flow support (#1711)
- merge cache logic for all platforms (#1762)
- Utilize ScopeSet across the library (#1770)
- Update UnifiedCacheManager.ts (#1771)
- Node cache interface (#1801)
- SilentFlow node interface (#1809)
- Update TokenCache name (#1901)
