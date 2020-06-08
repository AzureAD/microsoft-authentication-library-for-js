import { ScopeSet } from "../src/ScopeSet";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { TEST_CONFIG } from "./TestConstants";

describe("ScopeSet.ts", () => {
    describe("appendScopes", function() {
        it("should return null if no scopes are passed into the first argument", function() {
            expect(ScopeSet.appendScopes(null, ["S1"])).to.eql(null);
        });

        it("should return extended scopes if scopes and scopesToAppend are passed in", function() {
            expect(ScopeSet.appendScopes(["S1"], ["S2"])).to.eql(["S1", "S2"]);
        });
                
        it("should return extended scopes that include all the scopes in original scopes array and scopesToAppend", function() {
            expect(ScopeSet.appendScopes(["S1", "S2"], ["S3", "S4"])).to.eql(["S1", "S2", "S3", "S4"]);
        });

        it("should return original scopes if scopesToAppend is null", function() {
            expect(ScopeSet.appendScopes(["S1"], null)).to.eql(["S1"]);
        });
        
        it("should return original scopes if scopesToAppend is an empty array", function() {
            expect(ScopeSet.appendScopes(["S1"], [])).to.eql(["S1"]);
        });
    });

    describe("generateLoginScopes", function() {
        it("should return original scopes passed in if original scopes are not login scopes", function() {
            expect(ScopeSet.generateLoginScopes(["S1"], TEST_CONFIG.MSAL_CLIENT_ID)).to.eql(["S1"]);
        });

        it("should append openid and profile to scopes, remove clientId from scopes if original scopes include clientId", function() {
            expect(ScopeSet.generateLoginScopes([TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("openid");
            expect(ScopeSet.generateLoginScopes([TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("profile");
            expect(ScopeSet.generateLoginScopes([TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.not.include(TEST_CONFIG.MSAL_CLIENT_ID);
        });

        it("should append openid to scopes if original scopes are login scopes and does not include openid", function() {
            expect(ScopeSet.generateLoginScopes([TEST_CONFIG.MSAL_CLIENT_ID, "profile"], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("openid");
        });
        
        it("should append profile to scopes if original scopes are login scopes and does not include profile", function() {
            expect(ScopeSet.generateLoginScopes([TEST_CONFIG.MSAL_CLIENT_ID, "openid"], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("profile");
        });
        
        it("should not remove existing access token scopes in original scopes when appending login scopes", function() {
            expect(ScopeSet.generateLoginScopes(["S1", TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("S1");
            expect(ScopeSet.generateLoginScopes(["S1", TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("openid");
            expect(ScopeSet.generateLoginScopes(["S1", TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID)).to.include("profile");
        });
    });

    describe("validateInputScope", function() {
        it("should not throw any errors when a single scope is passed in scopes array", function () {
            const scopes = ["S1"];
            expect(() => ScopeSet.validateInputScope(scopes)).to.not.throw();
        });

        it("should not throw any errors when multiple scopes are passed in scopes array", function () {
            const scopes = ["S1", "S2"];
            expect(() => ScopeSet.validateInputScope(scopes)).to.not.throw();
        });

        it("should throw createScopesRequiredError if scopes are empty or null", function() {
            const scopes = null;
            let clientConfigError;

            try {
                ScopeSet.validateInputScope(scopes);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.scopesRequired.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.scopesRequired.desc);
        });
        
        it("should throw createScopesNonArrayError if scopes is not an array object", function() {
            const scopes = {};
            let clientConfigError;

            try {
                // @ts-ignore
                ScopeSet.validateInputScope(scopes);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.nonArrayScopes.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.nonArrayScopes.desc);
        });

        it("should throw createEmptyScopesArrayError if scopes is an empty array", function() {
            const scopes = [];
            let clientConfigError;

            try {
                ScopeSet.validateInputScope(scopes);
            } catch (e) {
                clientConfigError = e;
            }

            expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
            expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.emptyScopes.code);
            expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.emptyScopes.desc);
        });
    });
});

