/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientConfigurationError } from "./error/ClientConfigurationError";
import { Constants } from "./utils/Constants";

export class ScopeSet {

    /**
     * Check if there are dup scopes in a given request
     *
     * @param cachedScopes
     * @param scopes
     */
    // TODO: Rename this, intersecting scopes isn't a great name for duplicate checker
    static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean {
        const convertedCachedScopes = this.trimAndConvertArrayToLowerCase([...cachedScopes]);
        const requestScopes = this.trimAndConvertArrayToLowerCase([...scopes]);
        for (let i = 0; i < requestScopes.length; i++) {
            if (convertedCachedScopes.indexOf(requestScopes[i].toLowerCase()) > -1) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if a given scope is present in the request
     *
     * @param cachedScopes
     * @param scopes
     */
    static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean {
        const convertedCachedScopes = this.trimAndConvertArrayToLowerCase([...cachedScopes]);
        const requestScopes = this.trimAndConvertArrayToLowerCase([...scopes]);
        return requestScopes.every((value: any): boolean => convertedCachedScopes.indexOf(value.toString().toLowerCase()) >= 0);
    }

    /**
     *  Trims and converts string to lower case
     *
     * @param scopes
     */
    // TODO: Rename this, too generic name for a function that only deals with scopes
    static trimAndConvertToLowerCase(scope: string): string {
        return scope.trim().toLowerCase();
    }

    /**
     * Performs trimeAndConvertToLowerCase on string array
     * @param scopes 
     */
    static trimAndConvertArrayToLowerCase(scopes: Array<string>): Array<string> {
        return scopes.map(scope => this.trimAndConvertToLowerCase(scope));
    }

    /**
     * remove one element from a scope array
     *
     * @param scopes
     * @param scope
     */
    // TODO: Rename this, too generic name for a function that only deals with scopes
    static removeElement(scopes: Array<string>, scope: string): Array<string> {
        const scopeVal = this.trimAndConvertToLowerCase(scope);
        return scopes.filter(value => value !== scopeVal);
    }

    /**
     * Parse the scopes into a formatted scopeList
     * @param scopes
     */
    static parseScope(scopes: Array<string>): string {
        let scopeList: string = "";
        if (scopes) {
            for (let i: number = 0; i < scopes.length; ++i) {
                scopeList += (i !== scopes.length - 1) ? scopes[i] + " " : scopes[i];
            }
        }

        return scopeList;
    }

    /**
     * @hidden
     *
     * Used to validate the scopes input parameter requested  by the developer.
     * @param {Array<string>} scopes - Developer requested permissions. Not all scopes are guaranteed to be included in the access token returned.
     * @ignore
     */
    static validateInputScope(scopes: Array<string>, scopesRequired: boolean): void {
        // Check if scopes are null or undefined
        if (scopesRequired) {
            // Throws if scopes are non-array, null, or empty array
            if (!Array.isArray(scopes) || scopes.length < 1) {
                throw ClientConfigurationError.createInvalidScopesError(scopes);
            }
        }
    }

    /**
     * @hidden
     *
     * Extracts scope value from the state sent with the authentication request.
     * @param {string} state
     * @returns {string} scope.
     * @ignore
     */
    static getScopeFromState(state: string): string {
        if (state) {
            const splitIndex = state.indexOf(Constants.resourceDelimiter);
            if (splitIndex > -1 && splitIndex + 1 < state.length) {
                return state.substring(splitIndex + 1);
            }
        }
        return "";
    }

    /**
     * @ignore
     * Appends extraScopesToConsent if passed
     * @param {@link AuthenticationParameters}
     */
    static appendScopes(reqScopes: Array<string>, scopesToAppend: Array<string>): Array<string> {
        if(reqScopes) {
            const convertedScopesToAppend = scopesToAppend ? this.trimAndConvertArrayToLowerCase([...scopesToAppend]) : null;
            const convertedReqScopes = this.trimAndConvertArrayToLowerCase([...reqScopes]);
            return convertedScopesToAppend ? [...convertedReqScopes, ...convertedScopesToAppend] : convertedReqScopes;
        }
        return [];
    }

    // #endregion

    /**
     * Add openid and profile to scopes array
     * OIDC required scopes: https://openid.net/specs/openid-connect-basic-1_0.html#Scopes
     * @param scopes
     */
    static generateOidcScopes(scopes: Array<string>): Array<string> {
        const oidcExtendedScopes = [...scopes];
   
        if (oidcExtendedScopes.indexOf(Constants.openidScope) === -1) {
            oidcExtendedScopes.push(Constants.openidScope);
        }
        if (oidcExtendedScopes.indexOf(Constants.profileScope) === -1) {
            oidcExtendedScopes.push(Constants.profileScope);
        }
        
        return oidcExtendedScopes;
    }

    /**
     * Checks if any of the OIDC scopes or client ID are contained in the scopes array
     */
    static isLoginScopes(scopes: Array<string>, clientId: string): boolean {
        if (scopes) {
            const hasOpenIdScope = scopes.indexOf(Constants.openidScope) > -1;
            const hasProfileScope = scopes.indexOf(Constants.profileScope) > -1;
            const hasClientIdScope = scopes.indexOf(clientId) > -1;

            return (hasOpenIdScope ||  hasProfileScope || hasClientIdScope);
        } else {
            return false;
        }
    }

    /**
     * Hard check that both OIDC scopes are included in the scopes array
     */
    static containsOidcScopes(scopes: Array<string>): boolean {
        const hasOpenIdScope = scopes.indexOf(Constants.openidScope) > -1;
        const hasProfileScope = scopes.indexOf(Constants.profileScope) > -1;

        return (hasOpenIdScope && hasProfileScope);
    }

}
