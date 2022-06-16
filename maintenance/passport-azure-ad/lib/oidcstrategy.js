/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

"use strict";

/* eslint no-underscore-dangle: 0 */

// third party packages
const async = require("async");
const base64url = require("base64url");
const cacheManager = require("cache-manager");
const _ = require("lodash");
const jws = require("jws");
const passport = require("passport");
const querystring = require("querystring");
const url = require("url");
const urlValidator = require("valid-url");
const util = require("util");

// packages from this library
const aadutils = require("./aadutils");
const CONSTANTS = require("./constants");
const jwt = require("./jsonWebToken");
const jwe = require("./jwe");

// For the following packages we get a constructor and we will use 'new' to create an instance
const Log = require("./logging").getLogger;
const Metadata = require("./metadata").Metadata;
const OAuth2 = require("oauth").OAuth2;
const HttpsProxyAgent = require("https-proxy-agent");
const SessionContentHandler = require("./sessionContentHandler").SessionContentHandler;
const CookieContentHandler = require("./cookieContentHandler").CookieContentHandler;
const Validator = require("./validator").Validator;

// global variable definitions
const log = new Log("AzureAD: OIDC Passport Strategy");

const memoryCache = cacheManager.caching({ store: "memory", max: 3600, shouldCloneBeforeSet: false, ttl: 1800 /* seconds */ });
const ttl = 1800; // 30 minutes cache
// Note: callback is optional in set() and del().

/*
 * For each microsoft login page, we generate a tuple containing nonce/state/etc, and save it in session.
 * 1. NONCE_LIFE_TIME is the default life time of the tuple. The default value is 3600 seconds. The life
 *    time is configurable by user.
 * 2. NONCE_MAX_AMOUNT is the max amount of tuples a user's session can have. We limit it to 10.
 *    This value limits the amount of microsoft login page tabs a user can open before the user types
 *    username and password to 10. If the user opens more than 10 login tabs, we only honor the most
 *    recent 10 tabs within the life time.
 */
const NONCE_MAX_AMOUNT = 10;
const NONCE_LIFE_TIME = 3600; // second

function makeProfileObject(src, raw) {
  return {
    sub: src.sub,
    oid: src.oid,
    upn: src.upn,
    displayName: src.name,
    name: {
      familyName: src.family_name,
      givenName: src.given_name,
      middleName: src.middle_name,
    },
    emails: src.emails,
    _raw: raw,
    _json: src,
  };
}

function onProfileLoaded(strategy, args) {
  function verified(err, user, info) {
    if (err) {
      return strategy.error(err);
    }
    if (!user) {
      return strategy.failWithLog(info);
    }
    return strategy.success(user, info);
  }

  const verifyArityArgsMap = {
    8: "iss sub profile jwtClaims access_token refresh_token params",
    7: "iss sub profile access_token refresh_token params",
    6: "iss sub profile access_token refresh_token",
    4: "iss sub profile",
    3: "iss sub",
  };

  const arity = (strategy._passReqToCallback) ? strategy._verify.length - 1 : strategy._verify.length;
  let verifyArgs = [args.profile, verified];

  if (verifyArityArgsMap[arity]) {
    verifyArgs = verifyArityArgsMap[arity]
      .split(" ")
      .map((argName) => {
        return args[argName];
      })
      .concat([verified]);
  }

  if (strategy._passReqToCallback) {
    verifyArgs.unshift(args.req);
  }

  return strategy._verify.apply(strategy, verifyArgs);
}

