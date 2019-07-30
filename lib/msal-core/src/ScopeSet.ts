// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class ScopeSet {

    /**
   * Check if there are dup scopes in a given request
   *
   * @param cachedScopes
   * @param scopes
   */
  // TODO: Rename this, intersecting scopes isn't a great name for duplicate checker
  static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean {
    cachedScopes = this.convertToLowerCase(cachedScopes);
    for (let i = 0; i < scopes.length; i++) {
      if (cachedScopes.indexOf(scopes[i].toLowerCase()) > -1) {
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
    cachedScopes = this.convertToLowerCase(cachedScopes);
    return scopes.every((value: any): boolean => cachedScopes.indexOf(value.toString().toLowerCase()) >= 0);
  }

  /**
   * toLower
   *
   * @param scopes
   */
  // TODO: Rename this, too generic name for a function that only deals with scopes
  static convertToLowerCase(scopes: Array<string>): Array<string> {
    return scopes.map(scope => scope.toLowerCase());
  }

  /**
   * remove one element from a scope array
   *
   * @param scopes
   * @param scope
   */
  // TODO: Rename this, too generic name for a function that only deals with scopes
  static removeElement(scopes: Array<string>, scope: string): Array<string> {
    return scopes.filter(value => value !== scope);
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
}
