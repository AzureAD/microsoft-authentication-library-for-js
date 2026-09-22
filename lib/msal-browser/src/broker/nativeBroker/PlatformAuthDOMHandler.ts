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
    invokeAsync,
} from "@azure/msal-common/browser";
import {
    DOMExtraParameters,
    PlatformAuthRequest,
    PlatformDOMTokenRequest,
} from "./PlatformAuthRequest.js";
import { PlatformAuthConstants } from "../../utils/BrowserConstants.js";
import {
    PlatformAuthResponse,
    PlatformDOMTokenResponse,
} from "./PlatformAuthResponse.js";
import { createNativeAuthError } from "../../error/NativeAuthError.js";
import { IPlatformAuthHandler } from "./IPlatformAuthHandler.js";
import * as BrowserPerformanceEvents from "../../telemetry/BrowserPerformanceEvents.js";

export class PlatformAuthDOMHandler implements IPlatformAuthHandler {
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;
    protected readonly correlationId: string;
    platformAuthType: string;

    constructor(
        logger: Logger,
        performanceClient: IPerformanceClient,
        correlationId: string
    ) {
        this.logger = logger;
        this.performanceClient = performanceClient;
        this.correlationId = correlationId;
        this.platformAuthType = PlatformAuthConstants.PLATFORM_DOM_PROVIDER;
    }

    static async createProvider(
        logger: Logger,
        performanceClient: IPerformanceClient,
        correlationId: string
    ): Promise<PlatformAuthDOMHandler | undefined> {
        logger.trace(
            "PlatformAuthDOMHandler: createProvider called",
            correlationId
        );
        const createProviderMeasurement = performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthDOMCreateProvider,
            correlationId
        );

        try {
            const platformAuthentication = (
                window.navigator as Navigator & {
                    platformAuthentication?: {
                        getSupportedContracts: (
                            brokerId: string
                        ) => Promise<string[]>;
                    };
                }
            ).platformAuthentication;
            if (!platformAuthentication) {
                createProviderMeasurement.end({
                    success: false,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                });
                return undefined;
            }

            const supportedContracts = (await invokeAsync(
                platformAuthentication.getSupportedContracts.bind(
                    platformAuthentication
                ),
                BrowserPerformanceEvents.PlatformAuthDOMGetSupportedContracts,
                logger,
                performanceClient,
                correlationId
            )(PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID)) as string[];
            const contractSupported = supportedContracts?.includes(
                PlatformAuthConstants.PLATFORM_DOM_APIS
            );
            if (contractSupported) {
                logger.trace(
                    "Platform auth api available in DOM",
                    correlationId
                );
                createProviderMeasurement.end({
                    success: true,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                });
                return new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    correlationId
                );
            }

