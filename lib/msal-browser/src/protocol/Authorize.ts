/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    Authority,
    AuthorizeProtocol,
    ClientConfigurationErrorCodes,
    CommonAuthorizationUrlRequest,
    createClientConfigurationError,
    invokeAsync,
    IPerformanceClient,
    Logger,
    PerformanceEvents,
    PopTokenGenerator,
    ProtocolMode,
    RequestParameterBuilder,
    Constants,
} from "@azure/msal-common/browser";
import { BrowserConfiguration } from "../config/Configuration.js";
import { BrowserConstants } from "../utils/BrowserConstants.js";
import { version } from "../packageMetadata.js";
import { CryptoOps } from "../crypto/CryptoOps.js";

/**
 * Returns map of parameters that are applicable to all calls to /authorize whether using PKCE or EAR
 * @param config
 * @param authority
 * @param request
 * @param logger
 * @param performanceClient
 * @returns
 */
async function getStandardParameters(
    config: BrowserConfiguration,
    authority: Authority,
    request: CommonAuthorizationUrlRequest,
    logger: Logger,
    performanceClient: IPerformanceClient
): Promise<Map<string, string>> {
    const parameters = AuthorizeProtocol.getStandardAuthorizeRequestParameters(
        { ...config.auth, authority: authority },
        request,
        logger,
        performanceClient
    );
    RequestParameterBuilder.addLibraryInfo(parameters, {
        sku: BrowserConstants.MSAL_SKU,
        version: version,
        os: "",
        cpu: "",
    });
    if (config.auth.protocolMode !== ProtocolMode.OIDC) {
        RequestParameterBuilder.addApplicationTelemetry(
            parameters,
            config.telemetry.application
        );
    }

    if (request.platformBroker) {
        // signal ests that this is a WAM call
        RequestParameterBuilder.addNativeBroker(parameters);

        // pass the req_cnf for POP
        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const cryptoOps = new CryptoOps(logger, performanceClient);
            const popTokenGenerator = new PopTokenGenerator(cryptoOps);

            // req_cnf is always sent as a string for SPAs
            let reqCnfData;
            if (!request.popKid) {
                const generatedReqCnfData = await invokeAsync(
                    popTokenGenerator.generateCnf.bind(popTokenGenerator),
                    PerformanceEvents.PopTokenGenerateCnf,
                    logger,
                    performanceClient,
                    request.correlationId
                )(request, logger);
                reqCnfData = generatedReqCnfData.reqCnfString;
            } else {
                reqCnfData = cryptoOps.encodeKid(request.popKid);
            }
            RequestParameterBuilder.addPopToken(parameters, reqCnfData);
        }
    }

    RequestParameterBuilder.instrumentBrokerParams(
        parameters,
        request.correlationId,
        performanceClient
    );

    return parameters;
}

/**
 * Gets the full /authorize URL with request parameters when using Auth Code + PKCE
 * @param config
 * @param authority
 * @param request
 * @param logger
 * @param performanceClient
 * @returns
 */
export async function getAuthCodeRequestUrl(
    config: BrowserConfiguration,
    authority: Authority,
    request: CommonAuthorizationUrlRequest,
    logger: Logger,
    performanceClient: IPerformanceClient
): Promise<string> {
    if (!request.codeChallenge) {
        throw createClientConfigurationError(
            ClientConfigurationErrorCodes.pkceParamsMissing
        );
    }

    const parameters = await invokeAsync(
        getStandardParameters,
        PerformanceEvents.GetStandardParams,
        logger,
        performanceClient,
        request.correlationId
    )(config, authority, request, logger, performanceClient);
    RequestParameterBuilder.addResponseTypeCode(parameters);

    RequestParameterBuilder.addCodeChallengeParams(
        parameters,
        request.codeChallenge,
        Constants.S256_CODE_CHALLENGE_METHOD
    );

    return AuthorizeProtocol.getAuthorizeUrl(authority, parameters);
}
