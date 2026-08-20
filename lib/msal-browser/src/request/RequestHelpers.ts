/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AccountInfo,
    Constants,
    BaseAuthRequest,
    ClientConfigurationErrorCodes,
    CommonAuthorizationUrlRequest,
    CommonSilentFlowRequest,
    IPerformanceClient,
    ITokenBindingKeyManager,
    Logger,
    ProtocolMode,
    JsonWebTokenAlgorithms,
    PerformanceEvents,
    PopTokenGenerator,
    createClientConfigurationError,
    invokeAsync,
} from "@azure/msal-common/browser";
import * as BrowserPerformanceEvents from "../telemetry/BrowserPerformanceEvents.js";
import { BrowserConfiguration } from "../config/Configuration.js";
import { SilentRequest } from "./SilentRequest.js";
import { PopupRequest } from "./PopupRequest.js";
import { RedirectRequest } from "./RedirectRequest.js";
import { CryptoOps } from "../crypto/CryptoOps.js";

const SUPPORTED_AUTHENTICATION_SCHEMES = new Set<string>([
    Constants.AuthenticationScheme.BEARER,
    Constants.AuthenticationScheme.POP,
    Constants.AuthenticationScheme.DPOP,
    Constants.AuthenticationScheme.SSH,
]);

function validateSshRequest(
    request: Partial<BaseAuthRequest>,
    correlationId: string
): void {
    if (!request.sshJwk) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.missingSshJwk,
            correlationId
        );
    }
    if (!request.sshKid) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.missingSshKid,
            correlationId
        );
    }
}

function validateDpopRequest(
    request: Partial<BaseAuthRequest>,
    correlationId: string
): void {
    if (
        !request.resourceRequestMethod?.trim() ||
        !request.resourceRequestUri?.trim()
    ) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.dpopMissingResourceContext,
            correlationId
        );
    }
}

/**
 * Resolves the token-binding parameters needed before building authorize or token requests.
 * Public PCA DPoP requests use a dpopJkt thumbprint, while platform broker PoP requests use
 * a reqCnf confirmation claim. Requests that do not require request-time token binding return
 * no additional parameters.
 */
export async function getTokenBindingRequestParams(
    request: Partial<BaseAuthRequest> & {
        correlationId: string;
        platformBroker?: boolean;
    },
    tokenBindingKeyManager: ITokenBindingKeyManager,
    logger: Logger,
    performanceClient: IPerformanceClient
): Promise<Pick<CommonAuthorizationUrlRequest, "dpopJkt" | "reqCnf">> {
    switch (request.authenticationScheme) {
        case Constants.AuthenticationScheme.DPOP:
            if (request.platformBroker) {
                return {};
            }

            if (request.dpopJkt) {
                return { dpopJkt: request.dpopJkt };
            }

            return {
                dpopJkt: await tokenBindingKeyManager.provisionTokenBindingKey({
                    tokenBindingKeyType:
                        Constants.AuthenticationScheme.DPOP.toLowerCase(),
                    tokenBindingKeyAlgorithm: JsonWebTokenAlgorithms.ES256,
                    correlationId: request.correlationId,
                }),
            };
        case Constants.AuthenticationScheme.POP:
            if (!request.platformBroker) {
                return {};
            }

            const cryptoOps = new CryptoOps(logger, performanceClient);
            if (request.popKid) {
                return { reqCnf: cryptoOps.encodeKid(request.popKid) };
            }

            const popTokenGenerator = new PopTokenGenerator(
                cryptoOps,
                tokenBindingKeyManager,
                performanceClient
            );
            const generatedReqCnfData = await invokeAsync(
                popTokenGenerator.generateCnf.bind(popTokenGenerator),
                PerformanceEvents.PopTokenGenerateCnf,
                logger,
                performanceClient,
                request.correlationId
            )(request, logger);

            return { reqCnf: generatedReqCnfData.reqCnfString };
        default:
            return {};
    }
}

/**
 * Initializer function for all request APIs
 * @param request
 * @param config
 * @param performanceClient
 * @param logger
 * @param correlationId
 */
export async function initializeBaseRequest(
    request: Partial<BaseAuthRequest> & { correlationId: string },
    config: BrowserConfiguration,
    performanceClient: IPerformanceClient,
    logger: Logger,
    correlationId: string
): Promise<BaseAuthRequest> {
    const authority = request.authority || config.auth.authority;

    const scopes = [...((request && request.scopes) || [])];

    const validatedRequest: BaseAuthRequest = {
        ...request,
        correlationId: request.correlationId,
        authority,
        scopes,
    };

    // Set authenticationScheme to BEARER if not explicitly set in the request
    if (!validatedRequest.authenticationScheme) {
        validatedRequest.authenticationScheme =
            Constants.AuthenticationScheme.BEARER;
        logger.verbose(
            'Authentication Scheme was not explicitly set in request, defaulting to "Bearer" request',
            correlationId
        );
    } else {
        if (
            !SUPPORTED_AUTHENTICATION_SCHEMES.has(
                validatedRequest.authenticationScheme
            )
        ) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.unsupportedAuthenticationScheme,
                correlationId
            );
        }

        switch (validatedRequest.authenticationScheme) {
            case Constants.AuthenticationScheme.SSH:
                validateSshRequest(request, correlationId);
                break;
            case Constants.AuthenticationScheme.DPOP: {
                validateDpopRequest(request, correlationId);
                break;
            }
        }
        logger.verbose(
            `Authentication Scheme set to "'${validatedRequest.authenticationScheme}'" as configured in Auth request`,
            correlationId
        );
    }

    return validatedRequest;
}

export async function initializeSilentRequest(
    request: SilentRequest & { correlationId: string },
    account: AccountInfo,
    config: BrowserConfiguration,
    performanceClient: IPerformanceClient,
    logger: Logger
): Promise<CommonSilentFlowRequest> {
    const baseRequest = await invokeAsync(
        initializeBaseRequest,
        BrowserPerformanceEvents.InitializeBaseRequest,
        logger,
        performanceClient,
        request.correlationId
    )(request, config, performanceClient, logger, request.correlationId);
    return {
        ...request,
        ...baseRequest,
        account: account,
        forceRefresh: request.forceRefresh || false,
    };
}

/**
 * Validates that the combination of request method, protocol mode and authorize body parameters is correct.
 * Returns the validated or defaulted HTTP method or throws if the configured combination is invalid.
 * @param interactionRequest
 * @param protocolMode
 * @returns
 */
export function validateRequestMethod(
    interactionRequest: BaseAuthRequest | PopupRequest | RedirectRequest,
    protocolMode: ProtocolMode
): Constants.HttpMethod {
    let httpMethod: Constants.HttpMethod | undefined;
    const requestMethod = interactionRequest.httpMethod;

    if (protocolMode === ProtocolMode.EAR) {
        // Validate that method can only be POST when protocol mode is EAR
        if (requestMethod && requestMethod !== Constants.HttpMethod.POST) {
            throw createClientConfigurationError(
                ClientConfigurationErrorCodes.invalidRequestMethodForEAR,
                ""
            );
        } else {
            httpMethod = Constants.HttpMethod.POST;
        }
    } else {
        // For non-EAR protocol modes, default to GET if httpMethod is not set
        httpMethod = requestMethod || Constants.HttpMethod.GET;
    }

    return httpMethod;
}
