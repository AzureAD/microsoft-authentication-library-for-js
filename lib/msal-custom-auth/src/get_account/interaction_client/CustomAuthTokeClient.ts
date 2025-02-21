/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationResult,
    ClearCacheRequest,
    ClientConfiguration,
    CommonSilentFlowRequest,
    ServerTelemetryManager,
    SilentFlowClient,
} from "@azure/msal-browser";
import { CustomAuthAuthority } from "../../core/CustomAuthAuthority.js";
import { DefaultPackageInfo } from "../../CustomAuthConstants.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";

export class CustomAuthTokenClient extends CustomAuthInteractionClientBase {
    override async acquireToken(silentRequest: CommonSilentFlowRequest): Promise<AuthenticationResult> {
        const telemetryManager = this.initializeServerTelemetryManager(PublicApiId.ACCOUNT_GET_ACCESS_TOKEN);
        const clientConfig = this.getCustomAuthClientConfiguration(telemetryManager, this.customAuthAuthority);
        const silentFlowClient = new SilentFlowClient(clientConfig, this.performanceClient);

        this.logger.info("Starting silent flow to acquire token");

        const result = (await silentFlowClient.acquireToken(silentRequest)) as AuthenticationResult;

        return result;
    }

    override async logout(logoutRequest?: ClearCacheRequest): Promise<void> {
        // TODO: Implement logout
        throw new Error("Method not implemented." + logoutRequest);
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
}