            createProviderMeasurement.end({
                success: true,
                platformAuthProviderType:
                    PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
            });
            return undefined;
        } catch (e) {
            createProviderMeasurement.end(
                {
                    success: false,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                },
                e
            );
            throw e;
        }
    }

    /**
     * Returns the Id for the broker extension this handler is communicating with
     * @returns
     */
    getExtensionId(): string {
        return PlatformAuthConstants.MICROSOFT_ENTRA_BROKERID;
    }

    getExtensionVersion(): string | undefined {
        return "";
    }

    getExtensionName(): string | undefined {
        return PlatformAuthConstants.DOM_API_NAME;
    }

    /**
     * Send token request to platform broker via browser DOM API
     * @param request
     * @returns
     */
    async sendMessage(
        request: PlatformAuthRequest
    ): Promise<PlatformAuthResponse> {
        const correlationId = this.getCorrelationId(request.correlationId);
        const sendMessageMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthDOMGetToken,
            correlationId
        );
        this.logger.trace(
            `'${this.platformAuthType}' - Sending request to browser DOM API`,
            correlationId
        );

        try {
            const platformDOMRequest: PlatformDOMTokenRequest =
                this.initializePlatformDOMRequest(request);
            const response: object =
                // @ts-ignore
                await window.navigator.platformAuthentication.executeGetToken(
                    platformDOMRequest
                );
            const validatedResponse = this.validatePlatformBrokerResponse(
                response,
                correlationId
            );
            sendMessageMeasurement.end({
                success: true,
                platformAuthProviderType: this.platformAuthType,
            });
            return validatedResponse;
        } catch (e) {
            this.logger.error(
                `'${this.platformAuthType}' - executeGetToken DOM API error`,
                correlationId
            );
            sendMessageMeasurement.end(
                {
                    success: false,
                    platformAuthProviderType: this.platformAuthType,
                },
                e
            );
            throw e;
        }
    }

    private initializePlatformDOMRequest(
        request: PlatformAuthRequest
    ): PlatformDOMTokenRequest {
        const {
            accountId,
            clientId,
            authority,
            scope,
            redirectUri,
            correlationId,
            state,
            preferBinding,
            enclave,
            reqCnf,
            extraParametersNoCache,
            extraParameters,
            ...remainingProperties
        } = request;
        const requestCorrelationId = this.getCorrelationId(correlationId);
        this.logger.trace(
            `'${this.platformAuthType}' - initializeNativeDOMRequest called`,
            requestCorrelationId
        );
        delete remainingProperties.resourceRequestMethod;
        delete remainingProperties.resourceRequestUri;

        const validExtraParameters: DOMExtraParameters = this.getDOMExtraParams(
            remainingProperties,
            requestCorrelationId
        );
        const platformDOMRequest: PlatformDOMTokenRequest = {
            accountId: accountId,
            brokerId: this.getExtensionId(),
            authority: authority,
            clientId: clientId,
            correlationId: requestCorrelationId,
            extraParameters: {
                ...extraParameters,
                ...validExtraParameters,
            },
            isSecurityTokenService: false,
            redirectUri: redirectUri,
            scope: scope,
            state: state,
            preferBinding: preferBinding,
            enclave: enclave,
            requestConfirmation: reqCnf,
            extraParametersNoCache,
        };

        return platformDOMRequest;
    }

    private validatePlatformBrokerResponse(
        response: object,
        correlationId?: string
    ): PlatformAuthResponse {
        const responseCorrelationId = this.getCorrelationId(correlationId);
        const validationMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthDOMValidateResponse,
            responseCorrelationId
        );
        if (
            response &&
            Object.prototype.hasOwnProperty.call(response, "isSuccess")
        ) {
            if (
                Object.prototype.hasOwnProperty.call(response, "accessToken") &&
                Object.prototype.hasOwnProperty.call(response, "idToken") &&
                Object.prototype.hasOwnProperty.call(response, "clientInfo") &&
                Object.prototype.hasOwnProperty.call(response, "account") &&
                Object.prototype.hasOwnProperty.call(response, "scopes") &&
                Object.prototype.hasOwnProperty.call(response, "expiresIn")
            ) {
                this.logger.trace(
                    `'${this.platformAuthType}' - platform broker returned successful and valid response`,
                    responseCorrelationId
                );
                const validatedResponse = this.convertToPlatformBrokerResponse(
                    response as PlatformDOMTokenResponse,
                    responseCorrelationId
                );
                validationMeasurement.end({
                    success: true,
                    platformAuthProviderType: this.platformAuthType,
                });
                return validatedResponse;
            } else if (
                Object.prototype.hasOwnProperty.call(response, "error")
            ) {
                const errorResponse = response as PlatformDOMTokenResponse;
                if (
                    errorResponse.isSuccess === false &&
                    errorResponse.error &&
                    errorResponse.error.code
                ) {
                    this.logger.trace(
                        `'${this.platformAuthType}' - platform broker returned error response`,
                        responseCorrelationId
                    );
                    validationMeasurement.end({
                        success: true,
                        platformAuthProviderType: this.platformAuthType,
                    });
                    throw createNativeAuthError(
                        errorResponse.error.code,
                        responseCorrelationId,
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
        const error = createAuthError(
            AuthErrorCodes.unexpectedError,
            responseCorrelationId,
            "Response missing expected properties."
        );
        validationMeasurement.end(
            {
                success: false,
                platformAuthProviderType: this.platformAuthType,
            },
            error
        );
        throw error;
    }

    private getCorrelationId(correlationId?: string): string {
        return correlationId || this.correlationId;
    }

    private convertToPlatformBrokerResponse(
        response: PlatformDOMTokenResponse,
        correlationId: string
    ): PlatformAuthResponse {
        this.logger.trace(
            `'${this.platformAuthType}' - convertToNativeResponse called`,
            correlationId
        );
        const responseProperties = response.properties || {};
        const bindingAttested = this.parseDOMBoolean(
            responseProperties.binding_attested,
            "binding_attested",
            correlationId
        );
        const nativeResponse: PlatformAuthResponse = {
            access_token: response.accessToken,
            id_token: response.idToken,
            client_info: response.clientInfo,
            account: response.account,
            expires_in: response.expiresIn,
            scope: response.scopes,
            state: response.state || "",
            properties: responseProperties,
            extendedLifetimeToken: response.extendedLifetimeToken ?? false,
            shr: response.proofOfPossessionPayload,
            token_type: responseProperties.token_type,
            DPoP: responseProperties.dpop_proof,
            binding_attested: bindingAttested,
        };

        return nativeResponse;
    }

    private parseDOMBoolean(
        value: string | undefined,
        propertyName: string,
        correlationId: string
    ): boolean | undefined {
        if (value === undefined) {
            return undefined;
        }

        if (value === "true" || value === "false") {
            return value === "true";
        }

        throw createAuthError(
            AuthErrorCodes.unexpectedError,
            correlationId,
            `Platform broker returned invalid ${propertyName} value.`
        );
    }

    private getDOMExtraParams(
        extraParameters: Record<string, unknown>,
        correlationId: string
    ): DOMExtraParameters {
        try {
            const stringifiedProperties: StringDict = {};
            for (const [key, value] of Object.entries(extraParameters)) {
                if (!value) {
                    continue;
                }
                if (typeof value === "object") {
                    stringifiedProperties[key] = JSON.stringify(value);
                } else {
                    stringifiedProperties[key] = String(value);
                }
            }
            return stringifiedProperties;
        } catch (e) {
            this.logger.error(
                `'${this.platformAuthType}' - Error stringifying extra parameters`,
                correlationId
            );
            this.logger.errorPii(
                `'${this.platformAuthType}' - Error stringifying extra parameters: '${e}'`,
                correlationId
            );
            return {};
        }
    }
}
