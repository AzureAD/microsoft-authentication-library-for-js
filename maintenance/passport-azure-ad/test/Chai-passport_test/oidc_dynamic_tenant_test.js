/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
 
 /* eslint-disable no-new */

 "use restrict";

const chai = require("chai");
const url = require("url");
const OIDCStrategy = require("../../lib/index").OIDCStrategy;

chai.use(require("chai-passport-strategy"));

const TEST_TIMEOUT = 1000000; // 1000 seconds

// Mock options required to create a OIDC strategy
const options = {
  redirectUrl: "https://returnURL",
  clientID: "my_client_id",
  clientSecret: "my_client_secret",
  identityMetadata: "https://login.microsoftonline.com/common/.well-known/openid-configuration",
  responseType: "id_token",
  responseMode: "form_post",
  validateIssuer: true,
  passReqToCallback: false,
  loggingNoPII: false,
  sessionKey: "my_key"    // optional sessionKey
};

describe("OIDCStrategy dynamic tenant test", function() {
  this.timeout(TEST_TIMEOUT);

  let redirectUrl;
  let challenge;
  let request;

  const testPrepare = function(validateIssuer, issuer, tenantIdOrName, isB2C, policy) {
    return function(done) {
      options.validateIssuer = validateIssuer;
      options.issuer = issuer;
      options.isB2C = isB2C;

      const testStrategy = new OIDCStrategy(options, function(profile, done) {});
      chai.passport
        .use(testStrategy)
        .redirect(function(u) {redirectUrl = u; done(); })
        .fail(function(c) {challenge = c; done(); })
        .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = {}; 
          challenge = null;
        })
       .authenticate({ tenantIdOrName: tenantIdOrName });
    };
  };

  describe("should succeed", function() {
    before(testPrepare(true, null, "sijun.onmicrosoft.com", false));

    it("should have replaced common with tenantIdOrName and saved tenantIdOrName in session", function() {
      const u = url.parse(redirectUrl, true);
      chai.expect(request.session["my_key"]["content"][0]["tenantIdOrName"]).to.equal("sijun.onmicrosoft.com");
      chai.expect(u.pathname).to.equal("/268da1a1-9db4-48b9-b1fe-683250ba90cc/oauth2/authorize");
    });
  });

  describe("should fail without issuer and tenantIdOrName for common endpoint", function() {
    before(testPrepare(true, null, "", false));

    it("should fail with invalid tenant name", function() {
      chai.expect(challenge).to.equal("In collectInfoFromReq: issuer or tenantIdOrName must be provided in order to validate issuer on common endpoint");
    });
  });

  describe("should fail with invalid tenant name", function() {
    before(testPrepare(true, null, "xxx", false));

    it("should have replaced common with tenantIdOrName and saved tenantIdOrName in session", function() {
      console.log(challenge);
      chai.expect(challenge.startsWith("Error: 400")).to.equal(true);
    });
  });
});

describe("OIDCStrategy dynamic B2C tenant test", function() {
  this.timeout(TEST_TIMEOUT);
  
  let redirectUrl;
  let challenge;
  let request;

  const testPrepare = function(validateIssuer, issuer, tenantIdOrName) {
    return function(done) {
      options.validateIssuer = validateIssuer;
      options.issuer = issuer;
      options.isB2C = true;
      options.identityMetadata = "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration";

      const testStrategy = new OIDCStrategy(options, function(profile, done) {});
      chai.passport
        .use(testStrategy)
        .redirect(function(u) { redirectUrl = u; done(); })
        .fail(function(c) {challenge = c; done(); })
        .req(function(req) {
          request = req;
          req.session = {}; 
          req.query = { p: "b2c_1_signin" }; 
          challenge = null;
        })
        .authenticate({ tenantIdOrName: tenantIdOrName });
    };
  };

  describe("should fail without tenantIdOrName for using B2C common endpoint", function() {
    before(testPrepare(true, ["my_issuer"], "", true));

    it("should fail with invalid tenant name", function() {
      chai.expect(challenge).to.equal("In collectInfoFromReq: we are using common endpoint for B2C but tenantIdOrName is not provided");
    });
  });
});

