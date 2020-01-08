/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringUtils } from "../utils/StringUtils";
import { Constants } from "../utils/Constants";

export class ScopeSet {

    private clientId: string;
    private scopes: Set<string>;
    private originalScopes: Set<string>;
    private scopesRequired: boolean;

    constructor(inputScopes: Array<string>, appClientId: string, scopesRequired: boolean) {
        this.clientId = appClientId;
        this.scopesRequired = scopesRequired;
        // Validate and filter scopes (validate function throws if validation fails)
        this.validateInputScopes(inputScopes);
        const scopeArr = inputScopes ? StringUtils.trimAndConvertArrayEntriesToLowerCase([...inputScopes]) : [this.clientId];
        this.scopes = new Set<string>(scopeArr);
        this.originalScopes = new Set<string>(this.scopes);
    }

    /**
     * Factory method to create ScopeSet from string
     * @param inputScopeString 
     * @param appClientId 
     * @param scopesRequired 
     */
    static fromString(inputScopeString: string, appClientId: string, scopesRequired: boolean) {
        const inputScopes: Array<string> = inputScopeString.split(" ");
        return new ScopeSet(inputScopes, appClientId, scopesRequired);
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
            throw ClientConfigurationError.createEmptyScopesArrayError(inputScopes);
        }

        // Check that clientId is passed as single scope
        if (inputScopes.indexOf(this.clientId) > -1) {
            if (inputScopes.length > 1) {
                throw ClientConfigurationError.createClientIdSingleScopeError(inputScopes);
            }
        }
    }

    /**
     * Check if a given scope is present in this set of scopes.
     * @param scope 
     */
    containsScope(scope: string): boolean {
        return this.scopes.has(scope);
    }

    /**
     * Check if a set of scopes is present in this set of scopes.
     * @param scopeSet 
     */
    containsScopeSet(scopeSet: ScopeSet) {
        if (this.scopes.size < scopeSet.scopes.size) {
            return false;
        } else {
            for (const elem in scopeSet.scopes) {
                if (!this.containsScope(elem)) {
                    return false;
                }
            }
            return true;
        }
    }

    /**
     * Appends single scope if passed
     * @param newScope 
     */
    appendScope(newScope: string): void {
        this.scopes.add(newScope);
    }

    /**
     * Appends multiple scopes if passed
     * @param newScopes 
     */
    appendScopes(newScopes: Array<string>): void {
        this.validateInputScopes(newScopes);
        this.scopes = this.unionScopeSets(newScopes);
    }

    /**
     * Removes element from set of scopes.
     * @param scope 
     */
    removeScope(scope: string): void {
        this.scopes.delete(scope);
    }
    
    /**
     * Combines an array of scopes with the current set of scopes.
     * @param otherScopes 
     */
    unionScopeSets(otherScopes: Array<string>): Set<string> {
        return new Set<string>([...StringUtils.trimAndConvertArrayEntriesToLowerCase(otherScopes), ...Array.from(this.scopes)]);
    }

    /**
     * Check if scopes intersect between this set and another.
     * @param otherScopes 
     */
    intersectingScopeSets(otherScopes: Array<string>) {
        return this.unionScopeSets(otherScopes).size < (this.scopes.size + otherScopes.length);
    }

    /**
     * Returns size of set of scopes.
     */
    getScopeCount(): number {
        return this.scopes.size;
    }

    /**
     * Returns true if the set of original scopes only contained client-id
     */
    isLoginScopeSet(): boolean {
        return this.originalScopes && this.originalScopes.has(this.clientId) && this.originalScopes.size === 1;
    }

    /**
     * Returns the scopes as an array of string values
     */
    asArray(): Array<string> {
        return Array.from(this.scopes);
    }

    /**
     * Returns the original scopes as an array (no extra scopes to consent)
     */
    getOriginalScopesAsArray(): Array<string> {
        return Array.from(this.originalScopes);
    }

    /**
     * Replace client id with the default scopes used for token acquisition.
     */
    printReplacedDefaultScopes(): string {
        const replacedScopes: ScopeSet = new ScopeSet(this.asArray(), this.clientId, this.scopesRequired);
        if (replacedScopes.containsScope(this.clientId)) {
            replacedScopes.removeScope(this.clientId);
            replacedScopes.appendScope(Constants.OPENID_SCOPE);
            replacedScopes.appendScope(Constants.PROFILE_SCOPE);
        }
        replacedScopes.appendScope(Constants.OFFLINE_ACCESS_SCOPE);
        return replacedScopes.printScopes();
    }

    /**
     * Prints scopes into a space-delimited string
     */
    printScopes(): string {
        if (this.scopes) {
            const scopeArr = this.asArray();
            return scopeArr.join(" ");
        }
        return "";
    }
}
