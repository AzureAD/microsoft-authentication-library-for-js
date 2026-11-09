/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Logger,
    AuthError,
    createAuthError,
    AuthErrorCodes,
    IPerformanceClient,
    StringDict,
    invoke,
    invokeAsync,
} from "@azure/msal-common/browser";
import {
    DOMExtraParameters,
    PlatformAuthBindingPreference,
    PlatformAuthRequest,
    PlatformAuthTokenType,
    PlatformDOMTokenRequest,
} from "./PlatformAuthRequest.js";
import { PlatformAuthConstants } from "../../utils/BrowserConstants.js";
import {
    PlatformAuthResponse,
    PlatformDOMTokenResponse,
} from "./PlatformAuthResponse.js";
import {
    createNativeAuthError,
    NativeAuthErrorCodes,
} from "../../error/NativeAuthError.js";
import * as NativeStatusCodes from "./NativeStatusCodes.js";
import { IPlatformAuthHandler } from "./IPlatformAuthHandler.js";
import * as BrowserPerformanceEvents from "../../telemetry/BrowserPerformanceEvents.js";
import {
    isDpopBrokerTokenType,
    validateDpopBrokerOutcome,
} from "./PlatformAuthDpop.js";

const DOM_DPOP_ERROR_CODES = new Set<string>([
    ...Object.values(NativeAuthErrorCodes),
    "NoSupport",
    "BadState",
    "OSError",
    "BrokerError",
]);

export class PlatformAuthDOMHandler implements IPlatformAuthHandler {
    protected logger: Logger;
    protected performanceClient: IPerformanceClient;
    protected readonly correlationId: string;
    private dpopSupported = false;
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
                createProviderMeasurement.add({
                    platformAuthProviderAvailable: false,
                });
                createProviderMeasurement.end({
                    platformAuthProviderAvailable: false,
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
            const contractSupported =
                Array.isArray(supportedContracts) &&
                supportedContracts.includes(
                    PlatformAuthConstants.PLATFORM_DOM_APIS
                );
            if (contractSupported) {
                logger.trace(
                    "Platform auth api available in DOM",
                    correlationId
                );
                createProviderMeasurement.add({
                    platformAuthProviderAvailable: true,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                });
                createProviderMeasurement.end({
                    platformAuthProviderAvailable: true,
                    platformAuthProviderType:
                        PlatformAuthConstants.PLATFORM_DOM_PROVIDER,
                });
                const provider = new PlatformAuthDOMHandler(
                    logger,
                    performanceClient,
                    correlationId
                );
                provider.dpopSupported = true;
                return provider;
            }
            createProviderMeasurement.add({
                platformAuthProviderAvailable: false,
            });
            createProviderMeasurement.end({
                platformAuthProviderAvailable: false,
            });
            return undefined;
        } catch (e) {
            createProviderMeasurement.add({
                platformAuthProviderAvailable: false,
            });
            createProviderMeasurement.end(
                {
                    platformAuthProviderAvailable: false,
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
     * Whether discovery advertised the contract required for DOM DPoP.
     */
    isDpopSupported(): boolean {
        return this.dpopSupported;
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
        sendMessageMeasurement.add({
            platformAuthProviderType: this.platformAuthType,
        });
        this.logger.trace(
            `'${this.platformAuthType}' - Sending request to browser DOM API`,
            correlationId
        );

        try {
            const isDpopRequest = isDpopBrokerTokenType(request.tokenType);
            if (isDpopRequest && !this.dpopSupported) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    correlationId,
                    "Platform authentication DOM contract is unavailable."
                );
            }
            if (
                isDpopRequest &&
                (request.tokenType !== PlatformAuthTokenType.DPOP_WITH_PROOF ||
                    typeof request.keyId !== "string" ||
                    !request.keyId.trim() ||
                    typeof request.reqCnf !== "string" ||
                    !request.reqCnf.trim() ||
                    (request.preferBinding !== undefined &&
                        request.preferBinding !==
                            PlatformAuthBindingPreference.ATTESTED))
            ) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    correlationId,
                    "DPoP request key binding is incomplete."
                );
            }
            const platformDOMRequest = invoke(
                this.initializePlatformDOMRequest.bind(this),
                BrowserPerformanceEvents.PlatformAuthDOMInitializeRequest,
                this.logger,
                this.performanceClient,
                correlationId
            )(request);
            if (isDpopRequest) {
                request.bindingPreferenceSent =
                    platformDOMRequest.preferBinding !== undefined;
            }
            const response: object =
                // @ts-ignore
                await window.navigator.platformAuthentication.executeGetToken(
                    platformDOMRequest
                );
            const validatedResponse = this.validatePlatformBrokerResponse(
                response,
                correlationId,
                request
            );
            sendMessageMeasurement.end({
                success: true,
                platformAuthProviderType: this.platformAuthType,
            });
            return validatedResponse;
        } catch (e) {
            const error =
                isDpopBrokerTokenType(request.tokenType) &&
                !(e instanceof AuthError)
                    ? createAuthError(
                          AuthErrorCodes.unexpectedError,
                          correlationId,
                          "Platform authentication DOM request failed."
                      )
                    : e;
            this.logger.error(
                `'${this.platformAuthType}' - executeGetToken DOM API error`,
                correlationId
            );
            sendMessageMeasurement.end(
                {
                    success: false,
                    platformAuthProviderType: this.platformAuthType,
                },
                error
            );
            throw error;
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
        delete remainingProperties.bindingPreferenceSent;

        const validExtraParameters: DOMExtraParameters = this.getDOMExtraParams(
            remainingProperties,
            requestCorrelationId
        );
        const isDpopRequest = isDpopBrokerTokenType(request.tokenType);
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
            extraParametersNoCache: extraParametersNoCache && {
                ...extraParametersNoCache,
            },
        };
        delete platformDOMRequest.extraParameters?.bindingPreferenceSent;
        delete platformDOMRequest.extraParametersNoCache?.bindingPreferenceSent;
        if (isDpopRequest) {
            delete platformDOMRequest.extraParameters?.reqCnf;
            delete platformDOMRequest.extraParameters?.requestConfirmation;
            delete platformDOMRequest.extraParameters?.preferBinding;
            delete platformDOMRequest.extraParameters?.signPopToken;
            delete platformDOMRequest.extraParameters?.keyId;
        }

        return platformDOMRequest;
    }

