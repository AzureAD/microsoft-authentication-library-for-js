/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    ApiId,
    AuthenticationResult,
    ClearCacheRequest,
    ClientConfiguration,
    CommonSilentFlowRequest,
    initializeSilentRequest,
    ServerTelemetryManager,
    SilentFlowClient,
    SilentRequest,
} from "@azure/msal-browser";
import { CustomAuthAuthority } from "../../core/CustomAuthAuthority.js";
import { DefaultPackageInfo } from "../../CustomAuthConstants.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import { UrlUtils } from "../../core/utils/UrlUtils.js";

export class CustomAuthSilentCacheClient extends CustomAuthInteractionClientBase {
    /**
     * Get account token for current account.
     * If forceRresh is set to false, then looks up the access token in cache first.
     * If access token is expired or not found, then uses refresh token to get a new access token.
     * If forceRefresh is set to true, then skips token cache lookup and fetches a new token using refresh token
     * If no refresh token is found or expired, then throws error
     * @param account current account
     * @param forceRefresh if true, then skip token cache lookup and force refresh using cached refresh token
     * @param scopes Optional, if not provided, will use default scopes from configuration (openid, profile, offline_access)
     * @returns
     */
    async getAccessToken(
        account: AccountInfo,
        forceRefresh: boolean = false,
        scopes: Array<string>,
    ): Promise<AuthenticationResult> {
        const silentRequest = await this.createCommonSilentFlowRequest(account, forceRefresh, scopes);
        try {
            return await this.acquireToken(silentRequest);
        } catch (error) {
            throw error;
        }
    }

    override async acquireToken(silentRequest: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        const telemetryManager = this.initializeServerTelemetryManager(PublicApiId.ACCOUNT_GET_ACCESS_TOKEN);
        const clientConfig = this.getCustomAuthClientConfiguration(telemetryManager, this.customAuthAuthority);
        const silentFlowClient = new SilentFlowClient(clientConfig, this.performanceClient);

        this.logger.info("Starting silent flow to acquire token", this.correlationId);
        const result = (await silentFlowClient.acquireToken(silentRequest)) as AuthenticationResult;
        this.logger.info("Silent flow to acquire token completed");

        return result;
    }

    override async logout(logoutRequest?: ClearCacheRequest): Promise<void> {
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);

        // Clear the cache
        this.logger.info("Start to clear the cache");
        await this.clearCacheOnLogout(validLogoutRequest?.account);
        this.logger.info("Cache cleared");

        const postLogoutRedirectUri = this.config.auth.postLogoutRedirectUri;

        if (postLogoutRedirectUri) {
            this.logger.info("Post logout redirect uri is set, redirecting to uri");

            if (!UrlUtils.IsValidUrl(postLogoutRedirectUri)) {
                this.logger.warning("Post logout redirect uri is not a valid url");

                return;
            }

            // Redirect to post logout redirect uri
            await this.navigationClient.navigateExternal(postLogoutRedirectUri, {
                apiId: ApiId.logout,
                timeout: this.config.system.redirectNavigationTimeout,
                noHistory: false,
            });
        }
    }

    getCurrentAccount(username?: string): AccountInfo | null {
        let account: AccountInfo | null = null;

        if (!username) {
            // No username provided, get the first account from cache.
            this.logger.info("No username provided. Getting the first account from cache.");

            const allAccounts = this.browserStorage.getAllAccounts();

            if (allAccounts.length > 0) {
                if (allAccounts.length !== 1) {
                    this.logger.warning(
                        "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                    );
                }

                account = allAccounts[0];
            }
        } else {
            // Username provided, get the account by username.
            this.logger.info("Username provided. Getting the account by username.");

            account = this.browserStorage.getAccountInfoFilteredBy({
                username,
            });
        }

        if (account) {
            this.logger.info("Account data found.");
        } else {
            this.logger.info("No account data found.");
        }

        return account;
    }

    private getCustomAuthClientConfiguration(
        serverTelemetryManager: ServerTelemetryManager,
        customAuthAuthority: CustomAuthAuthority,
    ): ClientConfiguration {
        const logger = this.config.system.loggerOptions;

        return {
            authOptions: {
                clientId: this.config.auth.clientId,
                authority: customAuthAuthority,
                clientCapabilities: this.config.auth.clientCapabilities,
                redirectUri: this.config.auth.redirectUri,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds: this.config.system.tokenRenewalOffsetSeconds,
                preventCorsPreflight: true,
            },
            loggerOptions: {
                loggerCallback: logger.loggerCallback,
                piiLoggingEnabled: logger.piiLoggingEnabled,
                logLevel: logger.logLevel,
                correlationId: this.correlationId,
            },
            cacheOptions: {
                claimsBasedCachingEnabled: this.config.cache.claimsBasedCachingEnabled,
            },
            cryptoInterface: this.browserCrypto,
            networkInterface: this.networkClient,
            storageInterface: this.browserStorage,
            serverTelemetryManager: serverTelemetryManager,
            libraryInfo: {
                sku: DefaultPackageInfo.SKU,
                version: DefaultPackageInfo.VERSION,
                cpu: DefaultPackageInfo.CPU,
                os: DefaultPackageInfo.OS,
            },
            telemetry: this.config.telemetry,
        };
    }

    private async createCommonSilentFlowRequest(
        accountInfo: AccountInfo,
        forceRefresh: boolean = false,
        requestScopes: Array<string>,
    ): Promise<CommonSilentFlowRequest> {
        const silentRequest: SilentRequest = {
            authority: this.config.auth.authority,
            correlationId: this.correlationId,
            scopes: requestScopes || [],
            account: accountInfo,
            forceRefresh: forceRefresh,
            storeInCache: {
                idToken: true,
                accessToken: true,
                refreshToken: true,
            },
        };
        const request = {
            ...silentRequest,
            correlationId: this.correlationId,
        };

        return initializeSilentRequest(request, accountInfo, this.config, this.performanceClient, this.logger);
    }
}
