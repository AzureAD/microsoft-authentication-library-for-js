/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAuthority } from "../../core/CustomAuthAuthority.js";
import { DefaultPackageInfo } from "../../CustomAuthConstants.js";
import * as PublicApiId from "../../core/telemetry/PublicApiId.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import {
    AccountInfo,
    ClientAuthError,
    ClientAuthErrorCodes,
    ClientConfiguration,
    CommonSilentFlowRequest,
    RefreshTokenClient,
    ServerTelemetryManager,
    SilentFlowClient,
    UrlString,
} from "@azure/msal-common/browser";
import { AuthenticationResult } from "../../../response/AuthenticationResult.js";
import { ClearCacheRequest } from "../../../request/ClearCacheRequest.js";
import { ApiId } from "../../../utils/BrowserConstants.js";
import { getCurrentUri } from "../../../utils/BrowserUtils.js";
import {
    clearCacheOnLogout,
    initializeServerTelemetryManager,
} from "../../../interaction_client/BaseInteractionClient.js";

export class CustomAuthSilentCacheClient extends CustomAuthInteractionClientBase {
    /**
     * Acquires a token from the cache if it is not expired. Otherwise, makes a request to renew the token.
     * If forceRresh is set to false, then looks up the access token in cache first.
     *   If access token is expired or not found, then uses refresh token to get a new access token.
     *   If no refresh token is found or it is expired, then throws error.
     * If forceRefresh is set to true, then skips token cache lookup and fetches a new token using refresh token
     *   If no refresh token is found or it is expired, then throws error.
     * @param silentRequest The silent request object.
     * @returns {Promise<AuthenticationResult>} The promise that resolves to an AuthenticationResult.
     */
    override async acquireToken(
        silentRequest: CommonSilentFlowRequest
    ): Promise<AuthenticationResult> {
        const telemetryManager = initializeServerTelemetryManager(
            PublicApiId.ACCOUNT_GET_ACCESS_TOKEN,
            this.cfg.auth.clientId,
            this.cId,
            this.bs,
            this.l,
            silentRequest.forceRefresh
        );
        const clientConfig = this.getCustomAuthClientConfiguration(
            telemetryManager,
            this.customAuthAuthority
        );
        const silentFlowClient = new SilentFlowClient(
            clientConfig,
            this.pc
        );

        try {
            this.l.verbose(
                "Starting silent flow to acquire token from cache",
                this.cId
            );

            const result = await silentFlowClient.acquireCachedToken(
                silentRequest
            );

            this.l.verbose(
                "Silent flow to acquire token from cache is completed and token is found",
                this.cId
            );

            return result[0] as AuthenticationResult;
        } catch (error) {
            if (
                error instanceof ClientAuthError &&
                error.errorCode === ClientAuthErrorCodes.tokenRefreshRequired
            ) {
                this.l.verbose(
                    "Token refresh is required to acquire token silently",
                    this.cId
                );

                const refreshTokenClient = new RefreshTokenClient(
                    clientConfig,
                    this.pc
                );

                this.l.verbose(
                    "Starting refresh flow to refresh token",
                    this.cId
                );

                const refreshTokenResult =
                    await refreshTokenClient.acquireTokenByRefreshToken(
                        silentRequest
                    );

                this.l.verbose(
                    "Refresh flow to refresh token is completed",
                    this.cId
                );

                return refreshTokenResult as AuthenticationResult;
            }

            throw error;
        }
    }

    override async logout(logoutRequest?: ClearCacheRequest): Promise<void> {
        const validLogoutRequest = this.initializeLogoutRequest(logoutRequest);

        // Clear the cache
        this.l.verbose(
            "Start to clear the cache",
            logoutRequest?.correlationId
        );
        await clearCacheOnLogout(
            this.bs,
            this.bc,
            this.l,
            this.cId,
            validLogoutRequest?.account
        );
        this.l.verbose("Cache cleared", logoutRequest?.correlationId);

        const postLogoutRedirectUri = this.cfg.auth.postLogoutRedirectUri;

        if (postLogoutRedirectUri) {
            const absoluteRedirectUri = UrlString.getAbsoluteUrl(
                postLogoutRedirectUri,
                getCurrentUri()
            );

            this.l.verbose(
                "Post logout redirect uri is set, redirecting to uri",
                logoutRequest?.correlationId
            );

            // Redirect to post logout redirect uri
            await this.navClient.navigateExternal(absoluteRedirectUri, {
                apiId: ApiId.logout,
                timeout: this.cfg.system.redirectNavigationTimeout,
                noHistory: false,
            });
        }
    }

    getCurrentAccount(correlationId: string): AccountInfo | null {
        let account: AccountInfo | null = null;

        this.l.verbose(
            "Getting the first account from cache.",
            correlationId
        );

        const allAccounts = this.bs.getAllAccounts(
            {},
            correlationId
        );

        if (allAccounts.length > 0) {
            if (allAccounts.length !== 1) {
                this.l.warning(
                    "Multiple accounts found in cache. This is not supported in the Native Auth scenario.",
                    correlationId
                );
            }

            account = allAccounts[0];
        }

        if (account) {
            this.l.verbose("Account data found.", correlationId);
        } else {
            this.l.verbose("No account data found.", correlationId);
        }

        return account;
    }

    private getCustomAuthClientConfiguration(
        serverTelemetryManager: ServerTelemetryManager,
        customAuthAuthority: CustomAuthAuthority
    ): ClientConfiguration {
        const logger = this.cfg.system.loggerOptions;

        return {
            authOptions: {
                clientId: this.cfg.auth.clientId,
                authority: customAuthAuthority,
                clientCapabilities: this.cfg.auth.clientCapabilities,
                redirectUri: this.cfg.auth.redirectUri,
            },
            systemOptions: {
                tokenRenewalOffsetSeconds:
                    this.cfg.system.tokenRenewalOffsetSeconds,
                preventCorsPreflight: true,
            },
            loggerOptions: {
                loggerCallback: logger.loggerCallback,
                piiLoggingEnabled: logger.piiLoggingEnabled,
                logLevel: logger.logLevel,
                correlationId: this.cId,
            },
            cryptoInterface: this.bc,
            networkInterface: this.nc,
            storageInterface: this.bs,
            serverTelemetryManager: serverTelemetryManager,
            libraryInfo: {
                sku: DefaultPackageInfo.SKU,
                version: DefaultPackageInfo.VERSION,
                cpu: DefaultPackageInfo.CPU,
                os: DefaultPackageInfo.OS,
            },
            telemetry: this.cfg.telemetry,
        };
    }
}