    private validatePlatformBrokerResponse(
        response: object,
        correlationId: string,
        request?: PlatformAuthRequest
    ): PlatformAuthResponse {
        const validationMeasurement = this.performanceClient.startMeasurement(
            BrowserPerformanceEvents.PlatformAuthDOMValidateResponse,
            correlationId
        );
        const requiredKeys = [
            "accessToken",
            "idToken",
            "clientInfo",
            "account",
            "scopes",
            "expiresIn",
        ];
        const isValid =
            response &&
            requiredKeys.every((key) =>
                Object.prototype.hasOwnProperty.call(response, key)
            );
        if (
            response &&
            Object.prototype.hasOwnProperty.call(response, "isSuccess")
        ) {
            if (
                isValid &&
                (response as PlatformDOMTokenResponse).isSuccess === true
            ) {
                this.logger.trace(
                    `'${this.platformAuthType}' - platform broker returned successful and valid response`,
                    correlationId
                );
                try {
                    const validatedResponse =
                        this.convertToPlatformBrokerResponse(
                            response as PlatformDOMTokenResponse,
                            correlationId
                        );
                    if (request) {
                        this.validateDpopResponse(
                            response as PlatformDOMTokenResponse,
                            validatedResponse,
                            request,
                            correlationId
                        );
                    }
                    validationMeasurement.end({
                        success: true,
                        platformAuthProviderType: this.platformAuthType,
                    });
                    return validatedResponse;
                } catch (e) {
                    validationMeasurement.end(
                        {
                            success: false,
                            platformAuthProviderType: this.platformAuthType,
                        },
                        e
                    );
                    throw e;
                }
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
                        correlationId
                    );
                    const isDpopRequest = isDpopBrokerTokenType(
                        request?.tokenType
                    );
                    const nativeError = errorResponse.error;
                    const code =
                        isDpopRequest &&
                        !DOM_DPOP_ERROR_CODES.has(nativeError.code)
                            ? AuthErrorCodes.unexpectedError
                            : nativeError.code;
                    const status =
                        isDpopRequest &&
                        nativeError.status !== "THROTTLED" &&
                        !Object.values(NativeStatusCodes).some(
                            (value) => value === nativeError.status
                        )
                            ? undefined
                            : nativeError.status;
                    const numericError = Number(nativeError.errorCode);
                    const nativeAuthError = createNativeAuthError(
                        code,
                        correlationId,
                        isDpopRequest ? undefined : nativeError.description,
                        {
                            error: isDpopRequest
                                ? Number.isInteger(numericError) &&
                                  numericError >= -2147483648 &&
                                  numericError <= 2147483647
                                    ? numericError
                                    : undefined
                                : parseInt(nativeError.errorCode),
                            protocol_error: isDpopRequest
                                ? undefined
                                : nativeError.protocolError,
                            status,
                            properties: isDpopRequest
                                ? undefined
                                : nativeError.properties,
                        }
                    );
                    validationMeasurement.end(
                        {
                            success: false,
                            platformAuthProviderType: this.platformAuthType,
                            brokerErrorName: code,
                            brokerErrorCode: isDpopRequest
                                ? undefined
                                : nativeError.errorCode,
                        },
                        nativeAuthError
                    );
                    throw nativeAuthError;
                }
            }
        }
        const error = createAuthError(
            AuthErrorCodes.unexpectedError,
            correlationId,
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

    /**
     * Validates DOM response shape before applying the shared broker outcome contract.
     */
    private validateDpopResponse(
        response: PlatformDOMTokenResponse,
        normalizedResponse: PlatformAuthResponse,
        request: PlatformAuthRequest,
        correlationId: string
    ): void {
        const properties = response.properties;
        const rawResponse = response as unknown as Record<string, unknown>;
        const isDpopResponse =
            isDpopBrokerTokenType(properties?.token_type) ||
            properties?.dpop_proof !== undefined ||
            properties?.DPoP !== undefined ||
            properties?.binding_attested !== undefined;
        if (isDpopBrokerTokenType(request.tokenType) || isDpopResponse) {
            if (
                (properties !== undefined &&
                    (!properties ||
                        typeof properties !== "object" ||
                        Array.isArray(properties))) ||
                response.error?.code ||
                typeof response.accessToken !== "string" ||
                !response.accessToken.trim() ||
                typeof response.idToken !== "string" ||
                !response.idToken.trim() ||
                typeof response.clientInfo !== "string" ||
                !response.clientInfo.trim() ||
                typeof response.scopes !== "string" ||
                !response.scopes.trim() ||
                !Number.isSafeInteger(response.expiresIn) ||
                response.expiresIn < 0 ||
                !response.account ||
                typeof response.account !== "object" ||
                Array.isArray(response.account) ||
                typeof response.account.id !== "string" ||
                !response.account.id.trim() ||
                typeof response.account.userName !== "string" ||
                (response.account.properties !== undefined &&
                    response.account.properties !== null &&
                    (typeof response.account.properties !== "object" ||
                        Array.isArray(response.account.properties) ||
                        Object.values(response.account.properties).some(
                            (value) => typeof value !== "string"
                        ))) ||
                (response.state !== undefined &&
                    response.state !== null &&
                    typeof response.state !== "string") ||
                (response.extendedLifetimeToken !== undefined &&
                    typeof response.extendedLifetimeToken !== "boolean") ||
                properties?.dpop_proof !== undefined ||
                response.proofOfPossessionPayload !== undefined ||
                rawResponse.token_type !== undefined ||
                rawResponse.DPoP !== undefined ||
                rawResponse.dpop_proof !== undefined ||
                rawResponse.binding_attested !== undefined
            ) {
                throw createAuthError(
                    AuthErrorCodes.unexpectedError,
                    correlationId,
                    "Conflicting DPoP DOM response."
                );
            }
        }
        validateDpopBrokerOutcome(
            normalizedResponse,
            request,
            correlationId,
            this.performanceClient
        );
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
            isDpopBrokerTokenType(responseProperties.token_type) &&
                typeof responseProperties.binding_attested === "string"
                ? responseProperties.binding_attested.trim().toLowerCase()
                : responseProperties.binding_attested,
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
            DPoP: responseProperties.DPoP,
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
            return {};
        }
    }
}