/**
 * Applications must supply a `verify` callback, for which the function
 * signature is:
 *
 *     function(token, done) { ... }
 * or
 *     function(req, token, done) { .... }
 *
 * (passReqToCallback must be set true in options in order to use the second signature.)
 *
 * `token` is the verified and decoded bearer token provided as a credential.
 * The verify callback is responsible for finding the user who posesses the
 * token, and invoking `done` with the following arguments:
 *
 *     done(err, user, info);
 *
 * If the token is not valid, `user` should be set to `false` to indicate an
 * authentication failure.  Additional token `info` can optionally be passed as
 * a third argument, which will be set by Passport at `req.authInfo`, where it
 * can be used by later middleware for access control.  This is typically used
 * to pass any scope associated with the token.
 *
 * Options:
 *
 *   - `identityMetadata`   (1) Required
 *                          (2) must be a https url string
 *                          (3) Description:
 *                          the metadata endpoint provided by the Microsoft Identity Portal that provides
 *                          the keys and other important info at runtime. Examples:
 *                          <1> v1 tenant-specific endpoint
 *                          - https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/.well-known/openid-configuration
 *                          - https://login.microsoftonline.com/your_tenant_guid/.well-known/openid-configuration
 *                          <2> v1 common endpoint
 *                          - https://login.microsoftonline.com/common/.well-known/openid-configuration
 *                          <3> v2 tenant-specific endpoint
 *                          - https://login.microsoftonline.com/your_tenant_name.onmicrosoft.com/v2.0/.well-known/openid-configuration
 *                          - https://login.microsoftonline.com/your_tenant_guid/v2.0/.well-known/openid-configuration
 *                          <4> v2 common endpoint
 *                          - https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration
 *
 *   - `clientID`           (1) Required
 *                          (2) must be a string
 *                          (3) Description:
 *                          The Client ID of your app in AAD
 *
 *   - `responseType`       (1) Required
 *                          (2) must be 'code', 'code id_token', 'id_token code' or 'id_token'
 *                          (3) Description:
 *                          For login only flows use 'id_token'. For accessing resources use `code id_token`, 'id_token code' or `code`
 *
 *   - `responseMode`       (1) Required
 *                          (2) must be 'query' or 'form_post'
 *                          (3) Description:
 *                          How you get the authorization code and tokens back
 *
 *   - `redirectUrl`        (1) Required
 *                          (2) must be a https url string, unless you set `allowHttpForRedirectUrl` to true
 *                          (3) Description:
 *                          The reply URL registered in AAD for your app
 *
 *   - `allowHttpForRedirectUrl`
 *                          (1) Required to set to true if you want to use http url for redirectUrl
 *                          (2) Description:
 *                          The default value is false. It's OK to use http like 'http://localhost:3000' in the
 *                          dev environment, but in production environment https should always be used.
 *
 *   - `clientSecret`       (1) This option only applies when `responseType` is 'code', 'id_token code' or 'code id_token'.
 *                              To redeem an authorization code, we can use either client secret flow or client assertion flow.
 *                              (1.1) For B2C, clientSecret is required since client assertion is not supported
 *                              (1.2) For non-B2C, both flows are supported. Developer must provide either clientSecret, or
 *                                    thumbprint and privatePEMKey. We use clientSecret if it is provided, otherwise we use
 *                                    thumbprint and privatePEMKey for the client assertion flow.
 *                          (2) must be a string
 *                          (3) Description:
 *                          The app key of your app from AAD.
 *                          NOTE: For B2C, the app key sometimes contains '\', please replace '\' with '\\' in the app key, otherwise
 *                          '\' will be treated as the beginning of a escaping character
 *
 *   - `thumbprint`         (1) Required if you want to use client assertion to redeem an authorization code (non-B2C only)
 *                          (2) must be a base64url encoded string
 *                          (3) Description:
 *                          The thumbprint (hash value) of the public key
 *
 *   - `privatePEMKey`      (1) Required if you want to use client assertion to redeem an authorization code (non-B2C only)
 *                          (2) must be a pem key
 *                          (3) Description:
 *                          The private key used to sign the client assertion JWT
 *
 *   - `isB2C`              (1) Required for B2C
 *                          (2) must be true for B2C, default is false
 *                          (3) Description:
 *                          set to true if you are using B2C, default is false
 *
 *   - `validateIssuer`     (1) Required to set to false if you don't want to validate issuer, default is true
 *                          (2) Description:
 *                          For common endpoint, you should either set `validateIssuer` to false, or provide the `issuer`, since
 *                          we cannot grab the `issuer` value from metadata.
 *                          For non-common endpoint, we use the `issuer` from metadata, and `validateIssuer` should be always true
 *
 *   - `issuer`             (1) Required if you are using common endpoint and set `validateIssuer` to true, or if you want to specify the allowed issuers
 *                          (2) must be a string or an array of strings
 *                          (3) Description:
 *                          For common endpoint, we use the `issuer` provided.
 *                          For non-common endpoint, if the `issuer` is not provided, we use the issuer provided by metadata
 *
 *   - `passReqToCallback`  (1) Required to set true if you want to use the `function(req, token, done)` signature for the verify function, default is false
 *                          (2) Description:
 *                          Set `passReqToCallback` to true use the `function(req, token, done)` signature for the verify function
 *                          Set `passReqToCallback` to false use the `function(token, done)` signature for the verify function
 *
 *   - `useCookieInsteadOfSession`
 *                          (1) Required to set true if you don't want to use session. Default value is false.
 *                          (2) Description:
 *                          Passport-azure-ad needs to save state and nonce somewhere for validation purpose. If this option is set true, it will encrypt
 *                          state and nonce and put them into cookie. If this option is false, we save state and nonce in session.
 *
 *   - `cookieEncryptionKeys`
 *                          (1) Required if `useCookieInsteadOfSession` is true.
 *                          (2) Description:
 *                          This must be an array of key items. Each key item has the form { key: '...', iv: '...' }, where key is any string of length 32,
 *                          and iv is any string of length 12.
 *                          We always use the first key item with AES-256-GCM algorithm to encrypt cookie, but we will try every key item when we decrypt
 *                          cookie. This helps when you want to do key roll over.
 *
 *   - `cookieDomain`       (1) Optional
 *                          (2) must be a string
 *                          (3) Description:
 *                          The domain name of the cookie used to save state (see `useCookieInsteadOfSession`)
 *
 *   - `scope`              (1) Optional
 *                          (2) must be a string or an array of strings
 *                          (3) Description:
 *                          list of scope values indicating the required scope of the access token for accessing the requested
 *                          resource. Ex: ['email', 'profile'].
 *                          We send 'openid' by default. For B2C, we also send 'offline_access' (to get refresh_token) and
 *                          clientID (to get access_token) by default.
 *
 *   - `loggingLevel`       (1) Optional
 *                          (2) must be 'info', 'warn', 'error'
 *                          (3) Description:
 *                          logging level
 *
 *   - `loggingNoPII`       (1) Optional, default value is true
 *                          (2) Description:
 *                          If this is set to true, no personal information such as tokens and claims will be logged.
 *
 *   - `nonceLifetime`      (1) Optional
 *                          (2) must be a positive integer
 *                          (3) Description:
 *                          the lifetime of nonce in session or cookie, default value is NONCE_LIFE_TIME
 *
 *   - `nonceMaxAmount`     (1) Optional
 *                          (2) must be a positive integer
 *                          (3) Description:
 *                          the max amount of nonce in session or cookie, default value is NONCE_MAX_AMOUNT
 *
 *   - `clockSkew`          (1) Optional
 *                          (2) must be a positive integer
 *                          (3) Description:
 *                          the clock skew (in seconds) allowed in token validation, default value is CLOCK_SKEW
 * 
 *   - `proxy`              (1) Optional
 *                          (2) Description:
 *                          the configuration parameters for HttpsProxyAgent
 *
 * Examples:
 *
 * passport.use(new OIDCStrategy({
 *     identityMetadata: config.creds.identityMetadata,
 *     clientID: config.creds.clientID,
 *     responseType: config.creds.responseType,
 *     responseMode: config.creds.responseMode
 *     redirectUrl: config.creds.redirectUrl,
 *     allowHttpForRedirectUrl: config.creds.allowHttpForRedirectUrl,
 *     clientSecret: config.creds.clientSecret,
 *     thumbprint: config.creds.thumbprint,
 *     privatePEMKey: config.crecs.privatePEMKey,
 *     isB2C: config.creds.isB2C,
 *     validateIssuer: config.creds.validateIssuer,
 *     issuer: config.creds.issuer,
 *     scope: config.creds.scopes,
 *     passReqToCallback: config.creds.passReqToCallback,
 *     loggingLevel: config.creds.loggingLevel,
 *     loggingNoPII: config.creds.loggingNoPII,
 *     nonceLifetime: config.creds.nonceLifetime,
 *     useCookieInsteadOfSession: config.creds.useCookieInsteadOfSession,
 *     cookieEncryptionKeys: config.creds.cookieEncryptionKeys,
 *     cookieSameSite: boolean
 *   },
 *   function(token, done) {
 *     User.findById(token.sub, function (err, user) {
 *       if (err) { return done(err); }
 *       if (!user) { return done(null, false); }
 *       return done(null, user, token);
 *     });
 *   }
 * ));
 *
 * For further details on HTTP Bearer authentication, refer to [The OAuth 2.0 Authorization Protocol: Bearer Tokens](http://tools.ietf.org/html/draft-ietf-oauth-v2-bearer)
 * For further details on JSON Web Token, refert to [JSON Web Token](http://tools.ietf.org/html/draft-ietf-oauth-json-web-token)
 *
 * @param {object} options - The Options.
 * @param {Function} verify - The verify callback.
 * @constructor
 */
