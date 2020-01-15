/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
// Error
import { ClientConfigurationError } from "../error/ClientConfigurationError";
// Utils
import { StringUtils } from "../utils/StringUtils";
// Constants
import { Constants } from "../utils/Constants";

/**
 * The ScopeSet class creates a set of scopes. Scopes are case-insensitive, unique values, so the Set object in JS makes
 * the most sense to implement for this class. All scopes are trimmed and converted to lower case strings to ensure uniqueness of strings.
 */
export class ScopeSet {
    // Client ID of application
    private clientId: string;
    // Scopes as a Set of strings
    private scopes: Set<string>;
    // Original scopes passed to constructor. Usually used for caching or telemetry.
    private originalScopes: Set<string>;
    // Boolean denoting whether scopes are required. Usually used for validation.
    private scopesRequired: boolean;

    constructor(inputScopes: Array<string>, appClientId: string, scopesRequired: boolean) {
        this.clientId = appClientId;
        this.scopesRequired = scopesRequired;
        // Validate and filter scopes (validate function throws if validation fails)
        this.validateInputScopes(inputScopes);
        const scopeArr = inputScopes ? StringUtils.trimAndConvertArrayEntriesToLowerCase([...inputScopes]) : [];
        this.scopes = new Set<string>(scopeArr);
        this.originalScopes = new Set<string>(this.scopes);
        if (!this.scopesRequired) {
            this.appendScope(this.clientId);
        }
        this.replaceDefaultScopes();
    }

    /**
     * Factory method to create ScopeSet from string
     * @param inputScopeString 
     * @param appClientId 
     * @param scopesRequired 
     */
    static fromString(inputScopeString: string, appClientId: string, scopesRequired: boolean): ScopeSet {
        const inputScopes: Array<string> = inputScopeString.split(" ");
        return new ScopeSet(inputScopes, appClientId, scopesRequired);
    }

    /**
     * Replace client id with the default scopes used for token acquisition.
     */
    private replaceDefaultScopes(): void {
        if (this.scopes.has(this.clientId)) {
            this.removeScope(this.clientId);
            this.appendScope(Constants.OPENID_SCOPE);
            this.appendScope(Constants.PROFILE_SCOPE);
        }
        this.appendScope(Constants.OFFLINE_ACCESS_SCOPE);
    }

    /**
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} inputScopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @param {boolean} scopesRequired - Boolean indicating whether the scopes array is required or not
     */
    private validateInputScopes(inputScopes: Array<string>): void {
        if (this.scopesRequired) {
            // Scopes are required but not given
            if (!inputScopes) {
                throw ClientConfigurationError.createScopesRequiredError(inputScopes);
            }

            // Check that scopes is not an empty array
            if (inputScopes.length < 1) {
                throw ClientConfigurationError.createEmptyScopesArrayError(inputScopes);
            }
        }

        // Check that scopes is an array object
        if (inputScopes && !Array.isArray(inputScopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(inputScopes);
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
    containsScopeSet(scopeSet: ScopeSet): boolean {
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
        const newScopeSet = new ScopeSet(newScopes, this.clientId, false);
        this.scopes = this.unionScopeSets(newScopeSet);
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
    unionScopeSets(otherScopes: ScopeSet): Set<string> {
        return new Set<string>([...otherScopes.asArray(), ...Array.from(this.scopes)]);
    }

    /**
     * Check if scopes intersect between this set and another.
     * @param otherScopes 
     */
    intersectingScopeSets(otherScopes: ScopeSet): boolean {
        return this.unionScopeSets(otherScopes).size < (this.scopes.size + otherScopes.getScopeCount());
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
        const hasLoginScopes = (
            this.originalScopes.has(this.clientId) ||
            this.originalScopes.has(Constants.OPENID_SCOPE) ||
            this.originalScopes.has(Constants.PROFILE_SCOPE)
        );
        return this.originalScopes && hasLoginScopes;
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
