# 1.0.0-beta.3
- 

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