function Strategy(options, verify) {
  passport.Strategy.call(this);

  /*
   *  Caution when you want to change these values in the member functions of
   *  Strategy, don't use `this`, since `this` points to a subclass of `Strategy`.
   *  To get `Strategy`, use Object.getPrototypeOf(this).
   *
   *  More comments at the beginning of `Strategy.prototype.authenticate`.
   */
  this._options = options;
  this.name = "azuread-openidconnect";

  // stuff related to the verify function
  this._verify = verify;
  this._passReqToCallback = !!options.passReqToCallback;

  if (options.useCookieInsteadOfSession === true)
    this._useCookieInsteadOfSession = true;
  else
    this._useCookieInsteadOfSession = false;

  if (!this._useCookieInsteadOfSession) {
    /*
     * For each microsoft login page tab, we generate a {state, nonce, policy, timeStamp} tuple,
     * normally user won't keep opening microsoft login page in new tabs without putting their
     * password for more than 10 tabs, so we only keep the most recent 10 tuples in session.
     * The lifetime of each tuple is 60 minutes or user specified.
     */
    this._sessionContentHandler = new SessionContentHandler(options.nonceMaxAmount || NONCE_MAX_AMOUNT, options.nonceLifetime || NONCE_LIFE_TIME);
  } else {
    this._cookieContentHandler = new CookieContentHandler(
      options.nonceMaxAmount || NONCE_MAX_AMOUNT,
      options.nonceLifetime || NONCE_LIFE_TIME,
      options.cookieEncryptionKeys,
      options.cookieDomain,
      !!options.cookieSameSite
    );
  }

  /*
   * When a user is authenticated for the first time, passport adds a new field
   * to req.session called 'passport', and puts a 'user' property inside (or your
   * choice of field name and property name if you change passport._key and
   * passport._userProperty values). req.session['passport']['user'] is usually
   * user_id (or something similar) of the authenticated user to reduce the size
   * of session. When the user logs out, req.session['passport']['user'] will be
   * destroyed. Any request between login (when authenticated for the first time)
   * and logout will have the 'user_id' in req.session['passport']['user'], so
   * passport can fetch it, find the user object in database and put the user
   * object into a new field: req.user. Then the subsequent middlewares and the
   * app can use the user object. This is how passport keeps user authenticated.
   *
   * For state validation, we also take advantage of req.session. we create a new
   * field: req.session[sessionKey], where the sessionKey is our choice (in fact,
   * this._key, see below). When we send a request with state, we put state into
   * req.session[sessionKey].state; when we expect a request with state in query
   * or body, we compare the state in query/body with the one stored in
   * req.session[sessionKey].state, and then destroy req.session[sessionKey].state.
   * User can provide a state by using `authenticate(Strategy, {state: 'xxx'})`, or
   * one will be generated automatically. This is essentially how passport-oauth2
   * library does the state validation, and we use the same way in our library.
   *
   * request structure will look like the following. In real request some fields
   * might not be there depending on the purpose of the request.
   *
   *    request ---|--- sessionID
   *               |--- session --- |--- ...
   *               |                |--- 'passport' ---| --- 'user': 'user_id etc'
   *               |                |---  sessionKey---| --- state: 'xxx'
   *               |--- ...
   *               |--- 'user':  full user info
   */
  this._key = options.sessionKey || ("OIDC: " + options.clientID);

  if (!options.identityMetadata) {
    // default value should be https://login.microsoftonline.com/common/.well-known/openid-configuration
    log.error("OIDCStrategy requires a metadata location that contains cert data for RSA and ECDSA callback.");
    throw new TypeError("OIDCStrategy requires a metadata location that contains cert data for RSA and ECDSA callback.");
  }

  // if logging level specified, switch to it.
  if (options.loggingLevel) { log.levels("console", options.loggingLevel); }
  this.log = log;

  if (options.loggingNoPII !== false)
    options.loggingNoPII = true;

  // clock skew. Must be a postive integer
  if (options.clockSkew && (typeof options.clockSkew !== "number" || options.clockSkew <= 0 || options.clockSkew % 1 !== 0))
    throw new Error("clockSkew must be a positive integer");
  if (!options.clockSkew)
    options.clockSkew = CONSTANTS.CLOCK_SKEW;

  /**
   * Take care of identityMetadata
   * (1) Check if it is common endpoint
   * (2) For B2C, one cannot use the common endpoint. tenant name or guid must be specified
   * (3) We add telemetry to identityMetadata automatically
   */

  // check existence
  if (!options.identityMetadata) {
    log.error("OIDCStrategy requires a metadata location that contains cert data for RSA and ECDSA callback.");
    throw new TypeError("OIDCStrategy requires a metadata location that contains cert data for RSA and ECDSA callback.");
  }

  // check if we are using the common endpoint
  options.isCommonEndpoint = (options.identityMetadata.indexOf("/common/") !== -1);

  // isB2C is false by default
  if (options.isB2C !== true)
    options.isB2C = false;

  // add telemetry
  options.identityMetadata = aadutils.concatUrl(
    options.identityMetadata,
    [
      `${aadutils.getLibraryProductParameterName()}=${aadutils.getLibraryProduct()}`,
      `${aadutils.getLibraryVersionParameterName()}=${aadutils.getLibraryVersion()}`
    ]
  );

  /**
   * Take care of issuer and audience
   * (1) We use user provided `issuer`, and the issuer value from metadata if the metadata
   *     comes from tenant-specific endpoint (in other words, either the identityMetadata
   *     is tenant-specific, or it is common but you provide tenantIdOrName in
   *     passport.authenticate).
   *
   *     For common endpoint, if `issuer` is not provided by user, and `tenantIdOrName` is
   *     not used in passport.authenticate, then we don't know the issuer, and `validateIssuer`
   *     must be set to false
   * (2) `validateIssuer` is true by default. we validate issuer unless validateIssuer is set false
   * (3) `audience` must be the clientID of this app
   */
  if (options.validateIssuer !== false)
    options.validateIssuer = true;
  if (!options.validateIssuer)
    log.warn("Production environments should always validate the issuer.");

  if (options.issuer === "")
    options.issuer = null;
  // make issuer an array
  if (options.issuer && !Array.isArray(options.issuer))
    options.issuer = [options.issuer];

  options.audience = options.clientID;
  options.allowMultiAudiencesInToken = false;

  /**
   * Take care of scope
   */

  // make scope an array
  if (!options.scope)
    options.scope = [];
  if (!Array.isArray(options.scope))
    options.scope = [options.scope];
  // always have 'openid' scope for openID Connect
  if (options.scope.indexOf("openid") === -1)
    options.scope.push("openid");
  options.scope = options.scope.join(" ");

  /**
   * Check if we are using v2 endpoint, v2 doesn't have an userinfo endpoint
   */
  if (options.identityMetadata.indexOf("/v2.0/") !== -1)
    options._isV2 = true;

  /**
   * validate other necessary option items provided, we validate them here and only once
   */

  // change responseType 'id_token code' to 'code id_token' since the former is not supported by B2C
  if (options.responseType === "id_token code")
    options.responseType = "code id_token";

  const itemsToValidate = {};
  aadutils.copyObjectFields(options, itemsToValidate, ["clientID", "redirectUrl", "responseType", "responseMode", "identityMetadata"]);

  const validatorConfiguration = {
    clientID: Validator.isNonEmpty,
    responseType: Validator.isTypeLegal,
    responseMode: Validator.isModeLegal,
    identityMetadata: Validator.isHttpsURL
  };

  // redirectUrl is https by default
  if (options.allowHttpForRedirectUrl === true)
    validatorConfiguration.redirectUrl = Validator.isURL;
  else
    validatorConfiguration.redirectUrl = Validator.isHttpsURL;

  // validator will throw exception if a required option is missing
  const validator = new Validator(validatorConfiguration);
  validator.validate(itemsToValidate);

  // validate client secret, thumbprint and privatePEMKey for hybrid and authorization flow
  if (options.responseType !== "id_token") {
    if (options.isB2C && !options.clientSecret) {
      // for B2C, clientSecret is required to redeem authorization code.
      throw new Error("clientSecret must be provided for B2C hybrid flow and authorization code flow.");
    } else if (!options.clientSecret) {
      /**
       * for non-B2C, we can use either clientSecret or clientAssertion to redeem authorization code.
       * Therefore, we need either clientSecret, or privatePEMKey and thumbprint (so we can create clientAssertion).
       */
      if (!options.privatePEMKey)
        throw new Error("privatePEMKey is not provided. Please provide either clientSecret, or privatePEMKey and thumbprint.");
      if (!options.thumbprint)
        throw new Error("thumbprint is not provided. Please provide either clientSecret, or privatePEMKey and thumbprint.");
    }
  }

  // we allow 'http' for the redirectUrl, but don't recommend using 'http'
  if (urlValidator.isHttpUri(options.redirectUrl))
    log.warn("Using http for redirectUrl is not recommended, please consider using https");
}

// Inherit from `passport.Strategy`.
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate request by delegating to an OpenID Connect provider.
 *
 * @param {Object} req
 * @param {Object} options
 * @api protected
 */
