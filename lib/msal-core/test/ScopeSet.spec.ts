import { ScopeSet } from "../src/ScopeSet";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { Constants } from "../src/utils/Constants";
import { TEST_CONFIG } from "./TestConstants";

describe("ScopeSet.ts", () => {
    const openid = Constants.openidScope;
    const profile = Constants.profileScope;
    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;

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
            expect(ScopeSet.generateLoginScopes(["S1"], clientId)).to.eql(["S1"]);
        });

        it("should append openid and profile to scopes, remove clientId from scopes if original scopes include clientId", function() {
            expect(ScopeSet.generateLoginScopes([clientId], clientId)).to.include(openid);
            expect(ScopeSet.generateLoginScopes([clientId], clientId)).to.include(profile);
            expect(ScopeSet.generateLoginScopes([clientId], clientId)).to.not.include(clientId);
        });

        it("should append openid to scopes if original scopes are login scopes and does not include openid", function() {
            expect(ScopeSet.generateLoginScopes([clientId, profile], clientId)).to.include(openid);
        });
        
        it("should append profile to scopes if original scopes are login scopes and does not include profile", function() {
            expect(ScopeSet.generateLoginScopes([clientId, openid], clientId)).to.include(profile);
        });
        
        it("should not remove existing access token scopes in original scopes when appending login scopes", function() {
            expect(ScopeSet.generateLoginScopes(["S1", clientId], clientId)).to.include("S1");
            expect(ScopeSet.generateLoginScopes(["S1", clientId], clientId)).to.include(openid);
            expect(ScopeSet.generateLoginScopes(["S1", clientId], clientId)).to.include(profile);
        });
    });

    describe("isLoginScopes", function() {
        it("should return true if scopes includes openid", function () {
            expect(ScopeSet.isLoginScopes([openid], clientId)).to.eql(true);
        });

        it("should return true if scopes includes profile", function () {
            expect(ScopeSet.isLoginScopes([profile], clientId)).to.eql(true);
        });

        it("should return true if clientId is passed in", function () {
            expect(ScopeSet.isLoginScopes([clientId], clientId)).to.eql(true);
        });

        it("should return true if any login scope is present, even when additional scopes are passed in", function () {
            expect(ScopeSet.isLoginScopes(["S1", openid], clientId)).to.eql(true);
            expect(ScopeSet.isLoginScopes(["S1", profile], clientId)).to.eql(true);
            expect(ScopeSet.isLoginScopes(["S1", clientId], clientId)).to.eql(true);
        });

        it("should return false if scopes does not include openid, profile, or clientId", function () {
            expect(ScopeSet.isLoginScopes(["S1"], clientId)).to.eql(false);
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

