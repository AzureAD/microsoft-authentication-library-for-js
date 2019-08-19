import { StringUtils } from "./utils/StringUtils";
import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { ResponseTypes } from "./utils/Constants";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class ScopeSet {

    private scopes: Set<string>;
    private originalScopes: Set<string>;
    private clientId: string;
    private scopesRequired: boolean;

    constructor(inputScopes: Array<string>, appClientId: string, isLoginCall: boolean) {
        this.scopesRequired = !isLoginCall;
        this.clientId = appClientId;
        this.validateInputScopes(inputScopes);
        this.scopes = this.originalScopes = new Set<string>(StringUtils.convertArrayEntriesToLowerCase(inputScopes));
    }

    /**
     * Factory method to create ScopeSet from string
     * 
     * @param inputScopeString 
     * @param appClientId 
     * @param isLoginCall 
     */
    static fromString(inputScopeString: string, appClientId: string, isLoginCall: boolean): ScopeSet {
        const inputScopes: Array<string> = inputScopeString.split(" ");
        return new ScopeSet(inputScopes, appClientId, isLoginCall);
    }

    /**
     * @hidden
     *
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} inputScopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
     * @ignore
     */
    private validateInputScopes(inputScopes: Array<string>): void {
        if (!inputScopes) {
            if (this.scopesRequired) {
                throw ClientConfigurationError.createScopesRequiredError(inputScopes);
            } else {
                return;
            }
        }

        // Check that scopes is an array object (also throws error if scopes == null)
        if (!Array.isArray(inputScopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(inputScopes);
        }

        // Check that scopes is not an empty array
        if (inputScopes.length < 1) {
            throw ClientConfigurationError.createEmptyScopesArrayError(inputScopes.toString());
        }

        // Check that clientId is passed as single scope
        if (inputScopes.indexOf(this.clientId) > -1) {
            if (inputScopes.length > 1) {
                throw ClientConfigurationError.createClientIdSingleScopeError(inputScopes.toString());
            }
        }
    }

    /**
     * Check if scopes intersect between this set and another.
     *
     * @param otherScopes
     */
    intersectingScopeArrays(otherScopes: Array<string>): boolean {
        return this.unionScopeSets(otherScopes).size < this.scopes.size + otherScopes.length;
    }

    /**
     * 
     * @param otherScopes 
     */
    unionScopeSets(otherScopes: Array<string>): Set<string> {
        return new Set<string>([ ...StringUtils.convertArrayEntriesToLowerCase(otherScopes), ...Array.from(this.scopes) ]);
    }

    /**
     * Check if a given scope is present in the request
     *
     * @param cachedScopes
     * @param scopes
     */
    containsScope(scope: string): boolean {
        return this.scopes.has(scope);
    }

    /**
     * @ignore
     * Appends extraScopesToConsent if passed
     * @param {@link AuthenticationParameters}
     */
    appendExtraScopes(newScopes: Array<string>): void {
        this.validateInputScopes(newScopes);
        this.scopes = this.unionScopeSets(newScopes);
    }

    /**
     * remove one element from set of scopes
     *
     * @param scope
     */
    removeElement(scope: string): void {
        this.scopes.delete(scope);
    }

    /**
     * @hidden
     * @ignore
     *
     * ScopeSet helper to 
     * @param matchingAccount boolean telling whether account object matches value in cache
     * @param silentCall boolean telling whether or not silent call
     *
     * @returns {string} token type: id_token or access_token
     *
     */
    getTokenType(matchingAccount: boolean, silentCall: boolean): string {
        // if account is passed and matches the account object/or set to getAccount() from cache
        // if client-id is passed as scope, get id_token else token/id_token_token (in case no session exists)
        if (!matchingAccount) {
            return silentCall && this.isLoginCall() ? ResponseTypes.id_token : ResponseTypes.id_token_token;           
        } else {
            return this.isLoginCall ? ResponseTypes.id_token : ResponseTypes.token;
        }
    }

    /**
     * ScopeSet helper which will tell whether set of scopes is being used for login calls.
     */
    isLoginCall(): boolean {
        return this.originalScopes && this.originalScopes.has(this.clientId) && this.originalScopes.size === 1
    }

    /**
     * @hidden
     *
     * Extracts scope value from the state sent with the authentication request.
     * 
     * Note: This function was removed from the current implementation of MSAL.js.
     * @param {string} state
     * @returns {string} scope.
     * @ignore
     */
    // private getScopeFromState(state: string): string;

    /**
     * Returns the scopes as an array of string values.
     */
    asArray(): Array<string> {
        return Array.from(this.scopes);
    }

    /**
     * Print the scopes into a space-delimited string.
     */
    printScopes(): string {
        let scopeList: string = "";
        if (this.scopes) {
            for (const scope in this.scopes) {
                scopeList += scope + " ";
            }
        }

        return scopeList.substring(0, scopeList.length);
    }
}
