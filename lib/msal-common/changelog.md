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
