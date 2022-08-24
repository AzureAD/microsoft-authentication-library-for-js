<a name="4.0.0"></a>

# 4.3.4
- Update `passport` to 0.6.0: #5034

# 4.3.3.
- Replace `request` with native `https` module to resolve security vulnerability: #4805

# 4.3.2
- Update `async` to resolve dependency alert: #4724
- Update `cache-manager` to resolve dependency alert: #4781

# 4.3.1

## Bugs
- Replace `jwk-to-pem` with `node-jose` to remove dependency on `elliptic`: #3868
- Update `https-proxy-agent` to v5: #3996

# 4.3.0

## Features

- Add proxy support to OIDCStrategy: #435

## Bugs

- Fix sameSiteNotAllowed: #465
- Fix crash if Bearer token is blank: #474
- Stringify optionToValidate when logging: #437
- Properly handle malformed json: #436
- Update dependencies to resolve security vulnerabilities: #511

# 4.2.1
### Fix Policy Checker Bug 
#426 merged 
Fix for the policyChecker that will never work as the pathname will never contain query parameters.

# 4.2.0
### Support for Same Site.
* Passport now offers support for the cookie attribute `SameSite` for the Oidc Strategy.  Without this cookie attribute set, coookies will not be forwarded back to the server to verify the state and nonce of an id token in Chrome 80+.  To read more about the Same Site changes chrome is making, please see https://www.chromium.org/updates/same-site.

To get the benefit of this, you will need to explicitly opt into the `cookieSameSite` option.  This is opt in because it requires that you validate your webserver accepts the cookie option we set.  For instance Express 3 will not accept the Same Site cookie attribute and will require that you upgrade to Express 4.

# 4.0.0
### Breaking change
* Passport-azure-ad will only support node.js version 6 and above from this release.

