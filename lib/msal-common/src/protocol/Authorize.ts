/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CommonAuthorizationUrlRequest } from "../request/CommonAuthorizationUrlRequest.js";
import * as RequestParameterBuilder from "../request/RequestParameterBuilder.js";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient.js";
import * as AADServerParamKeys from "../constants/AADServerParamKeys.js";
import { AuthOptions } from "../config/ClientConfiguration.js";
import { PromptValue } from "../utils/Constants.js";
import { AccountInfo } from "../account/AccountInfo.js";
import { Logger } from "../logger/Logger.js";
import { buildClientInfoFromHomeAccountId } from "../account/ClientInfo.js";
import { Authority } from "../authority/Authority.js";
import { mapToQueryString } from "../utils/UrlUtils.js";
import { UrlString } from "../url/UrlString.js";

/**
 * Returns map of parameters that are applicable to all calls to /authorize whether using PKCE or EAR
 * @param config
 * @param request
 * @param logger
 * @param performanceClient
 * @returns
 */
export function getStandardAuthorizeRequestParameters(
    authOptions: AuthOptions,
    request: CommonAuthorizationUrlRequest,
    logger: Logger,
    performanceClient?: IPerformanceClient
): Map<string, string> {
    // generate the correlationId if not set by the user and add
    const correlationId = request.correlationId;

    const parameters = new Map<string, string>();

    RequestParameterBuilder.addClientId(
        parameters,
        request.embeddedClientId ||
            request.extraQueryParameters?.[AADServerParamKeys.CLIENT_ID] ||
            authOptions.clientId
    );

    const requestScopes = [
        ...(request.scopes || []),
        ...(request.extraScopesToConsent || []),
    ];
    RequestParameterBuilder.addScopes(
        parameters,
        requestScopes,
        true,
        authOptions.authority.options.OIDCOptions?.defaultScopes
    );

    RequestParameterBuilder.addRedirectUri(parameters, request.redirectUri);

    RequestParameterBuilder.addCorrelationId(parameters, correlationId);

    // add response_mode. If not passed in it defaults to query.
    RequestParameterBuilder.addResponseMode(parameters, request.responseMode);

    // add client_info=1
    RequestParameterBuilder.addClientInfo(parameters);

    if (request.prompt) {
        RequestParameterBuilder.addPrompt(parameters, request.prompt);
        performanceClient?.addFields({ prompt: request.prompt }, correlationId);
    }

    if (request.domainHint) {
        RequestParameterBuilder.addDomainHint(parameters, request.domainHint);
        performanceClient?.addFields(
            { domainHintFromRequest: true },
            correlationId
        );
    }

    // Add sid or loginHint with preference for login_hint claim (in request) -> sid -> loginHint (upn/email) -> username of AccountInfo object
    if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
        // AAD will throw if prompt=select_account is passed with an account hint
        if (request.sid && request.prompt === PromptValue.NONE) {
            // SessionID is only used in silent calls
            logger.verbose(
                "createAuthCodeUrlQueryString: Prompt is none, adding sid from request"
            );
            RequestParameterBuilder.addSid(parameters, request.sid);
            performanceClient?.addFields(
                { sidFromRequest: true },
                correlationId
            );
        } else if (request.account) {
            const accountSid = extractAccountSid(request.account);
            let accountLoginHintClaim = extractLoginHint(request.account);

            if (accountLoginHintClaim && request.domainHint) {
                logger.warning(
                    `AuthorizationCodeClient.createAuthCodeUrlQueryString: "domainHint" param is set, skipping opaque "login_hint" claim. Please consider not passing domainHint`
                );
                accountLoginHintClaim = null;
            }

            // If login_hint claim is present, use it over sid/username
            if (accountLoginHintClaim) {
                logger.verbose(
                    "createAuthCodeUrlQueryString: login_hint claim present on account"
                );
                RequestParameterBuilder.addLoginHint(
                    parameters,
                    accountLoginHintClaim
                );
                performanceClient?.addFields(
                    { loginHintFromClaim: true },
                    correlationId
                );
                try {
                    const clientInfo = buildClientInfoFromHomeAccountId(
                        request.account.homeAccountId
                    );
                    RequestParameterBuilder.addCcsOid(parameters, clientInfo);
                } catch (e) {
                    logger.verbose(
                        "createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header"
                    );
                }
            } else if (accountSid && request.prompt === PromptValue.NONE) {
                /*
                 * If account and loginHint are provided, we will check account first for sid before adding loginHint
                 * SessionId is only used in silent calls
                 */
                logger.verbose(
                    "createAuthCodeUrlQueryString: Prompt is none, adding sid from account"
                );
                RequestParameterBuilder.addSid(parameters, accountSid);
                performanceClient?.addFields(
                    { sidFromClaim: true },
                    correlationId
                );
                try {
                    const clientInfo = buildClientInfoFromHomeAccountId(
                        request.account.homeAccountId
                    );
                    RequestParameterBuilder.addCcsOid(parameters, clientInfo);
                } catch (e) {
                    logger.verbose(
                        "createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header"
                    );
                }
            } else if (request.loginHint) {
                logger.verbose(
                    "createAuthCodeUrlQueryString: Adding login_hint from request"
                );
                RequestParameterBuilder.addLoginHint(
                    parameters,
                    request.loginHint
                );
                RequestParameterBuilder.addCcsUpn(
                    parameters,
                    request.loginHint
                );
                performanceClient?.addFields(
                    { loginHintFromRequest: true },
                    correlationId
                );
            } else if (request.account.username) {
                // Fallback to account username if provided
                logger.verbose(
                    "createAuthCodeUrlQueryString: Adding login_hint from account"
                );
                RequestParameterBuilder.addLoginHint(
                    parameters,
                    request.account.username
                );
                performanceClient?.addFields(
                    { loginHintFromUpn: true },
                    correlationId
                );
                try {
                    const clientInfo = buildClientInfoFromHomeAccountId(
                        request.account.homeAccountId
                    );
                    RequestParameterBuilder.addCcsOid(parameters, clientInfo);
                } catch (e) {
                    logger.verbose(
                        "createAuthCodeUrlQueryString: Could not parse home account ID for CCS Header"
                    );
                }
            }
        } else if (request.loginHint) {
            logger.verbose(
                "createAuthCodeUrlQueryString: No account, adding login_hint from request"
            );
            RequestParameterBuilder.addLoginHint(parameters, request.loginHint);
            RequestParameterBuilder.addCcsUpn(parameters, request.loginHint);
            performanceClient?.addFields(
                { loginHintFromRequest: true },
                correlationId
            );
        }
    } else {
        logger.verbose(
            "createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints"
        );
    }

    if (request.nonce) {
        RequestParameterBuilder.addNonce(parameters, request.nonce);
    }

    if (request.state) {
        RequestParameterBuilder.addState(parameters, request.state);
    }

    if (
        request.claims ||
        (authOptions.clientCapabilities &&
            authOptions.clientCapabilities.length > 0)
    ) {
        RequestParameterBuilder.addClaims(
            parameters,
            request.claims,
            authOptions.clientCapabilities
        );
    }

    if (request.embeddedClientId) {
        RequestParameterBuilder.addBrokerParameters(
            parameters,
            authOptions.clientId,
            authOptions.redirectUri
        );
    }

    if (request.extraQueryParameters) {
        RequestParameterBuilder.addExtraQueryParameters(
            parameters,
            request.extraQueryParameters
        );
    }

    if (authOptions.instanceAware) {
        RequestParameterBuilder.addInstanceAware(parameters);
    }

    return parameters;
}

/**
 * Returns authorize endpoint with given request parameters in the query string
 * @param authority
 * @param requestParameters
 * @returns
 */
export function getAuthorizeUrl(
    authority: Authority,
    requestParameters: Map<string, string>
): string {
    const queryString = mapToQueryString(requestParameters);

    return UrlString.appendQueryString(
        authority.authorizationEndpoint,
        queryString
    );
}

/**
 * Helper to get sid from account. Returns null if idTokenClaims are not present or sid is not present.
 * @param account
 */
function extractAccountSid(account: AccountInfo): string | null {
    return account.idTokenClaims?.sid || null;
}

function extractLoginHint(account: AccountInfo): string | null {
    return account.idTokenClaims?.login_hint || null;
}
