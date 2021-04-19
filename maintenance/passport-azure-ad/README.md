
# Microsoft Azure Active Directory Passport.js Plug-In

---

_passport-azure-ad_ is a collection of [Passport](http://passportjs.org/) Strategies 
to help you integrate with Azure Active Directory. It includes OpenID Connect, 
WS-Federation, and SAML-P authentication and authorization. These providers let you 
integrate your Node app with Microsoft Azure AD so you can use its many features, 
including web single sign-on (WebSSO), Endpoint Protection with OAuth, and JWT token 
issuance and validation.

_passport-azure-ad_ has been tested to work with both [Microsoft Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/) 
and with [Microsoft Active Directory Federation Services](http://en.wikipedia.org/wiki/Active_Directory_Federation_Services).

## 1. Security Vulnerability in Versions < 1.4.6 and 2.0.0
_passport-azure-ad_ has a known security vulnerability affecting versions <1.4.6 and 2.0.0. Please update to >=1.4.6 or >=2.0.1 immediately. For more details, see the [security notice](https://github.com/AzureAD/passport-azure-ad/blob/master/SECURITY-NOTICE.MD).

## 2. Versions
Current version - 4.0.0  
Latest version that support's SAML and WSFED - 2.0.3
Minimum  recommended version - 1.4.6  
You can find the changes for each version in the [change log](https://github.com/AzureAD/passport-azure-ad/blob/master/CHANGELOG.md).

## 3. Installation

    $ npm install passport-azure-ad

## 4. Usage

This library contains two strategies: OIDCStrategy and BearerStrategy.

OIDCStrategy uses OpenID Connect protocol for web application login purposes. It works in the following manner:
If a user is not logged in, passport sends an authentication request to AAD (Azure Active Directory), and AAD prompts the user for his or her sign-in credentials. On successful authentication, depending on the flow you choose, web application will eventually get an id_token back either directly from the AAD authorization endpoint or by redeeming a code at the AAD token endpoint. Passport then validates the id_token and propagates the claims in id_token back to the verify callback, and let the framework finish the remaining authentication procedure. If the whole process is successful, passport adds the user information to `req.user` and passes it to the next middleware. In case of error, passport either sends back an unauthorized response or redirects the user to the page you specified (such as homepage or login page).

BearerStrategy uses Bearer Token protocol to protect web resource/api. It works in the following manner:
User sends a request to the protected web api which contains an access_token in either the authorization header or body. Passport extracts and validates the access_token, and propagates the claims in access_token to the verify callback and let the framework finish the remaining authentication procedure. On successful authentication, passport adds the user information to `req.user` and passes it to the next middleware, which is usually the business logic of the web resource/api. In case of error, passport sends back an unauthorized response.


We support AAD v1, v2 and B2C tenants for both strategies. Please check out [section 8](#8-samples-and-documentation) for the samples. You can manage v1 tenants and register applications at https://manage.windowsazure.com. For v2 tenants and applications, you should go to https://aka.ms/appregistrations. For B2C tenants, go to https://manage.windowsazure.com and click 'Manage B2C settings' to register applications and policies. 

### 4.1 OIDCStrategy

#### 4.1.1 Configure strategy and provide callback function

##### 4.1.1.1 Sample using the OIDCStrategy

```javascript
passport.use(new OIDCStrategy({
    identityMetadata: config.creds.identityMetadata,
    clientID: config.creds.clientID,
    responseType: config.creds.responseType,
    responseMode: config.creds.responseMode,
    redirectUrl: config.creds.redirectUrl,
    allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
    clientSecret: config.creds.clientSecret,
    validateIssuer: config.creds.validateIssuer,
    isB2C: config.creds.isB2C,
    issuer: config.creds.issuer,
    passReqToCallback: config.creds.passReqToCallback,
    scope: config.creds.scope,
    loggingLevel: config.creds.loggingLevel,
    loggingNoPII: config.creds.loggingNoPII,
    nonceLifetime: config.creds.nonceLifetime,
    nonceMaxAmount: config.creds.nonceMaxAmount,
    useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
    cookieSameSite: config.creds.cookieSameSite, // boolean
    cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
    clockSkew: config.creds.clockSkew,
    proxy: { port: 'proxyport', host: 'proxyhost', protocol: 'http' },
  },
  function(iss, sub, profile, accessToken, refreshToken, done) {
    if (!profile.oid) {
      return done(new Error("No oid found"), null);
    }
    // asynchronous verification, for effect...
    process.nextTick(function () {
      findByOid(profile.oid, function(err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          // "Auto-registration"
          users.push(profile);
          return done(null, profile);
        }
        return done(null, user);
      });
    });
  }
));
```

##### 4.1.1.2 Options

* `identityMetadata` (Required)

  The metadata endpoint provided by the Microsoft Identity Portal that provides the keys and other important information at runtime.    Examples:
  * v1 tenant-specific endpoint
  ```
    https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/.well-known/openid-configuration
    https://login.microsoftonline.com/your_tenant_guid/.well-known/openid-configuration
  ```
  * v1 common endpoint
  ```
    https://login.microsoftonline.com/common/.well-known/openid-configuration
  ```
  * v2 tenant-specific endpoint
  ```
    https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/v2.0/.well-known/openid-configuration 
    https://login.microsoftonline.com/your_tenant_guid/v2.0/.well-known/openid-configuration
  ```
  * v2 common endpoint
  ``` 
    https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
  ```
  
  For B2C, you cannot use v2 common endpoint unless you specify the tenant in `passport.authenticate` using `tenantIdOrName` option. See section 4.1.3 for more details.
  
* `clientID` (Required)

  The client ID of your application in AAD (Azure Active Directory)
  
* `responseType` (Required)
  
  Must be 'code', 'code id_token', 'id_token code' or 'id_token'. For login only flows you can use 'id_token'; if you want access_token, use 'code', 'code id_token' or 'id_token code'.

* `responseMode` (Required)
  
  Must be 'query' or 'form_post'. This is how you get code or id_token back. 'form_post' is recommended for all scenarios.
  
* `redirectUrl`  (Required)
  
  Must be a https url string, unless you set `allowHttpForRedirectUrl` to true. This is the reply URL registered in AAD for your app. Production environment should always use https for `redirectUrl`.

* `passReqToCallback`  (Conditional)

  Required to set to true if using `req` as the first paramter in the verify function, default value is false. See section 4.1.1.3 for more details.

* `allowHttpForRedirectUrl`  (Conditional) 
  
  Required to set to true if you want to use http url for redirectUrl like `http://localhost:3000`. 
 
* `clientSecret`  (Conditional)

  When `responseType` is not `id_token`, we have to provide client credential to redeem the authorization code. This credential could be client secret or client assertion. Non-B2C tenant supports both flows, but B2C tenant only supports client secret flow.
  
  For B2C tenant: `clientSecret` is required if the `responseType` is not 'id_token'.

  For non-B2C tenant: If `responseType` is not `id_token`, developer must provide either `clientSecret`, or `thumbprint` and `privatePEMKey`. We use `clientSecret` if it is provided; otherwise we use `thumbprint` and `privatePEMKey` for client assertion flow.

  `clientSecret` is the app key of your app in AAD. For B2C, the app key sometimes contains \\, please replace \ with two \\'s in the app key, otherwise \ will be treated as the beginning of an escaping character.

* `thumbprint`  (Conditional)

  Required if you want to use client assertion flow. `thumbprint` is the base64url format of the thumbprint (hash value) of the public key.

* `privatePEMKey`  (Conditional)

  Required if you want to use client assertion flow. `privatePEMKey` is the private pem key string.

* `isB2C`  (Conditional)

  Required to set to true if you are using B2C tenant.

* `validateIssuer`  (Conditional)
  
  Required to set to false if you don't want to validate issuer, default value is true. We validate the `iss` claim in id_token against user provided `issuer` values and the issuer value we get from tenant-specific endpoint. If you use common endpoint for `identityMetadata` and you want to validate issuer, then you have to either provide `issuer`, or provide the tenant for each login request using `tenantIdOrName` option in `passport.authenticate` (see section 4.1.3 for more details).
  
* `issuer`  (Conditional)
  
  This can be a string or an array of strings. See `validateIssuer` for the situation that requires `issuer`.

* `jweKeyStore`  (Conditional)

  This option is required if you want to accept and decrypt id_token in JWE Compact Serialization format. See 
  section 4.1.1.4 for more details.

* `useCookieInsteadOfSession`  (Conditional)
  
  Passport-azure-ad saves state and nonce in session by default for validation purpose. Consider regenerating the session
  after authentication to prevent session fixation attacks when using the default. If `useCookieInsteadOfSession` is set to 
  true, passport-azure-ad will encrypt the state/nonce and put them into cookie instead. This is helpful when we want to be 
  completely session-free, in other words, when you use { session: false } option in passport.authenticate function.
  If `useCookieInsteadOfSession` is set to true, you must provide `cookieEncryptionKeys` for cookie encryption and decryption.
* `cookieSameSite` (Conditional)
    If set to true, Passport will add the Same-Site: None header to cookies set by the lib, specifically to validate state and nonce. 
* `cookieEncryptionKeys`  (Conditional)

  If `useCookieInsteadOfSession` is set to true, you must provide `cookieEncryptionKeys`. It is an array of the following format: [ {key: '...', 'iv': '...' }, {key: '...', 'iv': '...' }, ...]. key could be any string of length 32, and iv could be any string of length 12. We always use the first set of key/iv to encrypt cookie, but we try all the key/iv to decrypt cookie.
  This is helpful if you want to do key rollover. The encryption/decryption algorithm we use is aes-256-gcm. You can limit the cookie amount and expiration using `nonceLifetime` and `nonceMaxAmount` options. 

* `scope`  (Optional)

  List of scope values besides `openid` indicating the required scope of the access token for accessing the requested resource. For example, ['email', 'profile']. If you need refresh_token for v2 endpoint, then you have to include the 'offline_access' scope.

* `loggingLevel`  (Optional)

  Logging level. 'info', 'warn' or 'error'.

* `loggingNoPII`  (Optional)

  If this is set to true, no personal information such as tokens and claims will be logged. The default value is true.
  
* `nonceLifetime`  (Optional)
  
  The lifetime of nonce in session in seconds. The default value is 3600 seconds.

* `nonceMaxAmount`  (Optional)
  
  The max amount of nonce you want to keep in session or cookies. The default number is 10. The oldest nonce(s) will be removed if the total number exceeds. (You can keep this number very small because nonce will be removed from session or cookies after validation. This mainly handles the case when user opens more than one login tabs at once and wants to go back to the first login page to type user credentials. Each login tab results in a nonce in session or cookie, so we only honor the most recent nonceMaxAmount many login tabs.)

* `clockSkew`  (Optional)

  This value is the clock skew (in seconds) allowed in token validation. It must be a positive integer. The default value is 300 seconds.
  
##### 4.1.1.3 Verify callback

If you set `passReqToCallback` option to false, you can use one of the following signatures for the verify callback

```
  function(iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
  function(iss, sub, profile, access_token, refresh_token, params, done)
  function(iss, sub, profile, access_token, refresh_token, done)
  function(iss, sub, profile, done)
  function(iss, sub, done)
  function(profile, done)
```

If you set `passReqToCallback` option to true, you can use one of the following signatures for the verify callback

```
  function(req, iss, sub, profile, jwtClaims, access_token, refresh_token, params, done)
  function(req, iss, sub, profile, access_token, refresh_token, params, done)
  function(req, iss, sub, profile, access_token, refresh_token, done)
  function(req, iss, sub, profile, done)
  function(req, iss, sub, done)
  function(req, profile, done)
```

#### 4.1.1.4 JWE support

  We support encrypted id_token in JWE Compact Serialization format. 

  The key encryption algorithms supported are: 

  `RSA1_5`, `RSA-OAEP`, `A128KW`, `A256KW`, `dir`.

  The content encryption algorithms supported are:
  
  `A128CBC-HS256`, `A192CBC-HS384`, `A256CBC-HS512`, `A128GCM`, and `A256GCM`.

  In order to decrypt the id_token, keys have to be provided in JWK format using `jweKeyStore` option. We will first
  try the key with the corresponding kid. If decryption fails, we will try every possible key in `jweKeyStore`. 
  The following is an example of `jweKeyStore`:

  ```javascript

    jweKeyStore: [ 
      { 'kid': 'sym_key_256', 'kty': 'oct', 'k': 'WIVds2iwJPwNhgUgwZXmn/46Ql1EkiL+M+QqDRdQURE=' }, 
      { 'kid': 'sym_key_128', 'kty': 'oct', 'k': 'GawgguFyGrWKav7AX4VKUg'}, 
      { 'kid': 'sym_key_384', 'kty': 'oct', 'k': 'AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4v'},
      { 'kid': 'rsa_key', 
        'kty': 'RSA', 
        "n":"6-FrFkt_TByQ_L5d7or-9PVAowpswxUe3dJeYFTY0Lgq7zKI5OQ5RnSrI0\n\
             T9yrfnRzE9oOdd4zmVj9txVLI-yySvinAu3yQDQou2Ga42ML_-K4Jrd5cl\n\
             MUPRGMbXdV5Rl9zzB0s2JoZJedua5dwoQw0GkS5Z8YAXBEzULrup06fnB5\n\
             n6x5r2y1C_8Ebp5cyE4Bjs7W68rUlyIlx1lzYvakxSnhUxSsjx7u_mIdyw\n\
             yGfgiT3tw0FsWvki_KYurAPR1BSMXhCzzZTkMWKE8IaLkhauw5MdxojxyB\n\
             VuNY-J_elq-HgJ_dZK6g7vMNvXz2_vT-SykIkzwiD9eSI9UWfsjw",
        "e":"AQAB",
        "d":"C6EGZYf9U6RI5Z0BBoSlwy_gKumVqRx-dBMuAfPM6KVbwIUuSJKT3ExeL5\n\
             P0Ky1b4p-j2S3u7Afnvrrj4HgVLnC1ks6rEOc2ne5DYQq8szST9FMutyul\n\
             csNUKLOM5cVromALPz3PAqE2OCLChTiQZ5XZ0AiH-KcG-3hKMa-g1MVnGW\n\
             -SSmm27XQwRtUtFQFfxDuL0E0fyA9O9ZFBV5201ledBaLdDcPBF8cHC53G\n\
             m5G6FRX3QVpoewm3yGk28Wze_YvNl8U3hvbxei2Koc_b9wMbFxvHseLQrx\n\
             vFg_2byE2em8FrxJstxgN7qhMsYcAyw1qGJY-cYX-Ab_1bBCpdcQ",
        "p":"_avCCyuo7hHlqu9Ec6R47ub_Ul_zNiS-xvkkuYwW-4lNnI66A5zMm_BOQV\n\
             MnaCkBua1OmOgx7e63-jHFvG5lyrhyYEmkA2CS3kMCrI-dx0fvNMLEXInP\n\
             xd4np_7GUd1_XzPZEkPxBhqf09kqryHMj_uf7UtPcrJNvFY-GNrzlJk",
        "q":"7gvYRkpqM-SC883KImmy66eLiUrGE6G6_7Y8BS9oD4HhXcZ4rW6JJKuBzm\n\
             7FlnsVhVGro9M-QQ_GSLaDoxOPQfHQq62ERt-y_lCzSsMeWHbqOMci_pbt\n\
             vJknpMv4ifsQXKJ4Lnk_AlGr-5r5JR5rUHgPFzCk9dJt69ff3QhzG2c",
        "dp":"ErP3OpudePAY3uGFSoF16Sde69PnOra62jDEZGnPx_v3nPNpA5sr-tNc8\n\
              bQP074yQl5kzSFRjRlstyW0TpBVMP0ocbD8RsN4EKsgJ1jvaSIEoP87Ox\n\
              duGkim49wFA0Qxf_NyrcYUnz6XSidY3lC_pF4JDJXg5bP_x0MUkQCTtQE",
        "dq":"YbBsthPt15Pshb8rN8omyfy9D7-m4AGcKzqPERWuX8bORNyhQ5M8JtdXc\n\
              u8UmTez0j188cNMJgkiN07nYLIzNT3Wg822nhtJaoKVwZWnS2ipoFlgrB\n\
              gmQiKcGU43lfB5e3qVVYUebYY0zRGBM1Fzetd6Yertl5Ae2g2CakQAcPs",
        "qi":"lbljWyVY-DD_Zuii2ifAz0jrHTMvN-YS9l_zyYyA_Scnalw23fQf5WIcZ\n\
              ibxJJll5H0kNTIk8SCxyPzNShKGKjgpyZHsJBKgL3iAgmnwk6k8zrb_lq\n\
              a0sd1QWSB-Rqiw7AqVqvNUdnIqhm-v3R8tYrxzAqkUsGcFbQYj4M5_F_4"
      },
      { 'kid': 'ras_key_2',
        'kty': 'RSA',
        'privatePemKey': 
          '-----BEGIN RSA PRIVATE KEY-----\n\
          MIIEowIBAAKCAQEA6+FrFkt/TByQ/L5d7or+9PVAowpswxUe3dJeYFTY0Lgq7zKI\n\
          5OQ5RnSrI0T9yrfnRzE9oOdd4zmVj9txVLI+yySvinAu3yQDQou2Ga42ML/+K4Jr\n\
          d5clMUPRGMbXdV5Rl9zzB0s2JoZJedua5dwoQw0GkS5Z8YAXBEzULrup06fnB5n6\n\
          x5r2y1C/8Ebp5cyE4Bjs7W68rUlyIlx1lzYvakxSnhUxSsjx7u/mIdywyGfgiT3t\n\
          w0FsWvki/KYurAPR1BSMXhCzzZTkMWKE8IaLkhauw5MdxojxyBVuNY+J/elq+HgJ\n\
          /dZK6g7vMNvXz2/vT+SykIkzwiD9eSI9UWfsjwIDAQABAoIBAAuhBmWH/VOkSOWd\n\
          AQaEpcMv4CrplakcfnQTLgHzzOilW8CFLkiSk9xMXi+T9CstW+Kfo9kt7uwH5766\n\
          4+B4FS5wtZLOqxDnNp3uQ2EKvLM0k/RTLrcrpXLDVCizjOXFa6JgCz89zwKhNjgi\n\
          woU4kGeV2dAIh/inBvt4SjGvoNTFZxlvkkpptu10MEbVLRUBX8Q7i9BNH8gPTvWR\n\
          QVedtNZXnQWi3Q3DwRfHBwudxpuRuhUV90FaaHsJt8hpNvFs3v2LzZfFN4b28Xot\n\
          iqHP2/cDGxcbx7Hi0K8bxYP9m8hNnpvBa8SbLcYDe6oTLGHAMsNahiWPnGF/gG/9\n\
          WwQqXXECgYEA/avCCyuo7hHlqu9Ec6R47ub/Ul/zNiS+xvkkuYwW+4lNnI66A5zM\n\
          m/BOQVMnaCkBua1OmOgx7e63+jHFvG5lyrhyYEmkA2CS3kMCrI+dx0fvNMLEXInP\n\
          xd4np/7GUd1/XzPZEkPxBhqf09kqryHMj/uf7UtPcrJNvFY+GNrzlJkCgYEA7gvY\n\
          RkpqM+SC883KImmy66eLiUrGE6G6/7Y8BS9oD4HhXcZ4rW6JJKuBzm7FlnsVhVGr\n\
          o9M+QQ/GSLaDoxOPQfHQq62ERt+y/lCzSsMeWHbqOMci/pbtvJknpMv4ifsQXKJ4\n\
          Lnk/AlGr+5r5JR5rUHgPFzCk9dJt69ff3QhzG2cCgYASs/c6m5148Bje4YVKgXXp\n\
          J17r0+c6trraMMRkac/H+/ec82kDmyv601zxtA/TvjJCXmTNIVGNGWy3JbROkFUw\n\
          /ShxsPxGw3gQqyAnWO9pIgSg/zs7F24aSKbj3AUDRDF/83KtxhSfPpdKJ1jeUL+k\n\
          XgkMleDls//HQxSRAJO1AQKBgGGwbLYT7deT7IW/KzfKJsn8vQ+/puABnCs6jxEV\n\
          rl/GzkTcoUOTPCbXV3LvFJk3s9I9fPHDTCYJIjdO52CyMzU91oPNtp4bSWqClcGV\n\
          p0toqaBZYKwYJkIinBlON5XweXt6lVWFHm2GNM0RgTNRc3rXemHq7ZeQHtoNgmpE\n\
          AHD7AoGBAJW5Y1slWPgw/2bootonwM9I6x0zLzfmEvZf88mMgP0nJ2pcNt30H+Vi\n\
          HGYm8SSZZeR9JDUyJPEgscj8zUoShio4KcmR7CQSoC94gIJp8JOpPM62/5amtLHd\n\
          UFkgfkaosOwKlarzVHZyKoZvr90fLWK8cwKpFLBnBW0GI+DOfxf+\n\
          -----END RSA PRIVATE KEY-----\n';
      }
  ]

  ```


#### 4.1.2 Use `passport.authenticate` to protect routes

To complete the sample, provide a route that corresponds to the path 
configuration parameter that is sent to the strategy:

```javascript

app.get('/login', 
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
  function(req, res) {
    log.info('Login was called in the Sample');
    res.redirect('/');
});

function regenerateSessionAfterAuthentication(req, res, next) {
  var passportInstance = req.session.passport;
  return req.session.regenerate(function (err){
    if (err) {
      return next(err);
    }
    req.session.passport = passportInstance;
    return req.session.save(next);
  });
}

// POST /auth/openid/return
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   home page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/' }),
  regenerateSessionAfterAuthentication,
  function(req, res) { 
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

```

#### 4.1.3 Options available for `passport.authenticate`

* `failureRedirect`: the url redirected to when the authentication fails

* `session`: if you don't want a persistent login session, you can use `session: false`. The default value is true.

* `customState`: if you want to use a custom state value instead of a random generated one

* `resourceURL`: if you need access_token for some resource. Note this option is only for v1 endpoint and `code`, `code id_token`, `id_token code` flow. For v2 endpoint, resource is considered as a scope, so it should be specified in the `scope` field when you create
the strategy.

* `tenantIdOrName`: if you want to specify the tenant to use for this request. You can use the tenant guid or tenant name (like 'contoso.onmicrosoft.com'). Note: 
  * You must use common endpoint for `identityMetadata`, otherwise this option will be ignored. We will fetch and use the metadata from the tenant you specify for this request.
  * This option only applies to the login request, in other words, the request which is not supposed to contain code or id_token. Passport saves the `tenantIdOrName` value in session before sending the authentication request. When we receive a request containing code or id_token, we retrieve the saved `tenantIdOrName` value from session and use that value.
  * If you are using B2C common endpoint, then `tenantIdOrName` must be used for every login request.

* `domain_hint`: if you want to specify the domain that the user should use to sign in. This option is not supported for B2C tenant.

* `login_hint`: if you want to prefill the username with a given value in the login page. The value should be the `upn` of a user, not the email (most times they are the same though). 

* `prompt`: v1 and v2 endpoint support `login`, `consent` and `admin_consent`; B2C endpoint only supports `login`. 

* `response`: this is required if you want to use cookie instead of session to save state/nonce. See section 4.1.4.

Example:

```
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/', session: false, customState: 'my_state', resourceURL: 'https://graph.microsoft.com/mail.send'});
  
  passport.authenticate('azuread-openidconnect', { tenantIdOrName: 'contoso.onmicrosoft.com' });
```

#### 4.1.4 Session free support

Passport framework uses session to keep a persistent login session. As a plug in, we also use session to store state and nonce by default, regardless whether you use { session: false } option in passport.authenticate or not. To be completely session free, you must configure passport-azure-ad to create state/nonce cookie instead of saving them in session. Please follow the following example:

```
  passport.use(new OIDCStrategy({
    ...
    nonceLifetime: 600,  // state/nonce cookie expiration in seconds
    nonceMaxAmount: 5,   // max amount of state/nonce cookie you want to keep (cookie is deleted after validation so this can be very small)
    useCookieInsteadOfSession: true,  // use cookie, not session
    cookieEncryptionKeys: [ { key: '12345678901234567890123456789012', 'iv': '123456789012' }],  // encrypt/decrypt key and iv, see `cookieEncryptionKeys` instruction in section 4.1.1.2
  },
    // any supported verify callback
    function(iss, sub, profile, accessToken, refreshToken, done) {
    ...
  });

  app.get('/login', passport.authenticate('azuread-openidconnect', { session: false }));

```

### 4.2 BearerStrategy

#### 4.2.1 Configure strategy and provide callback function

##### 4.2.1.1 Sample using the BearerStrategy

```javascript

// We pass these options in to the ODICBearerStrategy.

var options = {
  identityMetadata: config.creds.identityMetadata,
  clientID: config.creds.clientID,
  validateIssuer: config.creds.validateIssuer,
  issuer: config.creds.issuer,
  passReqToCallback: config.creds.passReqToCallback,
  isB2C: config.creds.isB2C,
  policyName: config.creds.policyName,
  allowMultiAudiencesInToken: config.creds.allowMultiAudiencesInToken,
  audience: config.creds.audience,
  loggingLevel: config.creds.loggingLevel,
  loggingNoPII: config.creds.loggingNoPII,
  clockSkew: config.creds.clockSkew,
  scope: config.creds.scope
};

var bearerStrategy = new BearerStrategy(options,
  function(token, done) {
    log.info('verifying the user');
    log.info(token, 'was the token retreived');
    findById(token.oid, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        // "Auto-registration"
        log.info('User was added automatically as they were new. Their oid is: ', token.oid);
        users.push(token);
        owner = token.oid;
        return done(null, token);
      }
      owner = token.oid;
      return done(null, user, token);
    });
  }
);
``` 

##### 4.2.1.2 Options

* `identityMetadata` (Required)

  The metadata endpoint provided by the Microsoft Identity Portal that provides the keys and other important information at runtime.    Examples:
  * v1 tenant-specific endpoint
  ```
    https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/.well-known/openid-configuration
    https://login.microsoftonline.com/your_tenant_guid/.well-known/openid-configuration
  ```
  * v1 common endpoint
  ```
    https://login.microsoftonline.com/common/.well-known/openid-configuration
  ```
  * v2 tenant-specific endpoint
  ```
    https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/v2.0/.well-known/openid-configuration 
    https://login.microsoftonline.com/your_tenant_guid/v2.0/.well-known/openid-configuration
  ```
  * v2 common endpoint
  ``` 
    https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
  ```
  
  For B2C, you can only use v2 tenant-specific endpoint.
  
* `clientID` (Required)

  The client ID of your application in AAD (Azure Active Directory)

* `passReqToCallback`  (Conditional)

  Required to set to true if using `req` as the first paramter in the verify function, default value is false. See section 4.2.1.3 for more details.
  
* `isB2C`  (Conditional)

  Required to set to true if you are using B2C tenant.
  
* `policyName`  (Conditional)

  Required if you are using B2C tenant. It is a string starting with 'B2C_1_' (case insensitive).

* `validateIssuer`  (Conditional)
  
  Required to set to false if you don't want to validate issuer, default value is true. We validate the `iss` claim in id_token against user provided `issuer` values and the issuer value we get from tenant-specific endpoint. If you use common endpoint for `identityMetadata` and you want to validate issuer, then you must provide `issuer`, or provide `tenantIdOrName` in passport.authenticate.
  
* `issuer`  (Conditional)
  
  This can be a string or an array of strings. See `validateIssuer` for the situation that requires `issuer`.
  
* `allowMultiAudiencesInToken`  (Conditional)

  Required if you allow access_token whose `aud` claim contains multiple values.

* `scope`  (Optional)

  This value is an array of scopes you accept. If this value is provided, we will check if the token contains one of
  these accepted scopes. If this value is not provided, we won't check token scopes.
  
* `audience`  (Optional)

  Must be a string or an array of strings. We invalidate the `aud` claim in access_token against `audience`. The default value for `audience` is `clientID`.
  
* `loggingLevel`  (Optional)

  Logging level. 'info', 'warn' or 'error'.

* `loggingNoPII`  (Optional)

  If this is set to true, no personal information such as tokens and claims will be logged. The default value is true.

* `clockSkew`  (Optional)

  This value is the clock skew (in seconds) allowed in token validation. It must be a positive integer. The default value is 300 seconds.

 * `proxy` (optional)

  This value is the proxy settings object:  { port: 'proxyport', host: 'proxyhost', protocol: 'http' }
  
##### 4.2.1.3 Verify callback

If you set `passReqToCallback` option to false, you can use the following verify callback

```
  function(token, done)
```

If you set `passReqToCallback` option to true, you can use the following verify callback

```
  function(req, token, done)
```

#### 4.2.2 Use `passport.authenticate` to protect resources or APIs

In the following example, we are using passport to protect '/api/tasks'. User sends a GET request to '/api/tasks' with access_token in authorization header or body. Passport validates the access_token, adds the related claims from access_token to `req.user`, and passes the request to listTasks middleware. The listTasks middleware can then read the user information in `req.user` and list all the tasks related to this user. Note that we do authentication every time, so we don't need to keep this user in session, and this can be achieved  by using `session: false` option.

```javascript
  server.get('/api/tasks', passport.authenticate('oauth-bearer', { session: false }), listTasks);
```

#### 4.2.3 Options available for `passport.authenticate`

* `session`: if you don't want a persistent login session, you can use `session: false`. The default value is true.

* `tenantIdOrName`: if you use common endpoint, you can use this option to dynamically provide the tenant.

Example:

```
  passport.authenticate('oauth-bearer', { session: false });
```

## 5. Test

In the library root folder, type the following command to install the dependency packages:

```
    $ npm install
```

### 5.1. Run all tests except the end to end tests

Type the following command to run tests:

```
    $ npm test
```

### 5.2. Run all tests including the end to end tests

#### 5.2.1. Create test applications

First you need to register one application in v1 tenant, one in v2 tenant and one in B2C tenant. 

For the v2 application, you should register it at https://apps.dev.microsoft.com/ instead of Azure Portal.

For the B2C application, create policies named 'B2C_1_signin', 'B2C_1_signup'. For each policy, select 'Local Account' as the identity provider, and select the
following:

* 'B2C_1_signup': 

  * Sign-up attributes: 'Display Name', 'Email Address', 'Given Name', 'Surname'

  * Application claims: 'Display Name', Email Addresses', 'Given Name', 'Identity Provider', 'Surname', 'Users Object ID'

* 'B2C_1_signin': 

  * Application claims: 'Display Name', Email Addresses', 'Given Name', 'Identity Provider', 'Surname', 'Users Object ID'

You will also need to click the 'Run now' button in the 'B2C_1_signup' blade to create an user.

For B2C application, you will also need to create at least one scope and provide it to test parameters. See [how to create scope for B2C access token](https://azure.microsoft.com/en-us/blog/azure-ad-b2c-access-tokens-now-in-public-preview/). In the bearer_b2c_test, We will use OIDCStrategy to get a B2C
access token for the scope, and use BearerStrategy to validate the scope. Note for scope we use the full url in
 `b2c_params.scopeForOIDC` but only the name in `b2c_params.scopeForBearer`. For example, 
 `b2c_params.scopeForOIDC=['https://sijun1b2c.onmicrosoft.com/oidc-b2c/read']` and `b2c_params.scopeForBearer=['read']`. 

#### 5.2.2. Fill the test parameters 

Open `test/End_to_end_test/script.js`, set `is_test_parameters_completed` parameter to true. For `test_parameters` variable, fill in the tenant id/client id/client secret of your applications, and the username/password of your application user. 

For `thumbprint` and `privatePEMKey` parameters, you need to specify a certificate for your app and register the public key in Azure Active Directory. `thumbprint` is the base64url format of the thumbprint of the public key, and `privatePEMKey` is the private pem key string. For a v1 tenant, you can follow [this post](http://www.andrewconnell.com/blog/user-app-app-only-permissions-client-credentials-grant-flow-in-azure-ad-office-365-apis) to generate a certificate and register the public key. For a v2 tenant, you can go to your application page in the [v2 portal](https://apps.dev.microsoft.com) and click `Generate New Key Pair`. A certificate will be generated for you to download. The corresponding public key is automatically registered in this case.  

#### 5.2.3. Run the tests

Type the following commands to run the tests:

```
    $ cd test/End_to_end_test
    $ npm install
    $ npm install grunt -g
    $ grunt run_tests_with_e2e
```

Tests will run automatically and in the terminal you can see how many tests are passing/failing. More details can be found [here](https://github.com/AzureAD/passport-azure-ad/blob/master/contributing.md).

## 6. Logging
#### Personal Identifiable Information (PII) & Organizational Identifiable Information (OII)

By default, passport-azure-ad logging does not capture or log any PII or OII. The library allows app developers to turn this on by configuring `loggingNoPII` in the config options. By turning on PII or OII, the app takes responsibility for safely handling highly-sensitive data and complying with any regulatory requirements.

```javascript
//PII or OII logging disabled. Default Logger does not capture any PII or OII.
var options = {
  ...
  loggingNoPII: true,
  ...
};

//PII or OII logging enabled
var options = {
  ...
  loggingNoPII: false,
  ...
};
```


## 7. Samples and Documentation

[We provide a full suite of sample applications and documentation on GitHub](https://azure.microsoft.com/en-us/documentation/samples/?service=active-directory) 
to help you get started with learning the Azure Identity system. This includes 
tutorials for native clients such as Windows, Windows Phone, iOS, OSX, Android, 
and Linux. We also provide full walkthroughs for authentication flows such as 
OAuth2, OpenID Connect, Graph API, and other awesome features. 

Azure Identity samples for this plug-in can be found in the following links:

### 7.1 Samples for [OpenID connect strategy](https://github.com/AzureAD/passport-azure-ad/blob/master/lib/oidcstrategy.js)

* [sample using v1 endpoint](https://github.com/AzureADQuickStarts/WebApp-OpenIDConnect-NodeJS)

* [sample using v2 endpoint](https://github.com/AzureADQuickStarts/AppModelv2-WebApp-OpenIDConnect-nodejs)

* [sample using B2C tenant](https://github.com/AzureADQuickStarts/B2C-WebApp-OpenIDConnect-NodeJS)

### 7.2 Samples for [Bearer strategy](https://github.com/AzureAD/passport-azure-ad/blob/master/lib/bearerstrategy.js)

* [sample using v1 endpoint](https://github.com/AzureADQuickStarts/WebAPI-Bearer-NodeJS)

* [sample using v2 endpoint](https://github.com/AzureADQuickStarts/AppModelv2-WebAPI-nodejs)

* [sample using B2C tenant](https://github.com/AzureADQuickStarts/B2C-WebApi-Nodejs)

## 8. Community Help and Support

We leverage [Stack Overflow](http://stackoverflow.com/) to work with the community on supporting Azure Active Directory and its SDKs, including this one. We highly recommend you ask your questions on Stack Overflow (we're all on there!) Also browser existing issues to see if someone has had your question before. 

We recommend you use the "msal" tag so we can see it! Here is the latest Q&A on Stack Overflow for MSAL: [http://stackoverflow.com/questions/tagged/msal](http://stackoverflow.com/questions/tagged/msal)

## 9. Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## 10. Contributing

All code is licensed under the MIT license and we triage actively on GitHub. We enthusiastically welcome contributions and feedback. You can clone the repo and start contributing now. 

More details [about contribution](https://github.com/AzureAD/passport-azure-ad/blob/master/contributing.md) 

## 11. Releases

Please check the [releases](https://github.com/AzureAD/passport-azure-ad/releases) for updates.

## 12. Acknowledgements

The code is based on Henri Bergius's [passport-saml](https://github.com/bergie/passport-saml) library and Matias Woloski's [passport-wsfed-saml2](https://github.com/auth0/passport-wsfed-saml2) library as well as Kiyofumi Kondoh's [passport-openid-google](https://github.com/kkkon/passport-google-openidconnect).

## 13. License
Copyright (c) Microsoft Corp.  All rights reserved. Licensed under the MIT License;

## 14. Microsoft Open Source Code of Conduct

We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
