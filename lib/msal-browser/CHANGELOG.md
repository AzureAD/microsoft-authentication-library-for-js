# Change Log - @azure/msal-browser

This log was last generated on Tue, 08 Feb 2022 00:41:06 GMT and should not be manually modified.

<!-- Start content -->

## 2.22.0

Tue, 08 Feb 2022 00:41:06 GMT

### Minor changes

- Add support for logout_hint #4450 (hemoral@microsoft.com)
- Add AzureCloudInstance to JS libraries (sameera.gajjarapu@microsoft.com)
- Bump @azure/msal-common to v6.1.0

### Patches

- Expose OIDC_DEFAULT_SCOPES constant #4280 (thomas.norling@microsoft.com)
- Improve reliability of interaction_in_progress #4460 (thomas.norling@microsoft.com)
- Clear hash only if it contains known response properties #4415 (thomas.norling@microsoft.com)
- Adding exports and other changes for extensibility #4459 (prkanher@microsoft.com)

## 2.21.0

Tue, 04 Jan 2022 00:20:29 GMT

### Minor changes

- Add support for requested claims in silent token acquisition #4296 (hemoral@microsoft.com)
- Bump @azure/msal-common to v6.0.0

### Patches

- Clear interaction status even if there is no ongoing request #4314 (janutter@microsoft.com)

## 2.20.0

Tue, 07 Dec 2021 00:17:01 GMT

### Minor changes

- Add acquireTokenByCode API for hybrid spa flow #3978 (janutter@microsoft.com)
- Bump @azure/msal-common to v5.2.0

### Patches

- Fix circular dependencies in AuthenticationHeaderParser and AsyncMemoryStorage #4235 (hemoral@microsoft.com)

## 2.19.0

Mon, 01 Nov 2021 23:53:21 GMT

### Minor changes

- Add support for in-memory storage of token binding keys #4183 (hemoral@microsoft.com)
- Add support for ephemeral SSH certificate acquisition #4178 (hemoral@microsoft.com)
- Add support for in-memory storage of token binding keys #4183 (hemoral@microsoft.com)
- Add support for SHR nonce #3999 (hemoral@microsoft.com)
- Bump @azure/msal-common to v5.1.0

### Patches

