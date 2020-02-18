import { expect } from "chai";
import { ScopeSet } from "../../src/auth/ScopeSet";
import { TEST_CONFIG } from "../utils/StringConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage, Constants, ClientAuthError, ClientAuthErrorMessage } from "../../src";
import sinon from "sinon";

describe("ScopeSet.ts", () => {
    
    describe("Constructor and scope validation", () => {

        it("Throws error if scopes are null or empty and required", () => {
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });

        it("Throws error if scopes are not array object", () => {
            expect(() => new ScopeSet(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.throw(ClientConfigurationErrorMessage.nonArrayScopesError.desc);
            expect(() => new ScopeSet(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.throw(ClientConfigurationError);
        });

        it("Does not throw error if scopes are empty but not required", () => {
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
        });

        it("Appends client id to scopes and replaces it by default if scopes are not required", () => {
            const scopeSet = new ScopeSet([], TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Replaces client id if scopes are required and client id is provided", () => {
            const scopeSet = new ScopeSet([TEST_CONFIG.MSAL_CLIENT_ID], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Does not append client id when scopes are required", () => {
            const testScope = "testscope";
            const scopeSet = new ScopeSet([testScope], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([testScope]);
            expect(scopeSet.asArray()).to.deep.eq([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Converts array string values to lower case", () => {
            const testScope1 = "TestScope1";
            const lowerCaseScope1 = "testscope1";
            const testScope2 = "TeStScOpE2";
            const lowerCaseScope2 = "testscope2";
            const testScope3 = "TESTSCOPE3";
            const lowerCaseScope3 = "testscope3";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Removes duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const lowerCaseScope = "testscope";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3, testScope4, testScope5], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });
    });

    describe("fromString Constructor", () => {

        it("Throws error if scopeString is empty, null or undefined if scopes are required", () => {
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, true)).to.throw(ClientConfigurationError);
        });

        it("Creates a default ScopeSet to send to the service if scopes are not required and empty, null or undefined", () => {
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet1 = ScopeSet.fromString("", TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet1.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet1.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);

            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet2 = ScopeSet.fromString(null, TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet2.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet2.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);

            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false)).to.not.throw(ClientConfigurationError);
            const scopeSet3 = ScopeSet.fromString(undefined, TEST_CONFIG.MSAL_CLIENT_ID, false);
            expect(scopeSet3.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet3.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Replaces client id if scopes are required and client id is provided", () => {
            const scopeSet = ScopeSet.fromString(TEST_CONFIG.MSAL_CLIENT_ID, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([TEST_CONFIG.MSAL_CLIENT_ID]);
            expect(scopeSet.asArray()).to.deep.eq(TEST_CONFIG.DEFAULT_SCOPES);
        });

        it("Does not append client id when scopes are required", () => {
            const testScope = "testscope";
            const scopeSet = ScopeSet.fromString(testScope, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([testScope]);
            expect(scopeSet.asArray()).to.deep.eq([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Trims and converts array string values to lower case", () => {
            const testScope1 = "   TestScope1";
            const lowerCaseScope1 = "testscope1";
            const testScope2 = "TeStScOpE2   ";
            const lowerCaseScope2 = "testscope2";
            const testScope3 = "   TESTSCOPE3  ";
            const lowerCaseScope3 = "testscope3";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3}`, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope1, lowerCaseScope2, lowerCaseScope3, Constants.OFFLINE_ACCESS_SCOPE]);
        });

        it("Removes duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE  ";
            const testScope3 = "  TESTSCOPE ";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const lowerCaseScope = "testscope";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3} ${testScope4} ${testScope5}`, TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(scopeSet.getOriginalScopesAsArray()).to.deep.eq([lowerCaseScope]);
            expect(scopeSet.asArray()).to.deep.eq([lowerCaseScope, Constants.OFFLINE_ACCESS_SCOPE]);
        });
    });

    describe.only("Set functions", () => {

        let requiredScopeSet: ScopeSet;
        let nonRequiredScopeSet: ScopeSet;
        let testScope: string;
        beforeEach(() => {
            testScope = "testscope";
            requiredScopeSet = new ScopeSet([testScope], TEST_CONFIG.MSAL_CLIENT_ID, true);
            nonRequiredScopeSet = new ScopeSet([testScope], TEST_CONFIG.MSAL_CLIENT_ID, false);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("containsScope() checks if a given scope is present in the set of scopes", () => {
            expect(requiredScopeSet.containsScope(Constants.OPENID_SCOPE)).to.be.false;
            expect(requiredScopeSet.containsScope("notinset")).to.be.false;

            expect(nonRequiredScopeSet.containsScope(Constants.OPENID_SCOPE)).to.be.true;
            expect(nonRequiredScopeSet.containsScope(testScope)).to.be.true;
            expect(nonRequiredScopeSet.containsScope("notinset")).to.be.false;
        });

        it("containsScope() returns false if null or empty scope is passed to it", () => {
            expect(requiredScopeSet.containsScope("")).to.be.false;
            expect(requiredScopeSet.containsScope(null)).to.be.false;
            expect(requiredScopeSet.containsScope(undefined)).to.be.false;
        });

        it("containsScopeSet() checks if a given ScopeSet is fully contained in another - returns false otherwise", () => {
            expect(nonRequiredScopeSet.containsScopeSet(requiredScopeSet)).to.be.true;

            const scopeSet = new ScopeSet(["testScope2"], TEST_CONFIG.MSAL_CLIENT_ID, true);
            expect(nonRequiredScopeSet.containsScopeSet(scopeSet)).to.be.false;
        });

        it("containsScopeSet() returns false if given ScopeSet is null or undefined", () => {
            expect(nonRequiredScopeSet.containsScope(null)).to.be.false;
            expect(nonRequiredScopeSet.containsScope(undefined)).to.be.false;
        });

        it("appendScope() adds scope to set after trimming and converting to lower case", () => {
            expect(nonRequiredScopeSet.asArray()).to.contain(testScope);
            nonRequiredScopeSet.appendScope("   testScope2   ");
            expect(nonRequiredScopeSet.asArray()).to.contain("testscope2");
        });

        it("appendScope() does not add duplicates to ScopeSet", () => {
            const scopeArr = nonRequiredScopeSet.asArray();
            nonRequiredScopeSet.appendScope(testScope);
            const newScopeArr = nonRequiredScopeSet.asArray();
            expect(newScopeArr).to.be.deep.eq(scopeArr);
        });
        
        it("appendScope() does nothing if given scope is empty, null or undefined", () => {
            const setAddSpy = sinon.spy(Set.prototype, "add");
            
            expect(() => nonRequiredScopeSet.appendScope("")).to.throw(ClientAuthErrorMessage.appendEmptyScopeError.desc);
            expect(setAddSpy.called).to.be.false;

            expect(() => nonRequiredScopeSet.appendScope(null)).to.throw(ClientAuthErrorMessage.appendEmptyScopeError.desc);
            expect(setAddSpy.called).to.be.false;
            
            expect(() => nonRequiredScopeSet.appendScope(undefined)).to.throw(ClientAuthErrorMessage.appendEmptyScopeError.desc);
            expect(setAddSpy.called).to.be.false;
        });

        it("appendScopes() throws error if given array is null or empty", () => {
            const setUnionSpy = sinon.spy(ScopeSet.prototype, "unionScopeSets");
            expect(() => requiredScopeSet.appendScopes(null)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
            expect(setUnionSpy.called).to.be.false;
            
            expect(() => requiredScopeSet.appendScopes(undefined)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
            expect(setUnionSpy.called).to.be.false;

            expect(() => requiredScopeSet.appendScopes([])).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
            expect(setUnionSpy.called).to.be.false;
            
            expect(() => nonRequiredScopeSet.appendScopes(null)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
            expect(setUnionSpy.called).to.be.false;

            expect(() => nonRequiredScopeSet.appendScopes(undefined)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
            expect(setUnionSpy.called).to.be.false;
        });

        it("appendScopes() does not change ScopeSet if given array is empty", () => {
            const setUnionSpy = sinon.spy(ScopeSet.prototype, "unionScopeSets");
            const scopeArr = nonRequiredScopeSet.asArray();
            nonRequiredScopeSet.appendScopes([]);
            for (let i = 0; i < scopeArr.length; i++) {
                expect(nonRequiredScopeSet.asArray()).to.contain(scopeArr[i]);
            }
            expect(setUnionSpy.calledOnce).to.be.true;
        });

        it("appendScopes() adds multiple scopes to ScopeSet", () => {
            const testScope2 = "testscope2";
            const testScope3 = "testscope3";
            requiredScopeSet.appendScopes([testScope2, testScope3]);
            expect(requiredScopeSet.asArray()).to.contain(testScope2);
            expect(requiredScopeSet.asArray()).to.contain(testScope3);
        });

        it("appendScopes() does not add duplicate scopes", () => {
            const testScope2 = "testscope2";
            const scopeArr = requiredScopeSet.asArray();
            requiredScopeSet.appendScopes([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
            expect(requiredScopeSet.asArray().length).to.be.eq(scopeArr.length);
        });
    });

    describe("Getters and Setters", () => {
        
    });
});