Strategy.prototype.authenticate = function authenticateStrategy(req, options) {
  /*
   * We should be careful using 'this'. Avoid the usage like `this.xxx = ...`
   * unless you know what you are doing.
   *
   * In the passport source code
   * (https://github.com/jaredhanson/passport/blob/master/lib/middleware/authenticate.js)
   * when it attempts to call the `oidcstrategy.authenticate` function, passport
   * creates an instance inherting oidcstrategy and then calls `instance.authenticate`.
   * Therefore, when we come here, `this` is the instance, its prototype is the
   * actual oidcstrategy, i.e. the `Strategy`. This means:
   * (1) `this._options = `, `this._verify = `, etc only adds new fields to the
   *      instance, it doesn't change the values in oidcstrategy, i.e. `Strategy`.
   * (2) `this._options`, `this._verify`, etc returns the field in the instance,
   *     and if there is none, returns the field in oidcstrategy, i.e. `strategy`.
   * (3) each time we call `authenticate`, we will get a brand new instance
   *
   * If you want to change the values in `Strategy`, use
   *      const oidcstrategy = Object.getPrototypeOf(self);
   * to get the strategy first.
   *
   * Note: Simply do `const self = Object.getPrototypeOf(this)` and use `self`
   * won't work, since the `this` instance has a couple of functions like
   * success/fail/error... which `authenticate` will call. The following is the
   * structure of `this`:
   *
   *   this
   *   | --  success:  function(user, info)
   *   | --  fail:     function(challenge, status)
   *   | --  redirect: function(url, status)
   *   | --  pass:     function()
   *   | --  __proto__:  Strategy
   *                 | --  _verify
   *                 | --  _options
   *                 | --  ...
   *                 | --  __proto__:
   *                              | --  authenticate:  function(req, options)
   *                              | --  ...
   */
  const self = this;

  const resource = options && options.resourceURL;
  const customState = options && options.customState;
  const tenantIdOrName = options && options.tenantIdOrName;
  const login_hint = options && options.login_hint;
  const domain_hint = options && options.domain_hint;
  const prompt = options && options.prompt;
  const extraAuthReqQueryParams = options && options.extraAuthReqQueryParams;
  const extraTokenReqQueryParams = options && options.extraTokenReqQueryParams;
  const response = options && options.response || req.res;

  // 'params': items we get from the request or metadata, such as id_token, code, policy, metadata, cacheKey, etc
  const params = { "proxy": self._options.proxy, "tenantIdOrName": tenantIdOrName, "extraAuthReqQueryParams": extraAuthReqQueryParams, "extraTokenReqQueryParams": extraTokenReqQueryParams };
  // 'oauthConfig': items needed for oauth flow (like redirection, code redemption), such as token_endpoint, userinfo_endpoint, etc
  const oauthConfig = { "proxy": self._options.proxy, "resource": resource, "customState": customState, "domain_hint": domain_hint, "login_hint": login_hint, "prompt": prompt, "response": response };
  // 'optionsToValidate': items we need to validate id_token against, such as issuer, audience, etc
  const optionsToValidate = {};

  async.waterfall(
    [
      /**
       * Step 1. Collect information from the req and save the info into params
       */
      (next) => {
        return self.collectInfoFromReq(params, req, next, response);
      },

      /**
       * Step 2. Load metadata, use the information from 'params' and 'self._options'
       * to configure 'oauthConfig' and 'optionsToValidate'
       */
      (next) => {
        return self.setOptions(params, oauthConfig, optionsToValidate, next);
      },

      /**
       * Step 3. Handle the flows
       * (1) implicit flow (response_type = 'id_token')
       *     This case we get a 'id_token'
       * (2) hybrid flow (response_type = 'id_token code')
       *     This case we get both 'id_token' and 'code'
       * (3) authorization code flow (response_type = 'code')
       *     This case we get a 'code', we will use it to get 'access_token' and 'id_token'
       * (4) for any other request, we will ask for authorization and initialize
       *     the authorization process
       */
      (next) => {
        if (params.err) {
          // handle the error
          return self._errorResponseHandler(params.err, params.err_description, next);
        } else if (!params.id_token && !params.code) {
          // ask for authorization, initialize the authorization process
          return self._flowInitializationHandler(oauthConfig, req, next);
        } else if (params.id_token && params.code) {
          // handle hybrid flow
          return self._hybridFlowHandler(params, oauthConfig, optionsToValidate, req, next);
        } else if (params.id_token) {
          // handle implicit flow
          return self._implicitFlowHandler(params, optionsToValidate, req, next);
        } else {
          // handle authorization code flow
          return self._authCodeFlowHandler(params, oauthConfig, optionsToValidate, req, next);
        }
      }
    ],

    (waterfallError) => {
      // this code gets called after the three steps above are done
      if (waterfallError) {
        return self.failWithLog(`${aadutils.getErrorMessage(waterfallError)}`);
      }
      return true;
    });
};

/**
 * Collect information from the request, for instance, code, err, id_token etc
 *
 * @param {Object} params
 * @param {Object} req
 * @param {Object} next
 */
Strategy.prototype.collectInfoFromReq = function (params, req, next, response) {
  const self = this;

  /*
   * the things we will put into 'params':
   * err, err_description, id_token, code, policy, state, nonce, cachekey, metadata
   */

  /*
   * we shouldn't get any access_token or refresh_token from the request
   */
  if ((req.query && (req.query.access_token || req.query.refresh_token)) ||
    (req.body && (req.body.access_token || req.body.refresh_token)))
    return next(new Error("In collectInfoFromReq: neither access token nor refresh token is expected in the incoming request"));

  /*
   * we might get err, id_token, code, state from the request
   */
  let source = null;

  if (req.query && (req.query.error || req.query.id_token || req.query.code))
    source = req.query;
  else if (req.body && (req.body.error || req.body.id_token || req.body.code))
    source = req.body;

  if (source) {
    params.err = source.error;
    params.err_description = source.error_description;
    params.id_token = source.id_token;
    params.code = source.code;
    params.state = source.state;
    if (source.state && source.state.length >= 38) {
      /*
       * the random generated state always has 32 characters. This state is longer than 32
       * so it must be a custom state. We added 'CUSTOM' prefix and a random 32 byte long
       * string in front of the original custom state, now we change it back.
       */
      if (!source.state.startsWith("CUSTOM"))
        return next(new Error(`In collectInfoFromReq: invalid custom state ${source.state}`));

      source.state = source.state.substring(38);
    }
  }

  /*
   * If we received code, id_token or err, we must have received state, now we
   * find the state/nonce/policy tuple from session.
   * If we received none of them, find policy in query
   */
  if (params.id_token || params.code || params.err) {
    if (!params.state)
      return next(new Error("In collectInfoFromReq: missing state in the request"));

    let tuple;

    if (!self._useCookieInsteadOfSession)
      tuple = self._sessionContentHandler.findAndDeleteTupleByState(req, self._key, params.state);
    else
      tuple = self._cookieContentHandler.findAndDeleteTupleByState(req, response, params.state);

    if (!tuple)
      return next(new Error("In collectInfoFromReq: invalid state received in the request"));

    params.nonce = tuple["nonce"];
    params.policy = tuple["policy"];
    params.resource = tuple["resource"];

    // user provided tenantIdOrName will be ignored for redirectUrl, since we saved the one we used in session
    if (params.tenantIdOrName) {
      if (self._options.loggingNoPII)
        log.info("user provided tenantIdOrName is ignored for redirectUrl, we will use the one stored in session");
      else
        log.info(`user provided tenantIdOrName '${params.tenantIdOrName}' is ignored for redirectUrl, we will use the one stored in session`);
    }
    params.tenantIdOrName = tuple["tenantIdOrName"];
  } else {
    params.policy = req.query.p ? req.query.p.toLowerCase() : null;
  }

  // if we are not using the common endpoint, but we have tenantIdOrName, just ignore it
  if (!self._options.isCommonEndpoint && params.tenantIdOrName) {
    if (self._options.loggingNoPII)
      log.info("identityMetadata is tenant-specific, so we ignore the tenantIdOrName provided");
    else
      log.info(`identityMetadata is tenant-specific, so we ignore the tenantIdOrName '${params.tenantIdOrName}'`);
    params.tenantIdOrName = null;
  }

  /*
   * if we are using the common endpoint and we want to validate issuer, then user has to
   * provide issuer in config, or provide tenant id or name using tenantIdOrName option in
   * passport.authenticate. Otherwise we won't know the issuer.
   */
  if (self._options.isCommonEndpoint && self._options.validateIssuer &&
    (!self._options.issuer && !params.tenantIdOrName))
    return next(new Error("In collectInfoFromReq: issuer or tenantIdOrName must be provided in order to validate issuer on common endpoint"));

  // for B2C, we must have policy
  if (self._options.isB2C && !params.policy)
    return next(new Error("In collectInfoFromReq: policy is missing"));
  // for B2C, if we are using common endpoint, we must have tenantIdOrName provided
  if (self._options.isB2C && self._options.isCommonEndpoint && !params.tenantIdOrName)
    return next(new Error("In collectInfoFromReq: we are using common endpoint for B2C but tenantIdOrName is not provided"));

  /*
   * calculate metadataUrl, create a cachekey and an Metadata object instance
   * we will fetch the metadata, save it into the object using the cachekey
   */
  let metadataUrl = self._options.identityMetadata;

  // if we are using common endpoint and we are given the tenantIdOrName, let's replace it
  if (self._options.isCommonEndpoint && params.tenantIdOrName) {
    metadataUrl = metadataUrl.replace("/common/", `/${params.tenantIdOrName}/`);
    if (self._options.loggingNoPII)
      log.info("we are replacing 'common' with the tenantIdOrName provided");
    else
      log.info(`we are replacing 'common' with the tenantIdOrName ${params.tenantIdOrName}`);
  }

  // add policy for B2C
  if (self._options.isB2C)
    metadataUrl = metadataUrl.concat(`&p=${params.policy}`);

  // we use the metadataUrl as the cachekey
  params.cachekey = metadataUrl;
  params.metadata = new Metadata(metadataUrl, "oidc", self._options);

  if (!self._options.loggingNoPII) {
    log.info(`metadataUrl is: ${metadataUrl}`);
    log.info(`received the following items in params: ${JSON.stringify(params)}`);
  }

  return next();
};

