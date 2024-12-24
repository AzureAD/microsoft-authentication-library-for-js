/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthConfiguration } from "../../../configuration/CustomAuthConfiguration.js";
import { SignOutResult } from "../result/SignOutResult.js";
import { GetAccessTokenResult } from "../result/GetAccessTokenResult.js";
import {
    AccountInfo as AccountData,
//    Constants,
    TokenClaims,
} from "@azure/msal-browser";
import { InvalidArgumentError } from "../../../core/error/InvalidArgumentError.js";
/*
 * import {
 *     GetAccessTokenError,
 *     InvalidScopes,
 * } from "../../../core/error/GetAccessTokenError.js";
 */
import { DefaultScopes } from "../../../CustomAuthConstants.js";

/*
 * Account information.
 */
export class AccountInfo {
    /*
     * Constructor
     * @param account - Account data
     * @param correlationId - Correlation id
     * @param config - Configuration
     */
    constructor(
        private readonly account: AccountData,
        private readonly correlationId: string,
        private readonly config: CustomAuthConfiguration
    ) {
        if (!config) {
            throw new InvalidArgumentError("config", correlationId);
        }

        if (!account) {
            throw new InvalidArgumentError("account", correlationId);
        }

        if (!correlationId) {
            throw new InvalidArgumentError("correlationId");
        }
    }

    /*
     * Signs the current user out
     * @returns The result of the operation.
     */
    signOut(): Promise<SignOutResult> {
        throw new Error("Method not implemented.");
    }

    /*
     * Gets the account data.
     * @returns The account data.
     */
    getAccount(): AccountData {
        return this.account;
    }

    /*
     * Gets the account id-token.
     * @returns The account id-token.
     */
    getIdToken(): string | undefined {
        return this.account.idToken;
    }

    /*
     * Gets the token claims.
     * @returns The token claims.
     */
    getClaims(): AuthTokenClaims | undefined {
        return this.account.idTokenClaims;
    }

    /*
     * Gets the access token from cache.
     * @param forceRefresh - Force a token refresh
     * @param scopes - The scopes to request
     * @returns The result of the operation.
     */
    getAccessToken(
        forceRefresh: boolean = false,
        scopes?: Array<string>
    ): Promise<GetAccessTokenResult> {
        const newScopes = scopes || DefaultScopes;

        throw new Error(
            `Method not implemented with forceRefresh '${forceRefresh}' and scopes ${newScopes}.`
        );
    }
}

/*
 * Authentication token claims.
 */
type AuthTokenClaims =
    | TokenClaims & {
          [key: string]:
              | string
              | number
              | string[]
              | object
              | undefined
              | unknown;
      };
