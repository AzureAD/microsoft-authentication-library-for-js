import { expect } from "chai";
import { ScopeSet } from "../../src/request/ScopeSet";
import { TEST_CONFIG } from "../test_kit/StringConstants";
import { ClientConfigurationError, ClientConfigurationErrorMessage, Constants, ClientAuthError, ClientAuthErrorMessage } from "../../src";
import sinon from "sinon";
import { OIDC_DEFAULT_SCOPES, OIDC_SCOPES } from "../../src/utils/Constants";

describe("ScopeSet.ts", () => {

    describe("Constructor and scope validation", () => {

        it("Throws error if scopes are null or empty and required", () => {
            expect(() => new ScopeSet(null)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet(null)).to.throw(ClientConfigurationError);

            expect(() => new ScopeSet([])).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => new ScopeSet([])).to.throw(ClientConfigurationError);
        });

        it("Trims array string values", () => {
            const testScope1 = "    TestScope1";
            const trimmedTestScope1 = "TestScope1";
            const testScope2 = "TeStScOpE2   ";
            const trimmedTestScope2 = "TeStScOpE2";
            const testScope3 = "   TESTSCOPE3   ";
            const trimmedTestScope3 = "TESTSCOPE3";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3]);
            expect(scopeSet.asArray()).to.deep.eq([trimmedTestScope1, trimmedTestScope2, trimmedTestScope3]);
        });

        it("Removes case-sensitive duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const scopeSet = new ScopeSet([testScope1, testScope2, testScope3, testScope4, testScope5]);
            expect(scopeSet.asArray()).to.deep.eq([testScope1, testScope2, testScope3, testScope4]);
        });
    });

    describe("fromString Constructor", () => {

        it("Throws error if scopeString is empty, null or undefined if scopes are required", () => {
            expect(() => ScopeSet.fromString("")).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString("")).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(null)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(null)).to.throw(ClientConfigurationError);

            expect(() => ScopeSet.fromString(undefined)).to.throw(ClientConfigurationErrorMessage.emptyScopesError.desc);
            expect(() => ScopeSet.fromString(undefined)).to.throw(ClientConfigurationError);
        });

        it("Trims array string values", () => {
            const testScope1 = "   TestScope1";
            const trimmedTestScope1 = "TestScope1";
            const testScope2 = "TeStScOpE2   ";
            const trimmedTestScope2 = "TeStScOpE2";
            const testScope3 = "   TESTSCOPE3  ";
            const trimmedTestScope3 = "TESTSCOPE3";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3}`);
            expect(scopeSet.asArray()).to.deep.eq([trimmedTestScope1, trimmedTestScope2, trimmedTestScope3]);
        });

        it("Removes case-sensitive duplicates from input scope array", () => {
            const testScope1 = "TestScope";
            const testScope2 = "TeStScOpE";
            const testScope3 = "TESTSCOPE";
            const testScope4 = "testscope";
            const testScope5 = "testscope";
            const scopeSet = ScopeSet.fromString(`${testScope1} ${testScope2} ${testScope3} ${testScope4} ${testScope5}`);
            expect(scopeSet.asArray()).to.deep.eq([testScope1, testScope2, testScope3, testScope4]);
        });
    });

    describe("Set functions", () => {

        let scopes: ScopeSet;
        let testScope: string;
        beforeEach(() => {
            testScope = "testscope";
            scopes = new ScopeSet([testScope]);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("containsScope() checks if a given scope is present in the set of scopes", () => {
            expect(scopes.containsScope(Constants.OPENID_SCOPE)).to.be.false;
            expect(scopes.containsScope("notinset")).to.be.false;
            expect(scopes.containsScope(testScope)).to.be.true;
        });

        it("containsScope() returns false if null or empty scope is passed to it", () => {
            expect(scopes.containsScope("")).to.be.false;
            expect(scopes.containsScope(null)).to.be.false;
            expect(scopes.containsScope(undefined)).to.be.false;
        });

        it("containsScopeSet() checks if a given ScopeSet is fully contained in another - returns false otherwise", () => {
            const biggerSet = new ScopeSet([testScope, "testScope2", "testScope3"]);
            expect(biggerSet.containsScopeSet(scopes)).to.be.true;

            const alternateSet = new ScopeSet(["testScope2"]);
            expect(scopes.containsScopeSet(alternateSet)).to.be.false;
        });

        it("containsScopeSet() returns false if given ScopeSet is null or undefined", () => {
            expect(scopes.containsScopeSet(null)).to.be.false;
            expect(scopes.containsScopeSet(undefined)).to.be.false;
        });

        it("appendScope() adds scope to set after trimming", () => {
            expect(scopes.asArray()).to.contain(testScope);
            scopes.appendScope("   testScope2   ");
            expect(scopes.asArray()).to.contain("testScope2");
        });

        it("appendScope() does not add duplicates to ScopeSet", () => {
            const scopeArr = scopes.asArray();
            scopes.appendScope(testScope);
            const newScopeArr = scopes.asArray();
            expect(newScopeArr).to.be.deep.eq(scopeArr);
        });

        it("appendScope() does nothing if given scope is empty, null or undefined", () => {
            const testScopes = [testScope];
            const setAddSpy = sinon.spy(Set.prototype, "add");
            scopes.appendScope("");
            expect(setAddSpy.called).to.be.false;
            expect(scopes.asArray()).to.be.deep.eq(testScopes);

            scopes.appendScope(null);
            expect(setAddSpy.called).to.be.false;
            expect(scopes.asArray()).to.be.deep.eq(testScopes);

            scopes.appendScope(undefined);
            expect(setAddSpy.called).to.be.false;
            expect(scopes.asArray()).to.be.deep.eq(testScopes);
        });

        it("appendScopes() throws error if given array is null or undefined", () => {
            expect(() => scopes.appendScopes(null)).to.throw(ClientAuthError);
            expect(() => scopes.appendScopes(null)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);

            expect(() => scopes.appendScopes(undefined)).to.throw(ClientAuthError);
            expect(() => scopes.appendScopes(undefined)).to.throw(ClientAuthErrorMessage.appendScopeSetError.desc);
        });

        it("appendScopes() does not change ScopeSet if given array is empty", () => {
            const scopeArr = scopes.asArray();
            scopes.appendScopes([]);
            expect(scopes.asArray()).to.be.deep.eq(scopeArr);
        });

        it("appendScopes() adds multiple scopes to ScopeSet", () => {
            const testScope2 = "testscope2";
            const testScope3 = "testscope3";
            scopes.appendScopes([testScope2, testScope3]);
            expect(scopes.asArray()).to.contain(testScope2);
            expect(scopes.asArray()).to.contain(testScope3);
        });

        it("appendScopes() trims scopes before adding", () => {
            const testScope2 = "   TestScope2";
            const expectedTestScope2 = "TestScope2";
            const testScope3 = "     testscope3   ";
            const expectedTestScope3 = "testscope3";
            scopes.appendScopes([testScope2, testScope3]);
            expect(scopes.asArray()).to.contain(expectedTestScope2);
            expect(scopes.asArray()).to.contain(expectedTestScope3);
        })

        it("appendScopes() does not add duplicate scopes", () => {
            const unchangedScopes = new ScopeSet([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
            const scopeArr = unchangedScopes.asArray();
            unchangedScopes.appendScopes([testScope, Constants.OFFLINE_ACCESS_SCOPE]);
            expect(unchangedScopes.asArray()).to.be.deep.eq(scopeArr);
        });

        it("removeScopes() throws error if scope is null, undefined or empty", () => {
            expect(() => scopes.removeScope(null)).to.throw(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            expect(() => scopes.removeScope(null)).to.throw(ClientAuthError);

            expect(() => scopes.removeScope(undefined)).to.throw(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            expect(() => scopes.removeScope(undefined)).to.throw(ClientAuthError);

            expect(() => scopes.removeScope("")).to.throw(ClientAuthErrorMessage.removeEmptyScopeError.desc);
            expect(() => scopes.removeScope("")).to.throw(ClientAuthError);
        });

        it("removeScopes() correctly removes scopes", () => {
            const scopeArr = scopes.asArray();
            scopes.removeScope("testScope2");
            expect(scopes.asArray()).to.be.deep.eq(scopeArr);
            scopes.removeScope(testScope);
            expect(scopes.asArray()).to.be.empty;
        });

        it("unionScopeSets() throws error if input is null or undefined", () => {
            expect(() => scopes.unionScopeSets(null)).to.throw(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            expect(() => scopes.unionScopeSets(null)).to.throw(ClientAuthError);

            expect(() => scopes.unionScopeSets(undefined)).to.throw(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            expect(() => scopes.unionScopeSets(undefined)).to.throw(ClientAuthError);
        });

        it("unionScopeSets() combines multiple sets and returns new Set of scopes", () => {
            const testScope2 = "testScope2";
            const testScope3 = "testScope3";
            const newScopeSet = new ScopeSet([testScope2, testScope3]);
            newScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);

            const unionSet = newScopeSet.unionScopeSets(scopes);
            const unionArray = Array.from(unionSet);
            expect(unionSet instanceof Set).to.be.true;
            expect(unionSet.size).to.be.eq(newScopeSet.getScopeCount() + scopes.getScopeCount());
            for(let i = 0; i < unionArray.length; i++) {
                expect(newScopeSet.containsScope(unionArray[i]) || scopes.containsScope(unionArray[i])).to.be.true;
            }
        });

        it("intersectingScopeSets() throws error if input is null or undefined", () => {
            expect(() => scopes.intersectingScopeSets(null)).to.throw(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            expect(() => scopes.intersectingScopeSets(null)).to.throw(ClientAuthError);

            expect(() => scopes.intersectingScopeSets(undefined)).to.throw(ClientAuthErrorMessage.emptyInputScopeSetError.desc);
            expect(() => scopes.intersectingScopeSets(undefined)).to.throw(ClientAuthError);
        });

        it("intersectingScopeSets() returns true if ScopeSets have one or more scopes in common", () => {
            const testScope2 = "testScope2";
            const newScopeSet = new ScopeSet([testScope, testScope2]);
            expect(newScopeSet.intersectingScopeSets(scopes)).to.be.true;
        });

        it("intersectingScopeSets() returns false if ScopeSets have no scopes in common", () => {
            const testScope2 = "testScope2";
            const testScope3 = "testScope3";
            const newScopeSet = new ScopeSet([testScope2, testScope3]);
            newScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);

            expect(newScopeSet.intersectingScopeSets(scopes)).to.be.false;
        });

        it("intersectingScopeSets() does not ignore OIDC scopes if they are only present", () => {
            const scopeset1 = new ScopeSet([...OIDC_SCOPES]);
            const scopeset2 = new ScopeSet([...OIDC_SCOPES]);
            expect(scopeset1.intersectingScopeSets(scopeset2)).to.be.true;
        });

        it("intersectingScopeSets() ignores OIDC scopes if other scopes are present", () => {
            const testScope = "testScope";
            const testScope2 = "testScope2";
            const scopeset1 = new ScopeSet([...OIDC_SCOPES, testScope]);
            const scopeset2 = new ScopeSet([...OIDC_SCOPES, testScope2]);
            expect(scopeset1.intersectingScopeSets(scopeset2)).to.be.false;

            const scopeset3 = new ScopeSet([Constants.OPENID_SCOPE, Constants.PROFILE_SCOPE, Constants.EMAIL_SCOPE, testScope]);
            const scopeset4 = new ScopeSet([...OIDC_DEFAULT_SCOPES, testScope]);
            expect(scopeset3.intersectingScopeSets(scopeset4)).to.be.true;
        });

        it("getScopeCount() correctly returns the size of the ScopeSet", () => {
            expect(scopes.getScopeCount()).to.be.eq(1);

            const twoScopes = new ScopeSet(["1", "2"]);
            expect(twoScopes.getScopeCount()).to.be.eq(2);

            const threeScopes = new ScopeSet(["1", "2", "3"])
            expect(threeScopes.getScopeCount()).to.be.eq(3);
        });
    });

    describe("Getters and Setters", () => {

        let requiredScopeSet: ScopeSet;
        let nonRequiredScopeSet: ScopeSet;
        let uppercaseScopeSet: ScopeSet;
        let lowercaseScopeSet: ScopeSet;
        let testScope: string;
        let testScope2: string;
        beforeEach(() => {
            testScope = "testscope";
            testScope2 = "testScope";
            requiredScopeSet = new ScopeSet([testScope]);
            nonRequiredScopeSet = new ScopeSet([testScope]);
            uppercaseScopeSet = new ScopeSet([testScope2]);
            lowercaseScopeSet = new ScopeSet([testScope]);
        });

        afterEach(() => {
            sinon.restore();
        });

        it("asArray() returns ScopeSet as an array", () => {
            const scopeArr = nonRequiredScopeSet.asArray();
            expect(Array.isArray(scopeArr)).to.be.true;
            expect(scopeArr.length).to.be.eq(nonRequiredScopeSet.getScopeCount());
            for (let i = 0; i < scopeArr.length; i++) {
                expect(nonRequiredScopeSet.containsScope(scopeArr[i])).to.be.true;
            }
        });

        it("printScopes() prints space-delimited string of scopes", () => {
            const scopeArr = nonRequiredScopeSet.asArray();
            expect(nonRequiredScopeSet.printScopes()).to.be.eq(scopeArr.join(" "));
        });

        it("printScopes() prints empty string if ScopeSet is empty", () => {
            requiredScopeSet.removeScope(testScope);
            requiredScopeSet.removeScope(Constants.OFFLINE_ACCESS_SCOPE);
            expect(requiredScopeSet.printScopes()).to.be.eq("");
        });

        it("printScopesLowerCase() prints space-delimited string of scopes in lowercase", () => {
            const scopeArr = lowercaseScopeSet.asArray();
            expect(uppercaseScopeSet.printScopesLowerCase()).to.be.eq(scopeArr.join(" "));
        });
    });
});
