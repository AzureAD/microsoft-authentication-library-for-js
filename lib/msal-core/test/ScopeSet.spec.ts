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

    describe("trimAndConvertArrayToLowerCase", () => {
        it("should downcase and remove all whitespace from all scope strings in scopes array passed in", () => {
            const scopeSet = ["S1", " S2", " S3 "];
            expect(ScopeSet.trimAndConvertArrayToLowerCase(scopeSet)).to.be.deep.eq(["s1", "s2", "s3"]);         
        });

        it("should return the same array passed in if it is already downcased and trimmed", () => {
            const scopeSet = ["s1", "s2", "s3"];
            expect(ScopeSet.trimAndConvertArrayToLowerCase(scopeSet)).to.be.deep.eq(["s1", "s2", "s3"]);         
        });
    });

    describe("trimAndConvertToLowerCase", () => {
        it("should downcase and remove all whitespace from the scope passed in", () => {
            const scope = " S1 ";
            expect(ScopeSet.trimAndConvertToLowerCase(scope)).to.be.eq("s1");
        });
    });

    describe("removeElement", () => {
        it("should return a filtered scopes array with the scope passed in removed", () => {
            const unfilteredScopes = ["s1", "s2"];
            const scopeToRemove = "s1";
            const filteredScopes = ScopeSet.removeElement(unfilteredScopes, scopeToRemove);
            expect(filteredScopes).to.not.eq(unfilteredScopes);
            expect(filteredScopes).to.not.include(scopeToRemove);
        });

        it("should return the same array if the scope to remove is not present in array", () => {
            const unfilteredScopes = ["s1","s2"];
            const scopeToRemove = "s3";
            const filteredScopes = ScopeSet.removeElement(unfilteredScopes, scopeToRemove);
            expect(filteredScopes).to.deep.equal(unfilteredScopes);
        })
    });

    describe("validateInputScope", () => {
        describe("login calls", () => {
            it("should not throw any errors when a single scope is passed in scopes array", () => {
                const scopes = ["s1"];
                expect(() => ScopeSet.validateInputScope(scopes, false)).to.not.throw();
            });
    
            it("should not throw any errors when multiple scopes are passed in scopes array", () => {
                const scopes = ["s1", "s2"];
                expect(() => ScopeSet.validateInputScope(scopes, false)).to.not.throw();
            });
    
            it("should not throw createScopesRequiredError if scopes are null", () => {
                expect(() => ScopeSet.validateInputScope(null, false)).to.not.throw();
            });
            
            it("should not throw createScopesNonArrayError if scopes is not an array object", () => {
                const scopes = "s1 s2";
                // @ts-ignore
                expect(() => ScopeSet.validateInputScope(scopes, false)).to.not.throw();
            });
    
            it("should not throw createEmptyScopesArrayError if scopes is an empty array", () => {
                const scopes = [];
                expect(() => ScopeSet.validateInputScope(scopes, false)).to.not.throw();
            });
        });

        describe("acquire token calls", () => {
            it("should not throw any errors when a single scope is passed in scopes array", () => {
                const scopes = ["s1"];
                expect(() => ScopeSet.validateInputScope(scopes, true)).to.not.throw();
            });
    
            it("should not throw any errors when multiple scopes are passed in scopes array", () => {
                const scopes = ["s1", "s2"];
                expect(() => ScopeSet.validateInputScope(scopes, true)).to.not.throw();
            });
    
            it("should throw invalidScopesError if scopes are null", () => {
                const scopes = null;
                let clientConfigError;
    
                try {
                    ScopeSet.validateInputScope(scopes, true);
                } catch (e) {
                    clientConfigError = e;
                }
    
                expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
                expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.invalidScopes.code);
                expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.invalidScopes.desc);
            });
            
            it("should throw invalidScopesError if scopes is not an array object", () => {
                const scopes = "s1 s2";
                let clientConfigError;
    
                try {
                    // @ts-ignore
                    ScopeSet.validateInputScope(scopes, true);
                } catch (e) {
                    clientConfigError = e;
                }
    
                expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
                expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.invalidScopes.code);
                expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.invalidScopes.desc);
            });
    
            it("should throw invalidScopesError if scopes is an empty array", () => {
                const scopes = [];
                let clientConfigError;
    
                try {
                    ScopeSet.validateInputScope(scopes, true);
                } catch (e) {
                    clientConfigError = e;
                }
    
                expect(clientConfigError instanceof ClientConfigurationError).to.eq(true);
                expect(clientConfigError.errorCode).to.equal(ClientConfigurationErrorMessage.invalidScopes.code);
                expect(clientConfigError.message).to.contain(ClientConfigurationErrorMessage.invalidScopes.desc);
            });
        });
    });

    describe("getScopeFromState", () => {
        it("should return an empty string if null is passed in as state", () =>{
            expect(ScopeSet.getScopeFromState(null)).to.eql("");
        });
    });

    describe("appendScopes", () => {
        it("should return an empty array if no scopes are passed into the first argument", () => {
            expect(ScopeSet.appendScopes(null, ["s1"])).to.eql([]);
        });

        it("should return extended scopes if scopes and scopesToAppend are passed in", () => {
            expect(ScopeSet.appendScopes(["s1"], ["s2"])).to.eql(["s1", "s2"]);
        });
                
        it("should return extended scopes that include all the scopes in original scopes array and scopesToAppend", () => {
            expect(ScopeSet.appendScopes(["s1", "s2"], ["s3", "s4"])).to.eql(["s1", "s2", "s3", "s4"]);
        });

        it("should return original scopes if scopesToAppend is null", () => {
            expect(ScopeSet.appendScopes(["s1"], null)).to.eql(["s1"]);
        });
        
        it("should return original scopes if scopesToAppend is an empty array", () => {
            expect(ScopeSet.appendScopes(["s1"], [])).to.eql(["s1"]);
        });
    });

    describe("generateOidcScopes", () => {
        it("should append openid and profile to scopes when clientId is in scopes array", () => {
            const loginScopes = ScopeSet.generateOidcScopes([clientId]); 
            expect(loginScopes).to.include(openid);
            expect(loginScopes).to.include(profile);
        });

        it("should not remove clientId from scopes array", () => {
            const loginScopes = ScopeSet.generateOidcScopes([clientId]);
            expect(loginScopes).to.include(clientId);
        });

        it('should not append clientId to scopes array if not already present', () => {
            const loginScopes = ScopeSet.generateOidcScopes([]);
            expect(loginScopes).to.not.include(clientId);
        });

        it("should append openid to scopes if original scopes are login scopes and does not include openid", () => {
            const loginScopes = ScopeSet.generateOidcScopes([clientId, profile]);
            expect(loginScopes).to.include(openid);
            expect(loginScopes).to.include(profile);
            expect(loginScopes).to.include(clientId);
        });
        
        it("should append profile to scopes if original scopes are login scopes and does not include profile", () => {
            const loginScopes = ScopeSet.generateOidcScopes([clientId, openid]);
            expect(loginScopes).to.include(openid);
            expect(loginScopes).to.include(profile);
            expect(loginScopes).to.include(clientId);
        });
        
        it("should not remove existing access token scopes in original scopes when appending login scopes", () => {
            const loginScopes = ScopeSet.generateOidcScopes(["S1", clientId]);
            expect(loginScopes).to.include("S1");
            expect(loginScopes).to.include(openid);
            expect(loginScopes).to.include(profile);
            expect(loginScopes).to.include(clientId);
        });
    });

    describe("isLoginScopes", () => {
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
    
    describe("containsOidcScopes", () => {
        it("should return true if scopes array includes openid and profile", () => {
            expect(ScopeSet.containsOidcScopes([openid, profile])).to.eql(true);
        });

        it("should return false if scopes array includes openid but omits profile", () => {
            expect(ScopeSet.containsOidcScopes([openid])).to.eql(false);
        });

        it("should return false if scopes array includes profile but omits openid", () => {
            expect(ScopeSet.containsOidcScopes([profile])).to.eql(false);
        });

        it("should return false if scopes array does not contain openid or profile", () => {
            expect(ScopeSet.containsOidcScopes(["s1"])).to.eql(false);
        });
    });
});
