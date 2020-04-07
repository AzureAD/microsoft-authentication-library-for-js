/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringUtils } from "../utils/StringUtils";
import { Constants } from "../utils/Constants";
import { ClientAuthError } from "../error/ClientAuthError";

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

    constructor(
        inputScopes: Array<string>,
        clientId: string,
        scopesRequired: boolean,
    ) {
        this.clientId = clientId;
        this.scopesRequired = scopesRequired;

        // Filter empty string and null/undefined array items
        const filteredInput = (inputScopes)
            ? StringUtils.removeEmptyStringsFromArray(inputScopes)
            : inputScopes;

        // Validate and filter scopes (validate function throws if validation fails)
        this.validateInputScopes(filteredInput);

        const scopeArr = filteredInput? StringUtils.trimAndConvertArrayEntriesToLowerCase([...filteredInput]): [];
        this.scopes = new Set<string>(scopeArr);
        if (!this.scopesRequired) {
            this.appendScope(this.clientId);
        }
        this.originalScopes = new Set<string>(this.scopes);

        this.replaceDefaultScopes();
    }

    /**
     * Factory method to create ScopeSet from space-delimited string
     * @param inputScopeString
     * @param appClientId
     * @param scopesRequired
    */
    static fromString(
        inputScopeString: string,
        appClientId: string,
        scopesRequired: boolean
    ): ScopeSet {
        inputScopeString = inputScopeString || "";
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
            // Check if scopes are required but not given or is an empty array
            if (!inputScopes || inputScopes.length < 1) {
                throw ClientConfigurationError.createEmptyScopesArrayError(
                    inputScopes
                );
            }
        }

        // Check that scopes is an array object
        if (!Array.isArray(inputScopes)) {
            throw ClientConfigurationError.createScopesNonArrayError(
                inputScopes
            );
        }
    }

    /**
     * Check if a given scope is present in this set of scopes.
     * @param scope
     */
    containsScope(scope: string): boolean {
        return !StringUtils.isEmpty(scope) ? this.scopes.has(scope) : false;
    }

    /**
     * Check if a set of scopes is present in this set of scopes.
     * @param scopeSet
     */
    containsScopeSet(scopeSet: ScopeSet): boolean {
        if (!scopeSet) {
            return false;
        }
        return (
            this.scopes.size >= scopeSet.scopes.size &&
                   scopeSet.asArray().every(scope => this.containsScope(scope))
        );
    }

    /**
     * Appends single scope if passed
     * @param newScope
     */
    appendScope(newScope: string): void {
        if (StringUtils.isEmpty(newScope)) {
            throw ClientAuthError.createAppendEmptyScopeToSetError(
                newScope
            );
        }
        this.scopes.add(newScope.trim().toLowerCase());
    }

    /**
     * Appends multiple scopes if passed
     * @param newScopes
     */
    appendScopes(newScopes: Array<string>): void {
        try {
            const newScopeSet = new ScopeSet(
                newScopes,
                this.clientId,
                this.scopesRequired
            );
            this.scopes = this.unionScopeSets(newScopeSet);
        } catch (e) {
            throw ClientAuthError.createAppendScopeSetError(e);
        }
    }

    /**
     * Removes element from set of scopes.
     * @param scope
     */
    removeScope(scope: string): void {
        if (StringUtils.isEmpty(scope)) {
            throw ClientAuthError.createRemoveEmptyScopeFromSetError(
                scope
            );
        }
        this.scopes.delete(scope.trim().toLowerCase());
    }

    /**
     * Combines an array of scopes with the current set of scopes.
     * @param otherScopes
     */
    unionScopeSets(otherScopes: ScopeSet): Set<string> {
        if (!otherScopes) {
            throw ClientAuthError.createEmptyInputScopeSetError(
                otherScopes
            );
        }
        return new Set<string>([
            ...otherScopes.asArray(),
            ...Array.from(this.scopes)
        ]);
    }

    /**
     * Check if scopes intersect between this set and another.
     * @param otherScopes
     */
    intersectingScopeSets(otherScopes: ScopeSet): boolean {
        if (!otherScopes) {
            throw ClientAuthError.createEmptyInputScopeSetError(
                otherScopes
            );
        }
        return (
            this.unionScopeSets(otherScopes).size < this.scopes.size + otherScopes.getScopeCount()
        );
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
        const hasLoginScopes =
                   this.originalScopes.has(this.clientId) ||
                   this.originalScopes.has(Constants.OPENID_SCOPE) ||
                   this.originalScopes.has(Constants.PROFILE_SCOPE);
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
