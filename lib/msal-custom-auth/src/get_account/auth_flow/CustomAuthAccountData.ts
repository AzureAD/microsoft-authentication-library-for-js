/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthBrowserConfiguration } from "../../configuration/CustomAuthConfiguration.js";
import { SignOutResult } from "./result/SignOutResult.js";
import { GetAccessTokenResult } from "./result/GetAccessTokenResult.js";
import { AccountInfo, Logger, TokenClaims } from "@azure/msal-browser";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import { CustomAuthSilentCacheClient } from "../interaction_client/CustomAuthSilentCacheClient.js";
import { NoCachedAccountFoundError } from "../../core/error/GetCurrentAccountError.js";

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
        private readonly cacheClient: CustomAuthSilentCacheClient,
        private readonly logger: Logger,
        private readonly correlationId: string,
    ) {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("account", account, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("config", config, correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("cacheClient", cacheClient, correlationId);
        ArgumentValidator.ensureArgumentIsNotEmptyString("correlationId", correlationId);
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("logger", logger, correlationId);
    }

    /*
     * Signs the current user out
     * @param signOutInputs - The inputs for signing out.
     * @returns The result of the operation.
     */
    async signOut(username?: string): Promise<SignOutResult> {
        try {
            const currentAccount = this.cacheClient.getCurrentAccount(username);

            if (!currentAccount) {
                throw new NoCachedAccountFoundError(this.correlationId);
            }

            this.logger.info("Signing out user");

            await this.cacheClient.logout({
                correlationId: this.correlationId,
                account: currentAccount,
            });

            this.logger.info("User signed out");

            return new SignOutResult();
        } catch (error) {
            this.logger.error(`An error occurred during sign out: ${error}`);

            return SignOutResult.createWithError(error);
        }
    }

    /*
     * Gets the account data.
     * @returns The account data.
     */
    getAccount(): AccountInfo {
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
     * @param accessTokenRetrievalInputs - The inputs for retrieving the access token.
     * @returns The result of the operation.
     */
    async getAccessToken(forceRefresh: boolean = false, scopes?: Array<string>): Promise<GetAccessTokenResult> {
        try {
            const response = await this.cacheClient.getAccessToken(this.account, forceRefresh, scopes);
            this.logger.info("Successfully got access token from cache.", this.correlationId);
            return new GetAccessTokenResult(response);
        } catch (error) {
            this.logger.error("Failed to get access token from cache.", this.correlationId);
            return GetAccessTokenResult.createWithError(error);
        }
    }
}

/*
 * Authentication token claims.
 */
export type AuthTokenClaims = TokenClaims & {
    [key: string]: string | number | string[] | object | undefined | unknown;
};
