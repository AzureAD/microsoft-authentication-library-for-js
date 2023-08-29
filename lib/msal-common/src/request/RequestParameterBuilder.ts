/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AADServerParamKeys,
    Constants,
    ResponseMode,
    SSOTypes,
    CLIENT_INFO,
    AuthenticationScheme,
    ClaimsRequestKeys,
    PasswordGrantConstants,
    OIDC_DEFAULT_SCOPES,
    ThrottlingConstants,
    HeaderNames,
} from "../utils/Constants";
import { ScopeSet } from "./ScopeSet";
import { ClientConfigurationError } from "../error/ClientConfigurationError";
import { StringDict } from "../utils/MsalTypes";
import { RequestValidator } from "./RequestValidator";
import {
    ApplicationTelemetry,
    LibraryInfo,
} from "../config/ClientConfiguration";
import { ServerTelemetryManager } from "../telemetry/server/ServerTelemetryManager";
import { ClientInfo } from "../account/ClientInfo";

/** @internal */
export class RequestParameterBuilder {
    private parameters: Map<string, string>;

    constructor() {
        this.parameters = new Map<string, string>();
    }

    /**
     * add response_type = code
     */
    addResponseTypeCode(): void {
        this.parameters.set(
            AADServerParamKeys.RESPONSE_TYPE,
            encodeURIComponent(Constants.CODE_RESPONSE_TYPE)
        );
    }

    /**
     * add response_type = token id_token
     */
    addResponseTypeForTokenAndIdToken(): void {
        this.parameters.set(
            AADServerParamKeys.RESPONSE_TYPE,
            encodeURIComponent(
                `${Constants.TOKEN_RESPONSE_TYPE} ${Constants.ID_TOKEN_RESPONSE_TYPE}`
            )
        );
    }

    /**
     * add response_mode. defaults to query.
     * @param responseMode
     */
    addResponseMode(responseMode?: ResponseMode): void {
        this.parameters.set(
            AADServerParamKeys.RESPONSE_MODE,
            encodeURIComponent(responseMode ? responseMode : ResponseMode.QUERY)
        );
    }

    /**
     * Add flag to indicate STS should attempt to use WAM if available
     */
    addNativeBroker(): void {
        this.parameters.set(
            AADServerParamKeys.NATIVE_BROKER,
            encodeURIComponent("1")
        );
    }

    /**
     * add scopes. set addOidcScopes to false to prevent default scopes in non-user scenarios
     * @param scopeSet
     * @param addOidcScopes
     */
    addScopes(
        scopes: string[],
        addOidcScopes: boolean = true,
        defaultScopes: Array<string> = OIDC_DEFAULT_SCOPES
    ): void {
        // Always add openid to the scopes when adding OIDC scopes
        if (
            addOidcScopes &&
            !defaultScopes.includes("openid") &&
            !scopes.includes("openid")
        ) {
            defaultScopes.push("openid");
        }
        const requestScopes = addOidcScopes
            ? [...(scopes || []), ...defaultScopes]
            : scopes || [];
        const scopeSet = new ScopeSet(requestScopes);
        this.parameters.set(
            AADServerParamKeys.SCOPE,
            encodeURIComponent(scopeSet.printScopes())
        );
    }

    /**
     * add clientId
     * @param clientId
     */
    addClientId(clientId: string): void {
        this.parameters.set(
            AADServerParamKeys.CLIENT_ID,
            encodeURIComponent(clientId)
        );
    }

    /**
     * add redirect_uri
     * @param redirectUri
     */
    addRedirectUri(redirectUri: string): void {
        RequestValidator.validateRedirectUri(redirectUri);
        this.parameters.set(
            AADServerParamKeys.REDIRECT_URI,
            encodeURIComponent(redirectUri)
        );
    }

    /**
     * add post logout redirectUri
     * @param redirectUri
     */
    addPostLogoutRedirectUri(redirectUri: string): void {
        RequestValidator.validateRedirectUri(redirectUri);
        this.parameters.set(
            AADServerParamKeys.POST_LOGOUT_URI,
            encodeURIComponent(redirectUri)
        );
    }

