# 2.0.0-beta.3
* 

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