/**
 * Set the information we need for oauth flow and id_token validation
 *
 * @param {Object} params             -- parameters we get from the request
 * @param {Object} oauthConfig        -- the items we need for oauth flow
 * @param {Object} optionsToValidate  -- the items we need to validate id_token
 * @param {Function} done             -- the callback
 */
Strategy.prototype.setOptions = function setOptions(params, oauthConfig, optionsToValidate, done) {
  const self = this;

  async.waterfall([
    /*
     * load metadata
     */
    (next) => {
      memoryCache.wrap(params.cachekey, (cacheCallback) => {
        params.metadata.fetch((fetchMetadataError) => {
          if (fetchMetadataError) {
            return cacheCallback(fetchMetadataError);
          }
          return cacheCallback(null, params.metadata);
        });
      }, { ttl }, next);
    },

    /*
     * set oauthConfig: the information we need for oauth flow like redeeming code/access_token
     */
    (metadata, next) => {
      if (!metadata.oidc)
        return next(new Error("In setOptions: failed to load metadata"));
      params.metadata = metadata;

      // copy the fields needed into 'oauthConfig'
      aadutils.copyObjectFields(metadata.oidc, oauthConfig, ["authorization_endpoint", "token_endpoint", "userinfo_endpoint"]);
      aadutils.copyObjectFields(self._options, oauthConfig, ["clientID", "clientSecret", "privatePEMKey", "thumbprint", "responseType", "responseMode", "scope", "redirectUrl"]);
      oauthConfig.tenantIdOrName = params.tenantIdOrName;
      oauthConfig.extraAuthReqQueryParams = params.extraAuthReqQueryParams;
      oauthConfig.extraTokenReqQueryParams = params.extraTokenReqQueryParams;

      // validate oauthConfig
      const validatorConfig = {
        authorization_endpoint: Validator.isHttpsURL,
        token_endpoint: Validator.isHttpsURL,
        userinfo_endpoint: Validator.isHttpsURLIfExists,
      };

      try {
        // validator will throw exception if a required option is missing
        const checker = new Validator(validatorConfig);
        checker.validate(oauthConfig);
      } catch (ex) {
        return next(new Error(`In setOptions: ${aadutils.getErrorMessage(ex)}`));
      }

      // for B2C, verify the endpoints in oauthConfig has the correct policy
      if (self._options.isB2C) {
        const policyChecker = (endpoint, policy) => {
          let u = {};
          u = url.parse(endpoint);
          return u.pathname && _.includes(u.path, policy.toLowerCase());
        };
        // B2C has no userinfo_endpoint, so no need to check it
        if (!policyChecker(oauthConfig.authorization_endpoint, params.policy)) {
          if (self._options.loggingNoPII)
            return next(new Error("invalid policy"));
          else
            return next(new Error(`policy in ${oauthConfig.authorization_endpoint} should be ${params.policy}`));
        }
        if (!policyChecker(oauthConfig.token_endpoint, params.policy)) {
          if (self._options.loggingNoPII)
            return next(new Error("invalid policy"));
          else
            return next(new Error(`policy in ${oauthConfig.token_endpoint} should be ${params.policy}`));
        }
      }

      return next(null, metadata);
    },

    /*
     * set optionsToValidate: the information we need for id_token validation.
     * we do this only if params has id_token or code, otherwise there is no
     * id_token to validate
     */
    (metadata, next) => {
      if (!params.id_token && !params.code)
        return next(null);

      // set items from self._options
      aadutils.copyObjectFields(self._options, optionsToValidate,
        ["validateIssuer", "audience", "allowMultiAudiencesInToken", "ignoreExpiration", "allowMultiAudiencesInToken"]);

      // algorithms
      const algorithms = metadata.oidc.algorithms;
      if (!algorithms)
        return next(new Error("In setOptions: algorithms is missing in metadata"));
      if (!Array.isArray(algorithms) || algorithms.length === 0 || (algorithms.length === 1 && algorithms[0] === "none"))
        return next(new Error("In setOptions: algorithms must be an array containing at least one algorithm"));
      optionsToValidate.algorithms = algorithms;

      // nonce
      optionsToValidate.nonce = params.nonce;

      // clock skew
      optionsToValidate.clockSkew = self._options.clockSkew;

      // jweKeyStore
      optionsToValidate.jweKeyStore = self._options.jweKeyStore;

      /*
       * issuer
       * if the metadata is not coming from common endpoint, we record the issuer value from metadata
       */
      if (!self._options.isCommonEndpoint || (self._options.isCommonEndpoint && params.tenantIdOrName))
        optionsToValidate.issuer = [metadata.oidc.issuer];
      else
        optionsToValidate.issuer = [];
      // if user provided issuer, we also record these issuer values
      if (self._options.issuer)
        optionsToValidate.issuer = optionsToValidate.issuer.concat(self._options.issuer);
      // if we don't get any issuer value and we want to validate issuer, we should fail
      if (optionsToValidate.issuer.length === 0 && self._options.validateIssuer)
        return next(new Error("In setOptions: we want to validate issuer but issuer is not found"));

      return next(null);
    },
  ], done);
};

