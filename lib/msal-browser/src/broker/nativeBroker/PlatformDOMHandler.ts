/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    createAuthError,
    AuthErrorCodes,
    IPerformanceClient,
    StringDict,
} from "@azure/msal-common/browser";
import {
    PlatformBrokerRequest,
    PlatformDOMTokenRequest,
} from "./NativeRequest.js";
import { createNewGuid } from "../../crypto/BrowserCrypto.js";
import { NativeConstants } from "../../utils/BrowserConstants.js";
import {
    PlatformBrokerResponse,
    PlatformDOMTokenResponse,
} from "./NativeResponse.js";
import { createNativeAuthError } from "../../error/NativeAuthError.js";

export class PlatformDOMHandler {
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;
    protected correlationId: string;
    protected brokerId: string;
    protected extensionVersion: string;

    constructor(
        logger: Logger,
        performanceClient: IPerformanceClient,
        brokerId?: string,
        correlationId?: string
    ) {
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.brokerId = brokerId || NativeConstants.MICROSOFT_ENTRA_BROKERID;
        this.correlationId = correlationId || createNewGuid();
        this.extensionVersion = "";
    }

    /**
     * Returns the Id for the broker extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string {
        return this.brokerId;
    }

    /**
     * Gets the version of the browser this handler is communicating with
     */
    getExtensionVersion(): string | undefined {
        // @ts-ignore
        const userAgent = window.navigator.userAgentData?.getHighEntropyValues([
            "uaFullVersion",
        ]);
        this.extensionVersion = userAgent ? userAgent["uaFullVersion"] : "";
        return this.extensionVersion;
    }

    /**
     * Send token request to platform broker via browser DOM API
     * @param request
     * @returns
     */
    async sendMessage(
        request: PlatformBrokerRequest
    ): Promise<PlatformBrokerResponse> {
        this.logger.trace(
            "PlatformDOMHandler - Sending request to browser DOM API"
        );
        this.logger.tracePii(
            `PlatformDOMHandler - Sending request to browser DOM API: ${JSON.stringify(
                request
            )}`
        );

        try {
            const platformDOMRequest: PlatformDOMTokenRequest =
                await this.initializePlatformDOMRequest(request);
            const response: object =
                // @ts-ignore
                await window.navigator.platformAuthentication.executeGetToken(
                    platformDOMRequest
                );
            const validatedResponse: PlatformDOMTokenResponse =
                this.validateNativeResponse(response);
            return this.convertToNativeResponse(validatedResponse);
        } catch (e) {
            this.logger.error(
                "PlatformDOMHandler: executeGetToken DOM API error"
            );
            throw e;
        }
    }

    private async initializePlatformDOMRequest(
        request: PlatformBrokerRequest
    ): Promise<PlatformDOMTokenRequest> {
        this.logger.trace(
            "NativeInteractionClient: initializeNativeDOMRequest called"
        );

        const {
            accountId,
            clientId,
            authority,
            scope,
            redirectUri,
            correlationId,
            state,
            storeInCache,
            embeddedClientId,
            extraParameters,
            ...remainingProperties
        } = request;

        const validExtraParameters =
            this.stringifyExtraParameters(remainingProperties);

        const platformDOMRequest: PlatformDOMTokenRequest = {
            accountId: accountId,
            brokerId: this.getExtensionId(),
            authority: authority,
            clientId: clientId,
            correlationId: correlationId || this.correlationId,
            extraParameters: { ...extraParameters, ...validExtraParameters },
            isSecurityTokenService: true,
            redirectUri: redirectUri,
            scope: scope,
            state: state,
            storeInCache: storeInCache,
            embeddedClientId: embeddedClientId,
        };

        return platformDOMRequest;
    }

    private validateNativeResponse(response: object): PlatformDOMTokenResponse {
        if (response.hasOwnProperty("isSuccess")) {
            if (
                response.hasOwnProperty("access_token") &&
                response.hasOwnProperty("id_token") &&
                response.hasOwnProperty("client_info") &&
                response.hasOwnProperty("account") &&
                response.hasOwnProperty("scopes") &&
                response.hasOwnProperty("expires_in")
            ) {
                this.logger.trace(
                    "PlatformDOMHandler: platform broker returned successful and valid response"
                );
                return response as PlatformDOMTokenResponse;
            } else if (response.hasOwnProperty("error")) {
                const errorResponse = response as PlatformDOMTokenResponse;
                if (errorResponse.isSuccess === false) {
                    this.logger.trace(
                        "PlatformDOMHandler: platform broker returned error response"
                    );
                    throw createNativeAuthError(
                        errorResponse.error.code,
                        errorResponse.error.description,
                        {
                            error: parseInt(errorResponse.error.errorCode),
                            protocol_error: errorResponse.error.protocolError,
                            status: errorResponse.error.status,
                            properties: errorResponse.error.properties,
                        }
                    );
                }
            }
        }
        throw createAuthError(
            AuthErrorCodes.unexpectedError,
            "Response missing expected properties."
        );
    }

    private convertToNativeResponse(
        response: PlatformDOMTokenResponse
    ): PlatformBrokerResponse {
        this.logger.trace("PlatformDOMHandler: convertToNativeResponse called");
        const nativeResponse: PlatformBrokerResponse = {
            access_token: response.accessToken,
            id_token: response.idToken,
            client_info: response.clientInfo,
            account: response.account,
            expires_in: response.expiresIn,
            scope: response.scopes,
            state: response.state || "",
            properties: response.properties || {},
            extendedLifetimeToken: response.extendedLifetimeToken,
            shr: response.proofOfPossessionPayload,
        };

        return nativeResponse;
    }

    private stringifyExtraParameters(
        extraParameters: Record<string, unknown>
    ): StringDict {
        return Object.entries(extraParameters).reduce(
            (record, [key, value]) => {
                record[key] = String(value);
                return record;
            },
            {} as StringDict
        );
    }
}