    /**
     * add id_token_hint to logout request
     * @param idTokenHint
     */
    addIdTokenHint(idTokenHint: string): void {
        this.parameters.set(
            AADServerParamKeys.ID_TOKEN_HINT,
            encodeURIComponent(idTokenHint)
        );
    }

    /**
     * add domain_hint
     * @param domainHint
     */
    addDomainHint(domainHint: string): void {
        this.parameters.set(
            SSOTypes.DOMAIN_HINT,
            encodeURIComponent(domainHint)
        );
    }

    /**
     * add login_hint
     * @param loginHint
     */
    addLoginHint(loginHint: string): void {
        this.parameters.set(SSOTypes.LOGIN_HINT, encodeURIComponent(loginHint));
    }

    /**
     * Adds the CCS (Cache Credential Service) query parameter for login_hint
     * @param loginHint
     */
    addCcsUpn(loginHint: string): void {
        this.parameters.set(
            HeaderNames.CCS_HEADER,
            encodeURIComponent(`UPN:${loginHint}`)
        );
    }

    /**
     * Adds the CCS (Cache Credential Service) query parameter for account object
     * @param loginHint
     */
    addCcsOid(clientInfo: ClientInfo): void {
        this.parameters.set(
            HeaderNames.CCS_HEADER,
            encodeURIComponent(`Oid:${clientInfo.uid}@${clientInfo.utid}`)
        );
    }

    /**
     * add sid
     * @param sid
     */
    addSid(sid: string): void {
        this.parameters.set(SSOTypes.SID, encodeURIComponent(sid));
    }

    /**
     * add claims
     * @param claims
     */
    addClaims(claims?: string, clientCapabilities?: Array<string>): void {
        const mergedClaims = this.addClientCapabilitiesToClaims(
            claims,
            clientCapabilities
        );
        RequestValidator.validateClaims(mergedClaims);
        this.parameters.set(
            AADServerParamKeys.CLAIMS,
            encodeURIComponent(mergedClaims)
        );
    }

    /**
     * add correlationId
     * @param correlationId
     */
    addCorrelationId(correlationId: string): void {
        this.parameters.set(
            AADServerParamKeys.CLIENT_REQUEST_ID,
            encodeURIComponent(correlationId)
        );
    }

    /**
     * add library info query params
     * @param libraryInfo
     */
    addLibraryInfo(libraryInfo: LibraryInfo): void {
        // Telemetry Info
        this.parameters.set(AADServerParamKeys.X_CLIENT_SKU, libraryInfo.sku);
        this.parameters.set(
            AADServerParamKeys.X_CLIENT_VER,
            libraryInfo.version
        );
        if (libraryInfo.os) {
            this.parameters.set(AADServerParamKeys.X_CLIENT_OS, libraryInfo.os);
        }
        if (libraryInfo.cpu) {
            this.parameters.set(
                AADServerParamKeys.X_CLIENT_CPU,
                libraryInfo.cpu
            );
        }
    }

    /**
     * Add client telemetry parameters
     * @param appTelemetry
     */
    addApplicationTelemetry(appTelemetry: ApplicationTelemetry): void {
        if (appTelemetry?.appName) {
            this.parameters.set(
                AADServerParamKeys.X_APP_NAME,
                appTelemetry.appName
            );
        }

        if (appTelemetry?.appVersion) {
            this.parameters.set(
                AADServerParamKeys.X_APP_VER,
                appTelemetry.appVersion
            );
        }
    }

    /**
     * add prompt
     * @param prompt
     */
    addPrompt(prompt: string): void {
        RequestValidator.validatePrompt(prompt);
        this.parameters.set(
            `${AADServerParamKeys.PROMPT}`,
            encodeURIComponent(prompt)
        );
    }

    /**
     * add state
     * @param state
     */
    addState(state: string): void {
        if (state) {
            this.parameters.set(
                AADServerParamKeys.STATE,
                encodeURIComponent(state)
            );
        }
    }