/**
 * validate id_token, and pass the validated claims and the payload to callback
 * if code (resp. access_token) is provided, we will validate the c_hash (resp at_hash) as well
 *
 * @param {String} params
 * @param {String} optionsToValidate
 * @param {Object} req
 * @param {Function} next  -- when error occurs, call next(err)
 * @param {Function} callback
 */
Strategy.prototype._idTokenHandler = function idTokenHandler(params, optionsToValidate, req, next, callback) {
  const self = this;

  const id_token = params.id_token;
  const parts = id_token.split(".");

  if (parts.length === 3)
    return self._validateResponse(params, optionsToValidate, req, next, callback);
  else if (parts.length === 5) {
    log.info("In _idTokenHandler: we received an id_token of JWE format, we are decrypting it");

    return jwe.decrypt(id_token, optionsToValidate.jweKeyStore, log, (err, decrypted_token) => {
      if (err)
        return next(err);

      params.id_token = decrypted_token;
      return self._validateResponse(params, optionsToValidate, req, next, callback);
    });
  } else
    return next(new Error(`id_token has ${parts.length} parts, it is neither jwe nor jws`));
};

/**
 * validate id_token, and pass the validated claims and the payload to callback
 * if code (resp. access_token) is provided, we will validate the c_hash (resp at_hash) as well
 *
 * @param {String} params
 * @param {String} optionsToValidate
 * @param {Object} req
 * @param {Function} next  -- when error occurs, call next(err)
 * @param {Function} callback
 */
Strategy.prototype._validateResponse = function validateResponse(params, optionsToValidate, req, next, callback) {
  const self = this;

  const id_token = params.id_token;
  const code = params.code;
  const access_token = params.access_token;

  // decode id_token
  const decoded = jws.decode(id_token);
  if (decoded === null)
    return next(new Error("In _validateResponse: Invalid JWT token"));

  if (self._options.loggingNoPII)
    log.info("token is decoded successfully");
  else
    log.info("token decoded: ", decoded);

  // get Pem Key
  let PEMkey = null;
  try {
    if (decoded.header.kid) {
      PEMkey = params.metadata.generateOidcPEM(decoded.header.kid);
    } else if (decoded.header.x5t) {
      PEMkey = params.metadata.generateOidcPEM(decoded.header.x5t);
    } else {
      return next(new Error("In _validateResponse: We did not receive a token we know how to validate"));
    }
  } catch (error) {
    return next(new Error("In _validateResponse: failed to generate PEM key due to: " + error.message));
  }

  if (self._options.loggingNoPII)
    log.info("PEMkey is generated");
  else
    log.info("PEMkey generated: " + PEMkey);

  // verify id_token signature and claims
  return jwt.verify(id_token, PEMkey, optionsToValidate, (err, jwtClaims) => {
    if (err)
      return next(new Error(`In _validateResponse: ${aadutils.getErrorMessage(err)}`));

    if (self._options.loggingNoPII)
      log.info("claims are received");
    else
      log.info("Claims received: ", jwtClaims);

    /*
     * jwt checks the 'nbf', 'exp', 'aud', 'iss' claims
     * there are a few other things we will check below
     */

    // For B2C, check the policy
    if (self._options.isB2C) {
      let policy_in_idToken;

      if (jwtClaims.acr && CONSTANTS.POLICY_REGEX.test(jwtClaims.acr))
        policy_in_idToken = jwtClaims.acr;
      else if (jwtClaims.tfp && CONSTANTS.POLICY_REGEX.test(jwtClaims.tfp))
        policy_in_idToken = jwtClaims.tfp.toLowerCase();
      else
        return next(new Error("In _validateResponse: invalid B2C policy in id_token"));

      if (params.policy !== policy_in_idToken)
        return next(new Error("In _validateResponse: policy in id_token does not match the policy used"));
    }

    // check nonce
    if (!jwtClaims.nonce || jwtClaims.nonce === "" || jwtClaims.nonce !== optionsToValidate.nonce)
      return next(new Error("In _validateResponse: invalid nonce"));

    // check c_hash
    if (jwtClaims.c_hash) {
      // checkHashValueRS256 checks if code is null, so we don't bother here
      if (!aadutils.checkHashValueRS256(code, jwtClaims.c_hash))
        return next(new Error("In _validateResponse: invalid c_hash"));
    }

    // check at_hash
    if (jwtClaims.at_hash) {
      // checkHashValueRS256 checks if access_token is null, so we don't bother here
      if (!aadutils.checkHashValueRS256(access_token, jwtClaims.at_hash))
        return next(new Error("In _validateResponse: invalid at_hash"));
    }

    // return jwt claims and jwt claims string
    const idTokenSegments = id_token.split(".");
    const jwtClaimsStr = base64url.decode(idTokenSegments[1]);
    return callback(jwtClaimsStr, jwtClaims);
  });
};

/**
 * handle error response
 *
 * @params {String} err
 * @params {String} err_description
 * @params {Function} next  -- callback to pass error to async.waterfall
 */
Strategy.prototype._errorResponseHandler = function errorResponseHandler(err, err_description, next) {
  const self = this;

  log.info("Error received in the response was: ", err);
  if (err_description && !self._options.loggingNoPII)
    log.info("Error description received in the response was: ", err_description);

  /*
   * Unfortunately, we cannot return the 'error description' to the user, since
   * it goes to http header by default and it usually contains characters that
   * http header doesn't like, which causes the program to crash.
   */
  return next(new Error(err));
};

/**
 * handle the response where we only get 'id_token' in the response
 *
 * @params {Object} params
 * @params {Object} optionsToValidate
 * @params {Object} req
 * @params {Function} next  -- callback to pass error to async.waterfall
 */
Strategy.prototype._implicitFlowHandler = function implicitFlowHandler(params, optionsToValidate, req, next) {
  /*
   * we will do the following things in order
   * (1) validate id_token
   * (2) use the claims in the id_token for user's profile
   */

  const self = this;

  if (self._options.loggingNoPII)
    log.info("entering Strategy.prototype._implicitFlowHandler");
  else
    log.info("entering Strategy.prototype._implicitFlowHandler, received id_token: " + params.id_token);

  // validate the id_token
  return self._idTokenHandler(params, optionsToValidate, req, next, (jwtClaimsStr, jwtClaims) => {
    const sub = jwtClaims.sub;
    const iss = jwtClaims.iss;

    log.info("we are in implicit flow, use the content in id_token as the profile");

    return onProfileLoaded(self, {
      req,
      sub,
      iss,
      profile: makeProfileObject(jwtClaims, jwtClaimsStr),
      jwtClaims,
      access_token: null,
      refresh_token: null,
      params: null
    });
  });
};

/**
 * handle the response where we get 'id_token' and 'code' in the response
 *
 * @params {Object} params
 * @params {Object} oauthConfig
 * @params {Object} optionsToValidate
 * @params {Object} req
 * @params {Function} next  -- callback to pass error to async.waterfall
 */
