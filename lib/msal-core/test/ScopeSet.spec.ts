import { ScopeSet } from "../src/ScopeSet";
import { expect } from "chai";
import { ClientConfigurationError, ClientConfigurationErrorMessage } from "../src/error/ClientConfigurationError";
import { Constants } from "../src/utils/Constants";
import { TEST_CONFIG } from "./TestConstants";

describe("ScopeSet.ts", () => {
    const openid = Constants.openidScope;
    const profile = Constants.profileScope;
    const clientId = TEST_CONFIG.MSAL_CLIENT_ID;

    describe("isIntersectingScopes", () => {
        it("should return true if cachedScopes and scopes share a single scope", () => {
            const cachedScopes = ["s1"];
            const scopes = ["s1"];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(true);
        });

        it("should return true if cachedScopes and scopes share a single scope while having other scopes", () => {
            const cachedScopes = ["s1", "s2", "s3"];
            const scopes = ["s4", "s1", "s5"];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(true);
        });

        it("should return true if cachedScopes and scopes share more than one scope", () => {
            const cachedScopes = ["s1", "s2", "s3"];
            const scopes = ["s2", "s1", "s5"];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(true);
        });

        it("should return false if cachedScopes and scopes do not share any scopes", () => {
            const cachedScopes = ["s1"];
            const scopes = ["s2"];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(false);
        });

        it("should return false if scopes is empty", () => {
            const cachedScopes = ["s1"];
            const scopes = [];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(false);
        });

        it("should return false if cachedScopes and scopes are both empty arrays", () => {
            const cachedScopes = [];
            const scopes = [];
            expect(ScopeSet.isIntersectingScopes(cachedScopes, scopes)).to.eql(false);
        });
    });

    describe("trimAndConvertToLowerCase", function() {
        it("should downcase and remove all whitespace from all scope strings in scopes array passed in", () => {
            const scopeSet = ["S1", " S2", " S3 "];
            expect(ScopeSet.trimAndConvertArrayToLowerCase(scopeSet)).to.be.deep.eq(["s1", "s2", "s3"]);         
        });
    });

    describe("trimAndConvertToLowerCase", () => {
        it("should downcase and remove all whitespace from the scope passed in", () => {
            const scope = " S1 ";
            expect(ScopeSet.trimAndConvertToLowerCase(scope)).to.be.eq("s1");
        });
    });

    describe("removeElement", function() {
        it("should return a filtered scopes array with the scope passed in removed", function() {
            const unfilteredScopes = ["s1", "s2"];
            const scopeToRemove = "s1";
            const filteredScopes = ScopeSet.removeElement(unfilteredScopes, scopeToRemove);
            expect(filteredScopes).to.not.eq(unfilteredScopes);
            expect(filteredScopes).to.not.include(scopeToRemove);
        });
    });

    describe("validateInputScope", function() {
        it("should not throw any errors when a single scope is passed in scopes array", () => {
            const scopes = ["s1"];
            expect(() => ScopeSet.validateInputScope(scopes)).to.not.throw();
        });

        it("should not throw any errors when multiple scopes are passed in scopes array", () => {
            const scopes = ["s1", "s2"];
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

    describe("getScopeFromState", function() {
        it("should return an empty string if null is passed in as state", function(){
            expect(ScopeSet.getScopeFromState(null)).to.eql("");
        });
    });

    describe("appendScopes", function() {
        it("should return null if no scopes are passed into the first argument", function() {
            expect(ScopeSet.appendScopes(null, ["s1"])).to.eql(null);
        });

        it("should return extended scopes if scopes and scopesToAppend are passed in", function() {
            expect(ScopeSet.appendScopes(["s1"], ["s2"])).to.eql(["s1", "s2"]);
        });
                
        it("should return extended scopes that include all the scopes in original scopes array and scopesToAppend", function() {
            expect(ScopeSet.appendScopes(["s1", "s2"], ["s3", "s4"])).to.eql(["s1", "s2", "s3", "s4"]);
        });

        it("should return original scopes if scopesToAppend is null", function() {
            expect(ScopeSet.appendScopes(["s1"], null)).to.eql(["s1"]);
        });
        
        it("should return original scopes if scopesToAppend is an empty array", function() {
            expect(ScopeSet.appendScopes(["s1"], [])).to.eql(["s1"]);
        });
    });

    describe("generateLoginScopes", function() {
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
        it("should return true if scopes includes openid", () => {
            expect(ScopeSet.isLoginScopes([openid], clientId)).to.eql(true);
        });

        it("should return true if scopes includes profile", () => {
            expect(ScopeSet.isLoginScopes([profile], clientId)).to.eql(true);
        });

        it("should return true if clientId is passed in", () => {
            expect(ScopeSet.isLoginScopes([clientId], clientId)).to.eql(true);
        });

        it("should return true if any login scope is present, even when additional scopes are passed in", () => {
            expect(ScopeSet.isLoginScopes(["s1", openid], clientId)).to.eql(true);
            expect(ScopeSet.isLoginScopes(["s1", profile], clientId)).to.eql(true);
            expect(ScopeSet.isLoginScopes(["s1", clientId], clientId)).to.eql(true);
        });

        it("should return false if scopes does not include openid, profile, or clientId", () => {
            expect(ScopeSet.isLoginScopes(["s1"], clientId)).to.eql(false);
        });
    });
});