    /**
     * add nonce
     * @param nonce
     */
    addNonce(nonce: string): void {
        this.parameters.set(
            AADServerParamKeys.NONCE,
            encodeURIComponent(nonce)
        );
    }

    /**
     * add code_challenge and code_challenge_method
     * - throw if either of them are not passed
     * @param codeChallenge
     * @param codeChallengeMethod
     */
    addCodeChallengeParams(
        codeChallenge: string,
        codeChallengeMethod: string
    ): void {
        RequestValidator.validateCodeChallengeParams(
            codeChallenge,
            codeChallengeMethod
        );
        if (codeChallenge && codeChallengeMethod) {
            this.parameters.set(
                AADServerParamKeys.CODE_CHALLENGE,
                encodeURIComponent(codeChallenge)
            );
            this.parameters.set(
                AADServerParamKeys.CODE_CHALLENGE_METHOD,
                encodeURIComponent(codeChallengeMethod)
            );
        } else {
            throw ClientConfigurationError.createInvalidCodeChallengeParamsError();
        }
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param code
     */
    addAuthorizationCode(code: string): void {
        this.parameters.set(AADServerParamKeys.CODE, encodeURIComponent(code));
    }

    /**
     * add the `authorization_code` passed by the user to exchange for a token
     * @param code
     */
    addDeviceCode(code: string): void {
        this.parameters.set(
            AADServerParamKeys.DEVICE_CODE,
            encodeURIComponent(code)
        );
    }

    /**
     * add the `refreshToken` passed by the user
     * @param refreshToken
     */
    addRefreshToken(refreshToken: string): void {
        this.parameters.set(
            AADServerParamKeys.REFRESH_TOKEN,
            encodeURIComponent(refreshToken)
        );
    }

    /**
     * add the `code_verifier` passed by the user to exchange for a token
     * @param codeVerifier
     */
    addCodeVerifier(codeVerifier: string): void {
        this.parameters.set(
            AADServerParamKeys.CODE_VERIFIER,
            encodeURIComponent(codeVerifier)
        );
    }

    /**
     * add client_secret
     * @param clientSecret
     */
    addClientSecret(clientSecret: string): void {
        this.parameters.set(
            AADServerParamKeys.CLIENT_SECRET,
            encodeURIComponent(clientSecret)
        );
    }

    /**
     * add clientAssertion for confidential client flows
     * @param clientAssertion
     */
    addClientAssertion(clientAssertion: string): void {
        if (clientAssertion) {
            this.parameters.set(
                AADServerParamKeys.CLIENT_ASSERTION,
                encodeURIComponent(clientAssertion)
            );
        }
    }

    /**
     * add clientAssertionType for confidential client flows
     * @param clientAssertionType
     */
    addClientAssertionType(clientAssertionType: string): void {
        if (clientAssertionType) {
            this.parameters.set(
                AADServerParamKeys.CLIENT_ASSERTION_TYPE,
                encodeURIComponent(clientAssertionType)
            );
        }
    }

    /**
     * add OBO assertion for confidential client flows
     * @param clientAssertion
     */
    addOboAssertion(oboAssertion: string): void {
        this.parameters.set(
            AADServerParamKeys.OBO_ASSERTION,
            encodeURIComponent(oboAssertion)
        );
    }

    /**
     * add grant type
     * @param grantType
     */
    addRequestTokenUse(tokenUse: string): void {
        this.parameters.set(
            AADServerParamKeys.REQUESTED_TOKEN_USE,
            encodeURIComponent(tokenUse)
        );
    }

    /**
     * add grant type
     * @param grantType
     */
    addGrantType(grantType: string): void {
        this.parameters.set(
            AADServerParamKeys.GRANT_TYPE,
            encodeURIComponent(grantType)
        );
    }

    /**
     * add client info
     *
     */
    addClientInfo(): void {
        this.parameters.set(CLIENT_INFO, "1");
    }

    /**
     * add extraQueryParams
     * @param eQParams
     */
    addExtraQueryParameters(eQParams: StringDict): void {
        const sanitizedEQParams = RequestValidator.sanitizeEQParams(
            eQParams,
            this.parameters
        );
        Object.keys(sanitizedEQParams).forEach((key) => {
            this.parameters.set(key, eQParams[key]);
        });
    }

    addClientCapabilitiesToClaims(
        claims?: string,
        clientCapabilities?: Array<string>
    ): string {
        let mergedClaims: object;

        // Parse provided claims into JSON object or initialize empty object
        if (!claims) {
            mergedClaims = {};
        } else {
            try {
                mergedClaims = JSON.parse(claims);
            } catch (e) {
                throw ClientConfigurationError.createInvalidClaimsRequestError();
            }
        }

        if (clientCapabilities && clientCapabilities.length > 0) {
            if (!mergedClaims.hasOwnProperty(ClaimsRequestKeys.ACCESS_TOKEN)) {
                // Add access_token key to claims object
                mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN] = {};
            }

            // Add xms_cc claim with provided clientCapabilities to access_token key
            mergedClaims[ClaimsRequestKeys.ACCESS_TOKEN][
                ClaimsRequestKeys.XMS_CC
            ] = {
                values: clientCapabilities,
            };
        }

        return JSON.stringify(mergedClaims);
    }