Strategy.prototype._hybridFlowHandler = function hybridFlowHandler(params, oauthConfig, optionsToValidate, req, next) {
  /*
   * we will do the following things in order
   * (1) validate the id_token and the code
   * (2) if there is no userinfo token needed (or ignored if using AAD v2 ), we use
   *     the claims in id_token for user's profile
   * (3) if userinfo token is needed, we will use the 'code' and the authorization code flow
   */
  const self = this;

  if (self._options.loggingNoPII)
    log.info("entering Strategy.prototype._hybridFlowHandler");
  else
    log.info("entering Strategy.prototype._hybridFlowHandler, received code: " + params.code + ", received id_token: " + params.id_token);

  /*
   * save nonce, since if we use the authorization code flow later, we have to check
   * nonce again.
   */

  // validate the id_token and the code
  return self._idTokenHandler(params, optionsToValidate, req, next, (jwtClaimsStr, jwtClaims) => {
    /*
     * c_hash is required for 'code id_token' flow. If we have c_hash, then _validateResponse already
     * validates it; otherwise, _validateResponse ignores the c_hash check, and we check here
     */
    if (!jwtClaims.c_hash)
      return next(new Error("In _hybridFlowHandler: we are in hybrid flow using code id_token, but c_hash is not found in id_token"));

    const sub = jwtClaims.sub;
    const iss = jwtClaims.iss;

    // now we use the authorization code flow
    return self._authCodeFlowHandler(params, oauthConfig, optionsToValidate, req, next, iss, sub);
  });
};

/**
 * handle the response where we only get 'code' in the response
 *
 * @params {Object} params
 * @params {Object} oauthConfig
 * @params {Object} optionsToValidate
 * @params {Object} req
 * @params {Function} next  -- callback to pass error to async.waterfall
 * // the following are required if you used 'code id_token' flow then call this function to
 * // redeem the code for another id_token from the token endpoint. iss and sub are those
 * // in the id_token from authorization endpoint, and they should match those in the id_token
 * // from the token endpoint
 * @params {String} iss
 * @params {String} sub
 */
Strategy.prototype._authCodeFlowHandler = function authCodeFlowHandler(params, oauthConfig, optionsToValidate, req, next, iss, sub) {
  /*
   * we will do the following things in order:
   * (1) use code to get id_token and access_token
   * (2) validate the id_token and the access_token received
   * (3) if user asks for userinfo and we are using AAD v1, then we use access_token to get
   *     userinfo, then make sure the userinfo has the same 'sub' as that in the 'id_token'
   */
  const self = this;
  const code = params.code;

  if (self._options.loggingNoPII)
    log.info("entering Strategy.prototype._authCodeFlowHandler");
  else
    log.info("entering Strategy.prototype._authCodeFlowHandler, received code: " + code);

  const issFromPrevIdToken = iss;
  const subFromPrevIdToken = sub;

  return self._getAccessTokenBySecretOrAssertion(code, oauthConfig, next, (getOAuthAccessTokenError, items) => {
    if (getOAuthAccessTokenError) {
      if (self._options.loggingNoPII)
        return next(new Error("In _authCodeFlowHandler: failed to redeem authorization code"));
      else
        return next(new Error(`In _authCodeFlowHandler: failed to redeem authorization code: ${aadutils.getErrorMessage(getOAuthAccessTokenError)}`));
    }

    const access_token = items.access_token;
    const refresh_token = items.refresh_token;

    // id_token should be present
    if (!items.id_token)
      return next(new Error("In _authCodeFlowHandler: id_token is not received"));

    // if we get access token, we must have token_type as well
    if (items.access_token && !items.token_type)
      return next(new Error("In _authCodeFlowHandler: token_type is missing"));

    // token_type must be 'Bearer' ignoring the case
    if (items.token_type && items.token_type.toLowerCase() !== "bearer") {
      log.info("token_type received is: ", items.token_type);
      return next(new Error("In _authCodeFlowHandler: token_type received is not 'Bearer' ignoring the case"));
    }

    if (!self._options.loggingNoPII) {
      log.info("received id_token: ", items.id_token);
      log.info("received access_token: ", access_token);
      log.info("received refresh_token: ", refresh_token);
    }

    // validate id_token and access_token, so put them into params
    params.access_token = access_token;
    params.id_token = items.id_token;

    return self._idTokenHandler(params, optionsToValidate, req, next, (jwtClaimsStr, jwtClaims) => {
      /*
       * for 'code id_token' flow, check iss/sub in the id_token from the authorization endpoint
       * with those in the id_token from token endpoint
       */
      if (issFromPrevIdToken && issFromPrevIdToken !== jwtClaims.iss)
        return next(new Error("In _authCodeFlowHandler: After redeeming the code, iss in id_token from authorize_endpoint does not match iss in id_token from token_endpoint"));
      if (subFromPrevIdToken && subFromPrevIdToken !== jwtClaims.sub)
        return next(new Error("In _authCodeFlowHandler: After redeeming the code, sub in id_token from authorize_endpoint does not match sub in id_token from token_endpoint"));

      const sub = jwtClaims.sub;
      const iss = jwtClaims.iss;

      /*
       * load the userinfo, if this is not v2 and if we don't specify the resource
       * for v1 if we don't specify the resource, then the access_token we got is for userinfo endpoint, so we can use it to get userinfo
       */
      if (!self._options._isV2 && !params.resource) {
        // make sure we get an access_token
        if (!access_token)
          return next(new Error("In _authCodeFlowHandler: we want to access userinfo endpoint, but access_token is not received"));

        let parsedUrl;
        try {
          parsedUrl = url.parse(oauthConfig.userinfo_endpoint, true);
        } catch (urlParseException) {
          if (self._options.loggingNoPII)
            return next(new Error("In _authCodeFlowHandler: Failed to parse config property 'userInfoUrl'"));
          else
            return next(new Error(`In _authCodeFlowHandler: Failed to parse config property 'userInfoURL' with value ${oauthConfig.userinfo_endpoint}`));
        }

        parsedUrl.query.schema = "openid";
        delete parsedUrl.search; // delete operations are slow; should we rather just overwrite it with {}
        const userInfoURL = url.format(parsedUrl);

        // ask oauth2 to use authorization header to bearer access token
        const oauth2 = createOauth2Instance(oauthConfig);
        oauth2.useAuthorizationHeaderforGET(true);
        return oauth2.get(userInfoURL, access_token, (getUserInfoError, body) => {
          if (getUserInfoError) {
            if (self._options.loggingNoPII)
              return next(new Error("In _authCodeFlowHandler: failed to fetch user profile"));
            else
              return next(new Error(`In _authCodeFlowHandler: failed to fetch user profile: ${aadutils.getErrorMessage(getUserInfoError)}`));
          }

          if (self._options.loggingNoPII)
            log.info("Profile is loaded from MS identity");
          else
            log.info("Profile loaded from MS identity", body);

          let userinfoReceived = null;
          // use try / catch around JSON.parse --> could fail unexpectedly
          try {
            userinfoReceived = JSON.parse(body);
          } catch (ex) {
            if (self._options.loggingNoPII)
              return next(new Error("In _authCodeFlowHandler: failed to parse userinfo"));
            else
              return next(new Error(`In _authCodeFlowHandler: failed to parse userinfo ${body}, due to ${aadutils.getErrorMessage(ex)}`));
          }

          // make sure the 'sub' in userinfo is the same as the one in 'id_token'
          if (userinfoReceived.sub !== jwtClaims.sub)
            return next(new Error("In _authCodeFlowHandler: sub received in userinfo and id_token do not match"));

          return onProfileLoaded(self, {
            req,
            sub,
            iss,
            profile: makeProfileObject(userinfoReceived, body),
            jwtClaims,
            access_token,
            refresh_token,
            params: items,
          });
        });
      } else {
        // v2 doesn't have userinfo endpoint, so we use the content in id_token as the profile
        log.info("v2 has no userinfo endpoint, using the content in id_token as the profile");

        return onProfileLoaded(self, {
          req,
          sub,
          iss,
          profile: makeProfileObject(jwtClaims, jwtClaimsStr),
          jwtClaims,
          access_token,
          refresh_token,
          params: items,
        });
      }
    });
  });
};

