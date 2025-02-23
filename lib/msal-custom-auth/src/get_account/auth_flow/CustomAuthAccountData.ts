/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../configuration/CustomAuthConfiguration.js";
import { SignOutResult } from "./result/SignOutResult.js";
import { GetAccessTokenResult } from "./result/GetAccessTokenResult.js";
import { AccountInfo as AccountData, AccountInfo, TokenClaims } from "@azure/msal-browser";
import { DefaultScopes } from "../../CustomAuthConstants.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import { CustomAuthTokenClient } from "../interaction_client/CustomAuthTokenClient.js";

/*
 * Account information.
 */
export class CustomAuthAccountData {
    /*
     * Constructor
     * @param account - Account information
     * @param correlationId - Correlation id
     * @param config - Configuration
     */
    constructor(
        private readonly account: AccountInfo,
        private readonly config: CustomAuthBrowserConfiguration,
        private readonly tokenClient: CustomAuthTokenClient,
        private readonly correlationId: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("account", account, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("tokenClient", tokenClient, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config, correlationId);
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
    getAccessToken(forceRefresh: boolean = false, scopes?: Array<string>): Promise<GetAccessTokenResult> {
        const newScopes = scopes || DefaultScopes;

        throw new Error(`Method not implemented with forceRefresh '${forceRefresh}' and scopes ${newScopes}.`);
    }
}

/*
 * Authentication token claims.
 */
export type AuthTokenClaims = TokenClaims & {
    [key: string]: string | number | string[] | object | undefined | unknown;
};