### Fixed security vulnerability
* [#383](https://github.com/AzureAD/passport-azure-ad/issues/383) Update base64url to fix vulnerability


# 3.0.12

## Breaking change

* Added option 'loggingNoPII' to OIDCStrategy and BearerStrategy per Microsoft policy.

If this is set to true, then Passport-azure-ad won't log anything related to
personal identification information, such as id_token, claims, etc. The default value is true. If you want the full log as before, you
have to explicitly set 'loggingNoPII' to false in the constructor of OIDCStrategy and BearerStrategy.

# 3.0.11

## OIDCStrategy

### Bug fixes

* [#365](https://github.com/AzureAD/passport-azure-ad/issues/365) Metadata caching in Bearer Strategy breaks and cannot be recovered if request fails

## BearerStrategy

### Bug fixes

* [#365](https://github.com/AzureAD/passport-azure-ad/issues/365) Metadata caching in Bearer Strategy breaks and cannot be recovered if request fails

# 3.0.10

## BearerStrategy

### New features

* [#354](https://github.com/AzureAD/passport-azure-ad/issues/354) Support passing tenant name or id in BearerStrategy

# 3.0.9

## OIDCStrategy

### Bug fixes

* [#338](https://github.com/AzureAD/passport-azure-ad/issues/338) Allow query parameters in the identityMetadata config key

* [#346](https://github.com/AzureAD/passport-azure-ad/pull/346) Fix: Cannot set cookie on the response

## BearerStrategy

### Bug fixes

* [#333](https://github.com/AzureAD/passport-azure-ad/issues/333) jwt should not check sub for access token

* [#338](https://github.com/AzureAD/passport-azure-ad/issues/338) Allow query parameters in the identityMetadata config key

# 3.0.8

## OIDCStrategy

### Bug fixes

* [#328](https://github.com/AzureAD/passport-azure-ad/issues/328) OIDC session key fails to serialize for certain session middleware options

* Support advanced policy name with prefix b2c_1a_

# 3.0.7

## OIDCStrategy

### Bug fixes

* [#301](https://github.com/AzureAD/passport-azure-ad/issues/301) Error: a key with kid %s cannot be found

* [#309](https://github.com/AzureAD/passport-azure-ad/issues/309) "State" gets encoded and causes invalid state error

* [#317](https://github.com/AzureAD/passport-azure-ad/issues/317) Undefined "token_type"

## BearerStrategy

### New features

* [#296](https://github.com/AzureAD/passport-azure-ad/issues/296) scope validation for BearerStrategy

### Bug fixes

* [#301](https://github.com/AzureAD/passport-azure-ad/issues/301) Error: a key with kid %s cannot be found

# 3.0.6

## OIDCStrategy

### New features

* [#285](https://github.com/AzureAD/passport-azure-ad/issues/285) express-session free support

  We used to save state etc in express session, so you cannot be session free even if `{ session : fase }`
  option is used in `passport.authenticate`. Now we provide an option to save state etc in cookie via
  encryption and decryption, so OIDCStrategy no longer relies on express session.

  More details can be found in README.md, section 5.1.4.

# 3.0.5

## OIDCStrategy

### New features

* added support of `id_token` in JWE compact serialization format.

  Supported key encryption algorithms (alg) are:
  `RSA1_5`, `RSA-OAEP`, `A128KW`, `A256KW`, `dir`

  supported content encryption algorithms (enc) are:
  `A128CBC-HS256`, `A192CBC-HS384`, `A256CBC-HS512`, `A128GCM`, and `A256GCM`.

# 3.0.4

## OIDCStrategy

### New features

* added support for `prompt`, `login_hint` and `domain_hint` parameters

* added `tfp` claim support for B2C

* token validation clock skew is now configurable using `clockSkew` option

* added `thumbprint` and `privatePEMKey` options for client assertion support.

## BearerStrategy

* token validation clock skew is now configurable using `clockSkew` option

## Tests

* added end to end automated tests for OIDCStrategy and BearerStrategy

## Bug fixes

* [#231](https://github.com/AzureAD/passport-azure-ad/issues/231) Support client_asserton for OIDC auth flow

* [#245](https://github.com/AzureAD/passport-azure-ad/issues/245) Make clock skew configurable

* [#251](https://github.com/AzureAD/passport-azure-ad/issues/251) Multiple Audiences with Bearer Strategy

* [#254](https://github.com/AzureAD/passport-azure-ad/issues/254) passReqToCallback does not work with bearer strategy

* [#256](https://github.com/AzureAD/passport-azure-ad/issues/256) Support 'tfp' for B2C

* [#261](https://github.com/AzureAD/passport-azure-ad/issues/261) prompt,domain_hint and login_hint are missing in the query params sent to endpoint

* [#264](https://github.com/AzureAD/passport-azure-ad/issues/264) OIDC authentication fails when oauth token_type is 'bearer' and not 'Bearer'

# 3.0.3

## Bug fixes

* [#248](https://github.com/AzureAD/passport-azure-ad/issues/248) End_to_end_test showing up in test folder

# 3.0.2

## Changes

* removed dependency on oniyi-object-transform

* allow 5 minutes clock skew for token validation

# 3.0.1

## OIDCStrategy

### New features

* specify tenant per request

  Now you can specify the tenant per request, using the `tenantIdOrName` option in `passport.authenticate`. More details on the usage can be found in README.md. `tenantIdOrName` enables two features:

  * B2C common endpoint support

    Now you can use the B2C common endpoint by specifying the tenant for each login request using the `tenantIdOrName` option. A login request is any request that doesn't contain code or id_token.

  * extensive issuer validation on common endpoint

    Previously, you had to provide an `issuer` value in configuration to validat the issuer on the common endpoint. Alternatively, you can now specify the tenant for each login request.

## Bug fixes

* [#239](https://github.com/AzureAD/passport-azure-ad/issues/239) Problems with signin in the updated sample

* [#233](https://github.com/AzureAD/passport-azure-ad/issues/233) Provide documentation with more details

* [#229](https://github.com/AzureAD/passport-azure-ad/issues/229) use tenant id dynamically for each request

* [#123](https://github.com/AzureAD/passport-azure-ad/issues/123) Question: what is the difference between OIDCStrategy and BearerStrategy. Which one should I use?

# 3.0.0

## OIDCStrategy

### Breaking changes

#### SAML and WSFED

* We no longer support SAML and WSFED starting from version 3.0.0, please use release 2.0.3 instead.

#### Options

* `skipUserProfile` option: this option is no longer provided. We will load 'userinfo' if we can get an access_token for 'userinfo'. More specifically, if you are using AAD v1 with 'code', 'code id_token' or 'id_token code' flow, and the resource is not specified. For all other scenarios, we do an 'id_token' fallback.

* `returnURL`/`callbackURL` option: this option is renamed to `redirectUrl`. `redirectUrl` can only be a https url now unless you set the `allowHttpForRedirectUrl` option to true.

#### Claims in the returned profile

* removed `email` claim.

* added `oid`, `upn` and `emails` claim. `emails` claim is always an array. You might get `upn` claim from non B2C tenants, and you might
get `emails` claim from B2C tenants.

#### B2C only

* `identityMetadata` option: common endpoint is no longer allowed for B2C. Tenant-specific endpoint should be used, for instance:
`https://login.microsoftonline.com/your_B2C_tenant_name.onmicrosoft.com/v2.0/.well-known/openid-configuration` or
`https://login.microsoftonline.com/your_B2C_tenant_guid/v2.0/.well-known/openid-configuration`.

* `isB2C` option: this is a new option. If you are using a B2C tenant, set this option to true.

* `tenantName`: this option is no longer used.

### New features

* multiple nonce and state support in OIDCStrategy. Provided `nonceLifetime` option to configure the lifetime of nonce saved in session.

* enabled `issuer` validation against common endpoint. To validate issuer on common endpoint, user must
specify the allowed issuer(s) in `issuer` option, and set `validateIssuer` option to true.

* user-provided state support. The usage is as follows:

```
  passport.authenticate('azuread-openidconnect', { customState : 'the_state_you_want_to_use' });
```

## BearerStrategy

### Breaking changes

#### General

* We no longer accept access_token sent by request query. access_token should either be put in the request header or request body.

* We no longer support the `certificate` option. Now we always fetch the keys from the metadata url and generate the pem key.

#### B2C only

* `identityMetadata`: common endpoint is no longer allowed for B2C. Tenant-specific endpoint should be used, for instance:
`https://login.microsoftonline.com/your_B2C_tenant_name.onmicrosoft.com/v2.0/.well-known/openid-configuration` or
`https://login.microsoftonline.com/your_B2C_tenant_guid/v2.0/.well-known/openid-configuration`.

* `isB2C` option: this is a new option. If you are using a B2C tenant, set this option to true.

* `tenantName`: this option is no longer used.

#### New features

* enabled `issuer` validation against common endpoint. To validate issuer on common endpoint, user must
specify the allowed issuer or array of issuers in `issuer` option, and set `validateIssuer` option to true.


## Bug fixes

* [#218](https://github.com/AzureAD/passport-azure-ad/issues/218) Missing email claim for B2C

* [#195](https://github.com/AzureAD/passport-azure-ad/issues/195) Remove default query support for access_token in bearerStrategy

* [#194](https://github.com/AzureAD/passport-azure-ad/issues/194) Error message for 'sub' mismatch is incorrect after redeeming 'code'

* [#189](https://github.com/AzureAD/passport-azure-ad/issues/189) Extensibility to allow issuer validation when going against common endpoint

* [#188](https://github.com/AzureAD/passport-azure-ad/issues/188) Mocha tests for B2C to prevent regressions

* [#187](https://github.com/AzureAD/passport-azure-ad/issues/187) p parameter is not being passed in each flow through the passport.js library

* [#171](https://github.com/AzureAD/passport-azure-ad/issues/171) multiple nonce and state handling

* [#165](https://github.com/AzureAD/passport-azure-ad/issues/165) validationConfiguration.callbackUrl should be named redirectUrl

* [#164](https://github.com/AzureAD/passport-azure-ad/issues/164) By default redirect URL should be https

# 2.0.3

* Updated telemetry version.

# 2.0.2

* Increased the size of nonce and state in OIDCStrategy.

# 2.0.1

## Major changes from 2.0.0

### Security Fix
* Version 2.0.1 fixes a known security vulnerability affecting versions <1.4.6 and 2.0.0. All users should upgrade to 2.0.1 or greater immediately. For more details, see the [Security-Notice](https://github.com/AzureAD/passport-azure-ad/blob/master/SECURITY-NOTICE.MD) for more details.

### BearerStrategy
* Metadata is loaded only once in 2.0.0, which happens at the creation time of the strategy. In 2.0.1 we load metadata for each request that requires authentication. We keep the metadata in memory cache for 30 minutes. Whenever we need to load the metadata, we check the memory cache first. If we don't find it we then load the metadata from AAD and save it in memory cache. This way BearerStrategy can automatically handle the key rolling of Azure Active Directory.
* The default value of validateIssuer is true.

### OIDCStrategy
* For OIDCStrategy, we now support 'code id_token' as the response_type, in addition to 'code', 'id_token code' and 'id_token'.
* The default value of validateIssuer is true.

### Miscellaneous
* For non-server-related errors, in 2.0.1 we call Strategy.fail function instead of throwing an error, so the user can do the failure redirection.
* Added chai-passport-strategy testing tool and more unit tests.
* Fixed some bugs in examples.
* Added telemetry parameters in both OIDCStrategy and BearerStrategy when sending requests to Azure Active Directory.

### Upgrade Notes

1. This patch updates the library that your application runs, but does not change the current state of your users, including any sessions they had open. This applies to malicious users who could have exploited this vulnerability to gain access to your system. If your application has users with existing sessions open, after applying the patch, ensure all these sessions are terminated and users are required to sign in again.


2. In previous versions of the Passport-Azure-AD for NodeJS library, the issuer wasn't validated, even if you had set validateIssuer to true in your configuration. This is fixed in versions 1.4.6 and 2.0.1. However, this may mean you get 401s if you are using the common endpoint in the identityMetadata config setting and have validateIssuer to true. If you are using the common endpoint (which looks like "https://login.microsoftonline.com/common/.well-known/openid-configuration"), issuers cannot be validated. You can fix this in two ways:

 - If you are a single-tenant app, you can replace 'common' with your tenantId in the endpoint address. The issuer will be validated. IdentityMetadata set to support a single tenant should look like "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011dddd/.well-known/openid-configuration" with your tenant GUID replaced in the path or "https://login.microsoftonline.com/your-tenant-name.onmicrosoft.com/.well-known/openid-configuration" with your tenant name replaced in the path.

 - If you are a multi-tenant app and need to go against the common endpoint, you must set validateIssuer to false. Be aware that the issuer field of the token will not be validated and all issuers will be accepted.

## Bug fixes in 2.0.1
* [#71](https://github.com/AzureAD/passport-azure-ad/issues/71) Cryptic error message when the client ID is null/undefined
* [#90](https://github.com/AzureAD/passport-azure-ad/issues/90) Cannot read property 'keys' of undefined
* [#117](https://github.com/AzureAD/passport-azure-ad/issues/117) TypeError: Invalid hex string in aadutils.js
* [#112](https://github.com/AzureAD/passport-azure-ad/issues/112) done is not a function. bearerstrategy.js:149
* [#121](https://github.com/AzureAD/passport-azure-ad/issues/121) Error with regex into pem.js

# 1.4.8

* Updated telemetry version.

# 1.4.7

* Increased the size of nonce and state in OIDCStrategy.

# 1.4.6

### Security Fix
* Version 1.4.6 fixes a known security vulnerability affecting versions <1.4.6. All users should upgrade to 1.4.6 or greater immediately. For more details, see the [Security-Notice](https://github.com/AzureAD/passport-azure-ad/blob/master/SECURITY-NOTICE.MD).

### BearerStrategy
* The default value of validateIssuer is true.

### OIDCStrategy
* For OIDCStrategy, we now support 'code id_token' as the response_type, in addition to 'code', 'id_token code' and 'id_token'.
* The default value of validateIssuer is true.
* Validating options at the time of creating strategy, instead of when authenticate method is called.

### Miscellaneous
* For non-server-related errors, in 1.4.6 we call Strategy.fail function instead of throwing error, so user can do the failure redirection.
* Added chai-passport-strategy testing tool and more unit tests.
* Added telemetry in both OIDC and Bearer strategy when sending requests to AAD.
* Fixed some bugs in examples.

### Upgrade Notes

1. This patch updates the library that your application runs, but does not change the current state of your users, including any sessions they had open. This applies to malicious users who could have exploited this vulnerability to gain access to your system. If your application has users with existing sessions open, after applying the patch, ensure all these sessions are terminated and users are required to sign in again.


2. In previous versions of the Passport-Azure-AD for NodeJS library, the issuer wasn't validated, even if you had set validateIssuer to true in your configuration. This is fixed in versions 1.4.6 and 2.0.1. However, this may mean you get 401s if you are using the common endpoint in the identityMetadata config setting and have validateIssuer to true. If you are using the common endpoint (which looks like "https://login.microsoftonline.com/common/.well-known/openid-configuration"), issuers cannot be validated. You can fix this in two ways:

 - If you are a single-tenant app, you can replace 'common' with your tenantId in the endpoint address. The issuer will be validated. IdentityMetadata set to support a single tenant should look like "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011dddd/.well-known/openid-configuration" with your tenant GUID replaced in the path or "https://login.microsoftonline.com/your-tenant-name.onmicrosoft.com/.well-known/openid-configuration" with your tenant name replaced in the path.

 - If you are a multi-tenant app and need to go against the common endpoint, you must set validateIssuer to false. Be aware that the issuer field of the token will not be validated and all issuers will be accepted.