- Add support for different key types in IndexedDB storage #4052 (hemoral@microsoft.com)
- Ensure correlation is passed to all interaction clients in acquireTokenSilent #4186 (janutter@microsoft.com)
- Fix typo in noTokenRequestCacheError (#4136) (Michael.Currie@rjwgroup.com)
- Fix redirect processing when allowRedirectInIframe: true #4142 (thomas.norling@microsoft.com)

## 2.18.0

Mon, 04 Oct 2021 23:12:35 GMT

### Minor changes

- Emit event when user logs in or out from a different tab or window #3981 (thomas.norling@microsoft.com)
- Remove requirement of user hint on ssoSilent API #4123 (prkanher@microsoft.com)
- Bump @azure/msal-common to v5.0.1

### Patches

- Consistently export error types and messages for errors thrown by MSAL #4117 (jagore@microsoft.com)
- Move helper functions up to BaseInteractionClient #4049 (thomas.norling@microsoft.com)
- Export library version #4124 (thomas.norling@microsoft.com)

## 2.17.0

Tue, 07 Sep 2021 23:22:24 GMT

### Minor changes

- Add configuration for popup window size and placement #3946 (joarroyo@microsoft.com)
- Add API to sideload tokens to msal-browser #3895 (joarroyo@microsoft.com)
- Add SignedHttpRequest class #3058 (janutter@microsoft.com)
- Refactor acquireToken logic into InteractionClients #3871 (thomas.norling@microsoft.com)

### Patches

- Clear cache before constructing logout url #3982 (thomas.norling@microsoft.com)
- Add pop params to request thumbprint #3973 (hemoral@microsoft.com)
- Update ADAL to MSAL SSO logic to use preferred_username instead of upn by default #3945 (ellymakuba@microsoft.com)
- Populate msal v2 loginHint from cached msal v1 id token #4027 (janutter@microsoft.com)
- Throw interaction in progress if any msal instance has interaction in progress #4014 (thomas.norling@microsoft.com)
- Only emit handleRedirect start event on first invocation of handleRedirectPromise #4013 (thomas.norling@microsoft.com)
- Add correlationId to AuthenticationResult type #3947 (thomas.norling@microsoft.com)
- Remove token binding key from key store when refreshing pop token #3500 (hemoral@microsoft.com)
- Fix clearing active account on logout #3948 (hemoral@microsoft.com)
- Add correlationId to errors thrown #3930 (thomas.norling@microsoft.com)

## 2.16.0

Thu, 22 Jul 2021 22:50:22 GMT

### Minor changes

- Msal-Browser supports parallel silent requests #3837 (joarroyo@microsoft.com)
- Persist active account #3755 (thomas.norling@microsoft.com)

### Patches

- Add fix for loginRedirect failure when angular index.html base href is different from the origin (#3875) (rishanthakumar@gmail.com)
- fix: fixing the npm audit issues (samuelkamau@microsoft.com)
- Expose isInPopup helper function #3825 (thomas.norling@microsoft.com)

## 2.15.0

Mon, 28 Jun 2021 23:39:48 GMT

### Minor changes

- Add correlationId to log messages #3601 (joarroyo@microsoft.com)
- Add CCS parameters to headers or form_data #3636 (prkanher@microsoft.com)

### Patches

- Update monitor_window_timeout error message with link to error docs #3783 (thomas.norling@microsoft.com)
- Refactor event APIs into EventHandler class #3770 (thomas.norling@microsoft.com)
- Fix logoutPopup parameter type on IPublicClientApplication #3663 (thomas.norling@microsoft.com)

## 2.14.2

Wed, 12 May 2021 18:35:03 GMT

### Patches

- Adjust log messages #3589 (joarroyo@microsoft.com)
- Fix hash removal from URL and browser history after interactive request #3609 (hemoral@microsoft.com)
- Update account equality check #3527 (thomas.norling@microsoft.com)
- Close popup if error is thrown before popup window navigation occurs #3572 (thomas.norling@microsoft.com)
- change msal-browser/msal-common to preserveModules to enable tree-shaking #3300 (oo.thomas96@gmail.com)

## 2.14.1

Thu, 22 Apr 2021 23:26:08 GMT

### Patches

- Add .browserslistrc #3471 (thomas.norling@microsoft.com)
- Look for temp cache items in local storage as fallback #3509 (janutter@microsoft.com)

## 2.14.0

Wed, 14 Apr 2021 18:39:53 GMT

### Minor changes

- Add support for AccessToken_With_AuthScheme credential type #3426 (hectormgdev@gmail.com)

### Patches

- Make SHR parameters optional (#3320) (hemoral@microsoft.com)

## 2.13.1

Wed, 31 Mar 2021 22:25:57 GMT

### Patches

- Export PopupEvent #3360 (joarroyo@microsoft.com)

## 2.13.0

Wed, 24 Mar 2021 22:55:46 GMT

### Minor changes

- Add logoutPopup API #3044 (thomas.norling@microsoft.com)

### Patches

- Fix errors thrown on cache lookups when reading non-msal cache values #3245 (thomas.norling@microsoft.com)
- Update blockReloadInIframe error message with link to error doc #3294 (thomas.norling@microsoft.com)
- Block nested popups #3249 (thomas.norling@microsoft.com)

## 2.12.1

Mon, 15 Mar 2021 23:45:17 GMT

### Patches

- Clear temporary cache cookies on page load #3129 (prkanher@microsoft.com)
- Throw BrowserAuthError when fetch fails #3146 (thomas.norling@microsoft.com)

## 2.12.0

Wed, 03 Mar 2021 21:47:05 GMT

### Minor changes

- Add option to make MSAL browser cookies secure (#3001) (hemoral@microsoft.com)
- Add setNavigationClient API and expose INavigationClient interface (#2985) (thomas.norling@microsoft.com)

### Patches

- Separate telemetry for ssoSilent and ATS iframe renewal (#3064) (thomas.norling@microsoft.com)
- Add instrumentation to msal-browser (#3004) (joarroyo@microsoft.com)
- Memoize multiple calls to handleRedirectPromise (#3072) (thomas.norling@microsoft.com)

## 2.11.2

Thu, 18 Feb 2021 00:34:32 GMT

### Patches

- Ensure scrollbars are enabled for popups in browser (janutter@microsoft.com)

## 2.11.1

Tue, 09 Feb 2021 01:48:22 GMT

### Patches

- Fix version.json import errors (#2993) (thomas.norling@microsoft.com)
- Add missing network types to browser exports (#2995) (prkanher@microsoft.com)
- Ignore OIDC scopes during cache lookup or replacement (#2969) (prkanher@microsoft.com)
- Allow apps to not use the current page as default postLogoutRedirectUri in MSAL Browser (#2789) (janutter@microsoft.com)
- Fix PCA stub errors (#2963) (thomas.norling@microsoft.com)

## 2.11.0

Tue, 02 Feb 2021 01:56:47 GMT

### Minor changes

- Add initializeWrapperLibrary API (#2845) (thomas.norling@microsoft.com)
- Add getInteractionStatusFromEvent to msal-browser (#2885) (joarroyo@microsoft.com)

### Patches

- Fix temp cache cleanup when using localStorage (#2935) (thomas.norling@microsoft.com)
- Get package version from version.json (#2915) (thomas.norling@microsoft.com)

## 2.10.0

Thu, 21 Jan 2021 21:48:01 GMT

### Minor changes

- Authority metadata caching (#2758) (thomas.norling@microsoft.com)

### Patches

- Fix handling of multiple popup windows (#2842) (janutter@microsoft.com)
- redirectStartPage supports relative URIs (#2866) (thomas.norling@microsoft.com)

## 2.9.0

Tue, 12 Jan 2021 00:51:26 GMT

### Minor changes

- Adding an active account API to PublicClientApplication (#2728) (prkanher@microsoft.com)
- Add internal in-memory storage to BrowserCacheManager (#2765) (thomas.norling@microsoft.com)
- Enable strict TypeScript option (#2792) (thomas.norling@microsoft.com)

## 2.8.0

Mon, 07 Dec 2020 22:19:03 GMT

### Minor changes

- Enable the instance_aware flow (#1804) (prkanher@microsoft.com)

### Patches

- Fix clearing of temporary cache items (#2696) (thomas.norling@microsoft.com)
- Add exports to index.ts (#2680) (joarroyo@microsoft.com)
- Expose idTokenClaims on AccountInfo (#2554) (janutter@microsoft.com)
- Add onRedirectNavigate to redirect operations in browser (#2669) (janutter@microsoft.com)
- Update Internal PCA Configuration (#2602) (thomas.norling@microsoft.com)
- Add allowRedirectInIframe flag to browser (#2593) (janutter@microsoft.com)
- Log messages contain package name and version (#2589) (thomas.norling@microsoft.com)
- Update request types (#2512) (thomas.norling@microsoft.com)

## 2.7.0

Wed, 11 Nov 2020 23:33:20 GMT

### Minor changes

- Support relative paths on redirectUri parameter (#2560) (thomas.norling@microsoft.com)

### Patches

- Adds getAccountByLocalId to PCA Interface (#2588) (thomas.norling@microsoft.com)
- Add navigateFrameWait and change loadFrameTimeout to browser to match core behavior (#2545) (janutter@microsoft.com)

## 2.6.1

Tue, 10 Nov 2020 01:48:44 GMT

### Patches

- Export stubbed PCA instance (#2540) (thomas.norling@microsoft.com)

## 2.6.0

Sat, 07 Nov 2020 01:50:14 GMT

### Minor changes

- Fixing a bug and adding `localAccountId` in AccountInfo interface (#2516) (sameera.gajjarapu@microsoft.com)

## 2.5.2

Mon, 02 Nov 2020 23:33:39 GMT

### Patches

- Fix JSON.parse issue and cache value validation (#2527) (prkanher@microsoft.com)

## 2.5.1

Fri, 30 Oct 2020 00:52:19 GMT

### Patches

- Restore string to cacheLocation type (#2523) (janutter@microsoft.com)

## 2.5.0

Thu, 29 Oct 2020 20:36:48 GMT

### Minor changes

- Add getLogger and setLogger to msal-browser (#2513) (joarroyo@microsoft.com)
- Adding memory storage option for cache location (#2481) (prkanher@microsoft.com)

### Patches

- Add handleRedirect End Event (#2518) (thomas.norling@microsoft.com)
- Ensure history.replaceState is a function (janutter@microsoft.com)
- Allow hash to be passed into handleRedirectPromise, reset non-msal after processing (janutter@microsoft.com)

## 2.4.1

Mon, 26 Oct 2020 21:00:29 GMT

### Patches

- msal-browser and msal-node cache Interfaces to msal-common updated (#2415) (sameera.gajjarapu@microsoft.com)

## 2.4.0

Tue, 20 Oct 2020 23:47:28 GMT

### Minor changes

- Add removeEventCallback API (#2462) (thomas.norling@microsoft.com)
- Add event api to msal-browser (#2394) (joarroyo@microsoft.com)

### Patches

- Use history API to clear hash for msal-browser (janutter@microsoft.com)
- Export InteractionType (#2438) (thomas.norling@microsoft.com)
- Add extraQueryParameters to acquireTokenSilent in msal-browser (janutter@microsoft.com)
- Fix unexpected interaction_required error in redirect flow (#2404) (thomas.norling@microsoft.com)
- Adds support for any OIDC-compliant authority (#2389). (jamckenn@microsoft.com)

## 2.3.1

Wed, 14 Oct 2020 23:45:07 GMT

### Patches

- Remove rogue console.log() in the BrowserCrypto.ts file and add a lint rule to prevent future issues (#2410) (prkanher@microsoft.com)
- Check for Headers class when configuring network client (janutter@microsoft.com)
- Update getItem to return ServerTelemetryEntity (#2223) (thomas.norling@microsoft.com)

## 2.3.0

Fri, 02 Oct 2020 17:42:35 GMT

### Minor changes

- Implementation of Access Token Proof-of-Possession Flow (#2151, #2153, #2154, #2209, #2289) (prkanher@microsoft.com)

## 2.2.1

Wed, 30 Sep 2020 17:58:33 GMT

### Patches

- Support SSR in msal-browser (#2073) (thomas.norling@microsoft.com)

## 2.2.0

Thu, 17 Sep 2020 23:16:22 GMT

### Minor changes

- Added client-side throttling to enhance server stability (#1907) (jamckenn@microsoft.com)

### Patches

- Fix issue with base64 encoding of spaces (#2248) (prkanher@microsoft.com)
- Properly support multiple concurrent RT requests (#2290) (janutter@microsoft.com)
- Default scope addition done in msal-common (#2267) (thomas.norling@microsoft.com)
- acquireTokenSilent calls ssoSilent (#2264) (thomas.norling@microsoft.com)
- Check for interaction in progress when processing redirect hash (#2183) (thomas.norling@microsoft.com)
- Creating ClientApplication.ts subclass (#2199) (prkanher@microsoft.com)
- Add SsoSilentRequest for ssoSilent, update tests and samples (joarroyo@microsoft.com)
- Add Angular 10 browser sample, update documentation (joarroyo@microsoft.com)

## 2.1.0

Tue, 25 Aug 2020 00:40:45 GMT

### Minor changes

- Client Capabilities Support (#2169) (thomas.norling@microsoft.com)

### Patches

- update APP_META_DATA to APP_METADATA (sameera.gajjarapu@microsoft.com)
- Add getAccountByHomeId API (#2114) (thomas.norling@microsoft.com)
- Change msal-browser loginPopup and openPopup, add ability to configure popup delay (#2132) (joarroyo@microsoft.com)
- Update POST header to type Record (#2128) (thomas.norling@microsoft.com)

## 2.0.2

Thu, 13 Aug 2020 02:20:48 GMT

### Patches

- Fix hash parsing issue from #2118 and back button cache clearing (#2129) (prkanher@microsoft.com)

# 2.0.1
## Breaking Changes
* None

## Features and Fixes
* Make request object optional for login APIs in PublicClientApplication (#2061)
* Fix `getAccountByUsername()` API signatures to return null (#2059)
* (#2078) Fix issues with `handleRedirectPromise()` where:
    * state mismatches occur if `handleRedirectPromise()` is called multiple times.
    * `currentUrl` and `loginRequestUrl` being evaluated as not equal if one has a trailing slash and the other does not
    * When `loginRequestUrl` is not in the cache, msal redirects to the homepage but would not process the hash
* Add `sid` from `AuthorizationUrlRequest` to SSO check in `ssoSilent()` (#2030)
* Add interaction type to platform state and check before processing hash (#2045)
* Implements telemetry error calculation and caching for server telemetry information in browser scenarios (#1918)
* Fix promise handling in PublicClientApplication (#2091)

# 2.0.0
## Breaking Changes
* None

## Features and Fixes
* Fix an issue where logout was not clearing all accounts (#1919)
* Typescript sample for browser (#1920)
* Add SilentRequest.ts object (#1964)
* Fix an issue where popup window position value did not have a floor (#1981)
* Fix an issue where getAccountByUsername was case-sensitive for the given username (#1982)
* Fix an issue where `openid` and `profile` were being added to silent requests (#1962)
* Fix an issue where the hash was not handled if `navigateToLoginRequestUrl`=`false` (#1973)
* Fix an error that occurs when the request object is not provided to login and the redirectStartPage is expected (#1998)

# 2.0.0-beta.4
## Breaking Changes
* Updated all APIs to send `openid` and `profile` by default in all requests (#1868)

## Features and Fixes
* add interface for PublicClientApplication (#1870)
* Update `monitorIframeForHash` to be purely time-based (#1873)
* Instantiate Logger instance for PublicClientApplication (#1882)
* Fix an issue with encoding in cookies and state values (#1852)
* Fix issue where cache isn't being cleaned correctly (#1856)
* Fix issue where expiration isn't calculated correctly (#1860)
* Fix an issue where the crypto APIs were not truly random (#1872)
* Remove all non-application specific initialization from PublicClientApplication constructor (#1885, #1886)
* Added support for IE11 (#1883, #1884)
* Added support for redirection to pages with custom hashes or query params (#1862)
* Remove deprecated `handleRedirectCallback()` API (#1863)
* Remove function typings for `redirectUri` and `postLogoutRedirectUri` (#1861).
* Add support for Instance Discovery, combine all authority classes into a single generic class (#1811)

# 2.0.0-beta.3
## Breaking Changes
* `@azure/msal-browser` now follows a unified cache schema similar to other MSAL libraries (#1624, #1655, #1680, #1711, #1762, #1771)
* Updated browser library to follow common format for request, response, and client configurations (#1682, #1711, #1762, #1770, #1771, #1793)
* Account interface updated to AccountInfo.ts (#1789)

## Features and Fixes
* add `setKnownAuthorities` to constructor call for B2C Authority scenarios (#1646)
* Library state is now sent as a encoded JSON object (#1790)
* Added a request object for logout APIs, made logout async (#1802)

# 2.0.0-beta.2
* Fixed an issue where the system config values were being overwritten with `undefined` (#1631)

# 2.0.0-beta.1
## Features
* Added a silent iframe flow in the @azure/msal-browser package (#1451)
    * Includes an ssoSilent() API to acquire tokens silently with a user context (loginHint)

## Bugs
* Fixed an issue where TokenResponse is not exported

## Enhancements
* handleRedirectCallback flow was modified, will be deprecated in favor of handleRedirectPromise(), added log message (#1490, #1543)

# 2.0.0-beta.0
## Features
* Removed client_secret from config and added docs for new registration experience (#1421)

## Enhancements
* Test pipelines in place. (#1393)
* Added docs and samples. (#1421, #1321)

## Bugs
* Minor bug fixes from unit testing. (#1236)
* navigateToLoginRequestUrl works correctly (#1320)

# 2.0.0-alpha.0
## Features
* Added Rollup as build tool (#1108)
* Added APIs and major type files (#1109)
* Added tests and code coverage (#1127)
* Added Authority and protocol classes (#1133)
* Added browser storage implementation (#1140)
* Added implementation of crypto for browser (#1141)
* Added fetch client (#1144)
* Creating of login url (#1149)
* Added logger class (#1155)
* Added redirect handling code (#1164)
* Successful token exchange (#1181)
* Response handling code (#1183)
* Token caching (#1185)
* Popup handling (#1190)
* Silent renewal using refresh tokens and logout (#1208)
* SSO fixes for login_hint (#1211)

# 0.0.1
- Created library with initial files for repo structure, build and package dependencies