/**
 * prepare the initial authorization request
 *
 * @params {Object} oauthConfig
 * @params {Object} req
 * @params {Function} next  -- callback to pass error to async.waterfall
 */
Strategy.prototype._flowInitializationHandler = function flowInitializationHandler(oauthConfig, req, next) {
  /*
   * The request being authenticated is initiating OpenID Connect
   * authentication. Prior to redirecting to the provider, configuration will
   * be loaded. The configuration is typically either pre-configured or
   * discovered dynamically. When using dynamic discovery, a user supplies
   * their identifer as input.
   */

  const self = this;

  log.info("entering Strategy.prototype._flowInitializationHandler");

  const params = {
    "redirect_uri": oauthConfig.redirectUrl,
    "response_type": oauthConfig.responseType,
    "response_mode": oauthConfig.responseMode,
    "client_id": oauthConfig.clientID
  };

  log.info("We are sending the response_type: ", params.response_type);
  log.info("We are sending the response_mode: ", params.response_mode);

  if (oauthConfig.domain_hint)
    params["domain_hint"] = oauthConfig.domain_hint;
  if (oauthConfig.login_hint)
    params["login_hint"] = oauthConfig.login_hint;
  if (oauthConfig.prompt)
    params["prompt"] = oauthConfig.prompt;
  if (oauthConfig.extraAuthReqQueryParams) {
    // copy the extra query parameters into params
    for (const attributeName in oauthConfig.extraAuthReqQueryParams) {
      if (Object.prototype.hasOwnProperty.call(oauthConfig.extraAuthReqQueryParams, attributeName))
        params[attributeName] = oauthConfig.extraAuthReqQueryParams[attributeName];
    }
  }

  let policy = null;
  if (self._options.isB2C) {
    if (!req.query.p || req.query.p === "")
      return next(new Error("In _flowInitializationHandler: missing policy in the request for B2C"));
    // policy is not case sensitive. AAD turns policy to lower case.
    policy = req.query.p.toLowerCase();
    if (!policy || !CONSTANTS.POLICY_REGEX.test(policy)) {
      if (self._options.loggingNoPII)
        return next(new Error("In _flowInitializationHandler: the given policy in the request is invalid"));
      else
        return next(new Error(`In _flowInitializationHandler: the given policy ${policy} given in the request is invalid`));
    }
  }

  // add state/nonce/policy/timeStamp tuple to session or cookie
  const state = params.state = oauthConfig.customState ? ("CUSTOM" + aadutils.uid(32) + oauthConfig.customState) : aadutils.uid(32);
  const nonce = params.nonce = aadutils.uid(32);
  const resource = oauthConfig.resource ? oauthConfig.resource : null;
  if (resource)
    params.resource = resource;

  const tuple = { state: state, nonce: nonce };
  if (policy)
    tuple.policy = policy;
  if (resource)
    tuple.resource = resource;
  if (oauthConfig.tenantIdOrName)
    tuple.tenantIdOrName = oauthConfig.tenantIdOrName;

  if (!self._useCookieInsteadOfSession) {
    tuple.timeStamp = Date.now();
    self._sessionContentHandler.add(req, self._key, tuple);
  } else {
    /*
     * we don't need to record timestamp if we use cookie, since we can set the
     * expiration when we set cookie
     */
    self._cookieContentHandler.add(req, oauthConfig.response, tuple);
  }

  // add scope
  params.scope = oauthConfig.scope;

  // add telemetry
  params[aadutils.getLibraryProductParameterName()] = aadutils.getLibraryProduct();
  params[aadutils.getLibraryVersionParameterName()] = aadutils.getLibraryVersion();

  const location = aadutils.concatUrl(oauthConfig.authorization_endpoint, querystring.stringify(params));

  return self.redirect(location);
};

/**
 * get access_token using client secret or client assertion
 *
 * @params {String} code
 * @params {Object} oauthConfig
 * @params {Function} callback
 */
Strategy.prototype._getAccessTokenBySecretOrAssertion = function getAccessTokenBySecretOrAssertion(code, oauthConfig, next, callback) {
  const post_headers = { "Content-Type": "application/x-www-form-urlencoded" };

  const self = this;

  const post_params = {
    code: code,
    client_id: oauthConfig.clientID,
    redirect_uri: oauthConfig.redirectUrl,
    scope: oauthConfig.scope,
    grant_type: "authorization_code"
  };

  if (oauthConfig.extraTokenReqQueryParams) {
    // copy the extra query parameters into post_params
    for (const attributeName in oauthConfig.extraTokenReqQueryParams) {
      if (Object.prototype.hasOwnProperty.call(oauthConfig.extraTokenReqQueryParams, attributeName))
        post_params[attributeName] = oauthConfig.extraTokenReqQueryParams[attributeName];
    }
  }

  if (oauthConfig.clientSecret) {
    // use client secret if it exists
    post_params["client_secret"] = oauthConfig.clientSecret;
    log.info("In _getAccessTokenBySecretOrAssertion: we are using client secret");
  } else {
    // otherwise generate a client assertion
    post_params["client_assertion_type"] = CONSTANTS.CLIENT_ASSERTION_TYPE;

    jwt.generateClientAssertion(oauthConfig.clientID, oauthConfig.token_endpoint, oauthConfig.privatePEMKey, oauthConfig.thumbprint,
      (err, assertion) => {
        if (err)
          return next(err);
        else
          post_params["client_assertion"] = assertion;
      });

    if (self._options.loggingNoPII)
      log.info("In _getAccessTokenBySecretOrAssertion: we created a client assertion");
    else
      log.info("In _getAccessTokenBySecretOrAssertion: we created a client assertion with thumbprint " + oauthConfig.thumbprint);
  }

  const post_data = querystring.stringify(post_params);

  const oauth2 = createOauth2Instance(oauthConfig);

  oauth2._request("POST", oauthConfig.token_endpoint, post_headers, post_data, null, (error, data) => {
    if (error) callback(error);
    else {
      let results;
      try {
        results = JSON.parse(data);
      } catch (e) {
        results = querystring.parse(data);
      }
      callback(null, results);
    }
  });
};

/**
 * fail and log the given message
 *
 * @params {String} message
 */
Strategy.prototype.failWithLog = function(message) {
  this.log.info(`authentication failed due to: ${message}`);
  return this.fail(message);
};

/**
 * create an oauth2 instance
 *
 * @params {Object} oauthConfig
 */
const createOauth2Instance = function(oauthConfig) {
  const libraryVersion = aadutils.getLibraryVersion();
  const libraryProduct = aadutils.getLibraryProduct();

  const oauth2 = new OAuth2(
    oauthConfig.clientID, // consumerKey
    oauthConfig.clientSecret, // consumer secret
    "", // baseURL (empty string because we use absolute urls for authorize and token paths)
    oauthConfig.authorization_endpoint, // authorizePath
    oauthConfig.token_endpoint, // accessTokenPath
    {libraryProductParameterName : libraryProduct,
     libraryVersionParameterName : libraryVersion} // customHeaders
  );

  if (oauthConfig.proxy) {
    // if user has specified proxy settings instantiate agent
    oauth2.setAgent(new HttpsProxyAgent(oauthConfig.proxy));
  }

  return oauth2;
};

module.exports = Strategy;