    /**
     * adds `username` for Password Grant flow
     * @param username
     */
    addUsername(username: string): void {
        this.parameters.set(
            PasswordGrantConstants.username,
            encodeURIComponent(username)
        );
    }

    /**
     * adds `password` for Password Grant flow
     * @param password
     */
    addPassword(password: string): void {
        this.parameters.set(
            PasswordGrantConstants.password,
            encodeURIComponent(password)
        );
    }

    /**
     * add pop_jwk to query params
     * @param cnfString
     */
    addPopToken(cnfString: string): void {
        if (cnfString) {
            this.parameters.set(
                AADServerParamKeys.TOKEN_TYPE,
                AuthenticationScheme.POP
            );
            this.parameters.set(
                AADServerParamKeys.REQ_CNF,
                encodeURIComponent(cnfString)
            );
        }
    }

    /**
     * add SSH JWK and key ID to query params
     */
    addSshJwk(sshJwkString: string): void {
        if (sshJwkString) {
            this.parameters.set(
                AADServerParamKeys.TOKEN_TYPE,
                AuthenticationScheme.SSH
            );
            this.parameters.set(
                AADServerParamKeys.REQ_CNF,
                encodeURIComponent(sshJwkString)
            );
        }
    }

    /**
     * add server telemetry fields
     * @param serverTelemetryManager
     */
    addServerTelemetry(serverTelemetryManager: ServerTelemetryManager): void {
        this.parameters.set(
            AADServerParamKeys.X_CLIENT_CURR_TELEM,
            serverTelemetryManager.generateCurrentRequestHeaderValue()
        );
        this.parameters.set(
            AADServerParamKeys.X_CLIENT_LAST_TELEM,
            serverTelemetryManager.generateLastRequestHeaderValue()
        );
    }

    /**
     * Adds parameter that indicates to the server that throttling is supported
     */
    addThrottling(): void {
        this.parameters.set(
            AADServerParamKeys.X_MS_LIB_CAPABILITY,
            ThrottlingConstants.X_MS_LIB_CAPABILITY_VALUE
        );
    }

    /**
     * Adds logout_hint parameter for "silent" logout which prevent server account picker
     */
    addLogoutHint(logoutHint: string): void {
        this.parameters.set(
            AADServerParamKeys.LOGOUT_HINT,
            encodeURIComponent(logoutHint)
        );
    }

    /**
     * Utility to create a URL from the params map
     */
    createQueryString(): string {
        const queryParameterArray: Array<string> = new Array<string>();

        this.parameters.forEach((value, key) => {
            queryParameterArray.push(`${key}=${value}`);
        });

        return queryParameterArray.join("&");
    }
}
