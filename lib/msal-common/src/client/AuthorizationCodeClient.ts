/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { BaseClient } from "./BaseClient";
import { CommonAuthorizationUrlRequest } from "../request/CommonAuthorizationUrlRequest";
import { CommonAuthorizationCodeRequest } from "../request/CommonAuthorizationCodeRequest";
import { Authority } from "../authority/Authority";
import { RequestParameterBuilder } from "../request/RequestParameterBuilder";
import { GrantType, AuthenticationScheme, PromptValue, Separators } from "../utils/Constants";
import { ClientConfiguration } from "../config/ClientConfiguration";
import { ServerAuthorizationTokenResponse } from "../response/ServerAuthorizationTokenResponse";
import { NetworkResponse } from "../network/NetworkManager";
import { ResponseHandler } from "../response/ResponseHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { StringUtils } from "../utils/StringUtils";
import { ClientAuthError } from "../error/ClientAuthError";
import { UrlString } from "../url/UrlString";
import { ServerAuthorizationCodeResponse } from "../response/ServerAuthorizationCodeResponse";
import { CommonEndSessionRequest } from "../request/CommonEndSessionRequest";
import { PopTokenGenerator } from "../crypto/PopTokenGenerator";
import { RequestThumbprint } from "../network/RequestThumbprint";
import { AuthorizationCodePayload } from "../response/AuthorizationCodePayload";
import { TimeUtils } from "../utils/TimeUtils";
import { TokenClaims } from "../account/TokenClaims";
import { AccountInfo } from "../account/AccountInfo";
import { buildClientInfoFromHomeAccountId, buildClientInfo } from "../account/ClientInfo";
import { CcsCredentialType, CcsCredential } from "../account/CcsCredential";
import { ClientConfigurationError } from "../error/ClientConfigurationError";

// TODO: Remove
export const SSH_AUTHENTICATION_RESULT = {
    status: 200,
    body: {
        "token_type": AuthenticationScheme.SSH,
        "scope": "https://pas.windows.net/CheckMyAccess/Linux/user_impersonation https://pas.windows.net/CheckMyAccess/Linux/.default",
        "expires}_in": 3599,
        "ext_expires_in": 3599,
        "access_token":"AAAAHHNzaC1yc2EtY2VydC12MDFAb3BlbnNzaC5jb20AAAAgrk+wGrNoM6ZcU8/aVc+O9nMQArnTpgQcN2nDOojq3LwAAAADAQABAAABAQCiPcGP8PriIUKC1EAiepduIitPFswHDoPpAUJqbzgKNLdTdy86OoGFpY9yKo9kVgCTdPj/v8cO76/+I1vlHk1p7Q9DeFe333LefRnBUT8tDiFC4wtYJDxhpCcuOsEIlHVhYPp33ZQZePomb9rzTCatzFnrP9b62FRpx0Y3pjk/lstOr50Bh/3ZlDFPH36chXwEDSOcW3QX+0y4FT6x5zxna9KrwpCOWVaBdqsHpoqruDhGwkCAaoL6RXCyQTZatcqJNWCcD6a8GFHAkTZMxh2LR0xPZ4JkIDofKbauP/s9FPlAJN+VhY+HthrduVzgRP3ELxqSCE8xmNV8R/AVv1OxAAAAAAAAAAAAAAABAAAASTE4ZmRhY2MyLThkMWEtNDMzOC04NWM4LTAwMjY1ZmI2NWVmNkA3MmY5ODhiZi04NmYxLTQxYWYtOTFhYi0yZDdjZDAxMWRiNDcAAAAZAAAAFWhlbW9yYWxAbWljcm9zb2Z0LmNvbQAAAABhcFyFAAAAAGFwa8EAAAAAAAABTAAAACBkaXNwbGF5bmFtZUBzc2hzZXJ2aWNlLmF6dXJlLm5ldAAAABIAAAAOSGVjdG9yIE1vcmFsZXMAAAAYb2lkQHNzaHNlcnZpY2UuYXp1cmUubmV0AAAAKAAAACQxOGZkYWNjMi04ZDFhLTQzMzgtODVjOC0wMDI2NWZiNjVlZjYAAAAVcGVybWl0LVgxMS1mb3J3YXJkaW5nAAAAAAAAABdwZXJtaXQtYWdlbnQtZm9yd2FyZGluZwAAAAAAAAAWcGVybWl0LXBvcnQtZm9yd2FyZGluZwAAAAAAAAAKcGVybWl0LXB0eQAAAAAAAAAOcGVybWl0LXVzZXItcmMAAAAAAAAAGHRpZEBzc2hzZXJ2aWNlLmF6dXJlLm5ldAAAACgAAAAkNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3AAAAAAAAARcAAAAHc3NoLXJzYQAAAAMBAAEAAAEBALH7FzF1rjvnZ4i2iBC2tz8qs/WP61n3/wFawgJxUnTx2vP/z5pG7f8qvumd7taOII0aSlp648SIfMw59WdUUtup5CnDYOcX1sUdivAj20m2PIDK6f+KWZ+7YKxJqCzJMH4GGlQvuDIhRKNT9oHfZgnYCCAmjXmJBtWyD052qqrkzOSn0/e9TKbjlTnTNcrIno3XDQ7xG+79vOD2GZMNopsKogWNxUdLFRu44ClKLRb4Xe00eVrANtBkv+mSJFFJS1Gxv611hpdGI2S0v1H+KvB26O7vuzGhZ/AevRemGhXQ5V5vwNEqXnVRVkBRszLKeN/+rxM436xQyVQGJMG+sVEAAAEUAAAADHJzYS1zaGEyLTI1NgAAAQBlbiFgkvtKprsj96PD2uIJ7ZypzE/t/iba7/eDvXXc3ixI8fBns2bSuNx7LF3i2vlAUgz6UHe4xW0voc+jmZKEI8jXj91C84npo7J4kCxAkfO4GmdwGhQMjNRoN+pZliPNtj5jQLsuVxgXoJARAEP8nSp372i2bn7iFzolXWPiWkF1MVFV9BLwL3uPDeqTZqurYcpXJnSX30owMyC9qf913MGvWujN2AKNyoX1OIm19EKUSVLMM7S65A5nuuOMrkaajumdEgCgiVQSgHjqD5gDix+EZy7w6L6b8nKqT2mu481dM2yMqejAWxgife4oPI07sGXf1kIOn8kTuZAHkiSH",
        "refresh_token":"0.AgAAv4j5cvGGr0GRqy180BHbR5V3sATbjRpGu-4C-eG_e0YaABY.AgABAAAAAAD--DLA3VO7QrddgJg7WevrAgDs_wQA9P-EBNF8q2r9qv_iCbVfW_zgF_N1FbTHDfwY9T7I5fcq98x_4kqzVpyvuzYtZUA9ZXBtubbifOfTjf8pkFxYVXTY_vggKClGKL0c7Z-poCEO9MVpIVL64QhU_u3-H0bvyj6yRf7RbfgpXjhM5rKA-Fg8g_cQEcro4ZxjKEtc4vbnw6eULmch275bLuxBU5oqB_470uqlPapssZOKJn1uVQzlO9AK6UivjEebzggPuKnT0RscWO4hJogTQQWjjZeB8_DjqDLWn6wHOoLvC8C2aNHAjBOT8Pg9lANvHNLq7ful9g7mrZ1wlBTPYnv8jPOSPqQiAHpydPSued-UrRysIs1gXuFlnOaCy6no9eNGpJ8ymxHrWvuIAr18Na2waLr_H3lFqHYlTuhYlk2e7By-0zAa_xkSw2qbv0BFCRyZY0idrQVMAKJ9ht-UF3cB06ZwcGcp3gVyhbE7dNa6qq5szSqCRE5yd0-q82LylF2qbUAdGIyeNNLYWQs8o8OPOGuGI-sTOUUFLKG4LlB3zzcvDutAEpfTapJ3r76gGuUeACi5Ie1Q9ZpIumohuK9pf6dxqjbtPpdNIYJHwT8DX_8XlbKpZ8r62pgZ7oLmBV59KZpBfyAFIHnlORKP9eMrSKQpFatMUo1krGarAXfTeMFw47Tpb807WCuk2fS6V5VWHrSoTW_-Vov2liQA7lorD9foHbVvNgSjtG-WSHtbBZF3YAgG79sZGDwZIeWzy0XrE5ruAcdzC-zI-iP5mJqDh5b05CgRaNtebIo3fHNaSijQ57n8GqiTtztIeZVIwxPGXzgJl8k6l-k9pI9gcCPnexZItYSxYQJ5JhTc2qlwKecpNh788iLny8rDa2tjMt5PS69QjPCYYOFjaI7vz5LJRn0_G2B3sADutKvH2tNL-ZiNlYuA25rhp2b1TZwDjbBLY5RwOgMGxg_H2b-DGLBMZq1_O2iBhjgNAUI4po3LP26UFCNhTgHtpeTbKSBVQeiGCV5p0eR_fQJISnZb1KR-Yl7jDGASR-QtdzSqaM-vWoY9IuKG4cX6kfFJViIIZWyGl44d-AOrM4NNW3bvb8Fx-rmCNVesc2tibNPj5Ww3E7DWAyL13mMi5Nl69RXyb-6ng6CoIauswxmOE4TwL2m0yyayGLIPGy6FfjhzvzIdaCvyrivW-gEoM0oEW-_KcEIzEvIxFArmgPgh3HEnmrftJHEMp-ucrpcBTdE1qnkkX7yaJ3mnvxOfMS1q0wU3hG_o3frJJk3gckxXBzrgWDRnSxOMkxBEHBVcjuRL5kahtnY4_TfE3M216uDFvHOdqW8",
        "foci":"1",
        "id_token":"eyJ0eXAiOiJKV1QiLCJyaCI6IjAuQWdBQXY0ajVjdkdHcjBHUnF5MTgwQkhiUjVWM3NBVGJqUnBHdS00Qy1lR19lMFlhQUJZLiIsImFsZyI6IlJTMjU2Iiwia2lkIjoibDNzUS01MGNDSDR4QlZaTEhUR3duU1I3NjgwIn0.eyJhdWQiOiIwNGIwNzc5NS04ZGRiLTQ2MWEtYmJlZS0wMmY5ZTFiZjdiNDYiLCJpc3MiOiJodHRwczovL2xvZ2luLm1pY3Jvc29mdG9ubGluZS5jb20vNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3L3YyLjAiLCJpYXQiOjE2MzQ3NTM2NjksIm5iZiI6MTYzNDc1MzY2OSwiZXhwIjoxNjM0NzU3NTY5LCJhaW8iOiJBV1FBbS84VEFBQUFGYk1BTk94WHJ2c1VOT3doK1RYMGdSSTlCZjRuK3ZURmVCeDNFbEtoV3J6KzI1REhSRWRWVDhtRGMzeGxuZzZvWFE5cy9yLzRUSnVQbFdTNWd1bnJaSnZtNllXV2hJTzJZRDMzdFVlNDJibHJ3ZllEbWdKQmZpNnlhQjJyNFMxaiIsIm5hbWUiOiJIZWN0b3IgTW9yYWxlcyIsIm5vbmNlIjoiYjVmNjcyM2YtOTQ3My00ZjIyLTllZjYtZDUwNTk2MzkyZWVjIiwib2lkIjoiMThmZGFjYzItOGQxYS00MzM4LTg1YzgtMDAyNjVmYjY1ZWY2IiwicHJlZmVycmVkX3VzZXJuYW1lIjoiaGVtb3JhbEBtaWNyb3NvZnQuY29tIiwicHVpZCI6IjEwMDMyMDAwQjI0OEU2RUIiLCJyaCI6IkkiLCJzdWIiOiJhTk4xMVBzaUNNY2VlYW11ZjNWR0FPekc3QU5jWk91Tkg0Y0sxYWlZbnVnIiwidGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3IiwidXRpIjoiRzNKQ0V3ZTRvMGVIUllwc0Y0b1NBQSIsInZlciI6IjIuMCJ9.L5u8g0MBnp9OLD_ed3kDcTGbIgecZq32LQuoWur-aoSdyS0A6RGOgaozeG-Xnhxu1GST7fjIlASSoFyVcUf6HuzLQ8d_g8l8f_lKJO9-EkgFE6f7-ADagN_iFRGCBhgsgHbbpPDEmTSuZnTAb2niWFCUgn_w5KeVPQESQC79gnXT1hWrfNM2asdQROvB-6RppHFeHJqtu9DxYVX5MfIYaYVgItUKFfU_EY5rBWkVwk73cBLkPqDqMogIs0TlZDre5WhLqQYqaUAnGRlVO_u5popnlv8LZQ1ViUQ5NPz1-wc6u9i6gj4qtRXCKvVVcscyXPr7vQcLYAXD3Uu3f4FypQ",
        "client_info":"eyJ1aWQiOiIxOGZkYWNjMi04ZDFhLTQzMzgtODVjOC0wMDI2NWZiNjVlZjYiLCJ1dGlkIjoiNzJmOTg4YmYtODZmMS00MWFmLTkxYWItMmQ3Y2QwMTFkYjQ3In0"
    }
};

/**
 * Oauth2.0 Authorization Code client
 */
export class AuthorizationCodeClient extends BaseClient {

    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Creates the URL of the authorization request letting the user input credentials and consent to the
     * application. The URL target the /authorize endpoint of the authority configured in the
     * application object.
     *
     * Once the user inputs their credentials and consents, the authority will send a response to the redirect URI
     * sent in the request and should contain an authorization code, which can then be used to acquire tokens via
     * acquireToken(AuthorizationCodeRequest)
     * @param request
     */
    async getAuthCodeUrl(request: CommonAuthorizationUrlRequest): Promise<string> {
        const queryString = this.createAuthCodeUrlQueryString(request);

        return UrlString.appendQueryString(this.authority.authorizationEndpoint, queryString);
    }

    /**
     * API to acquire a token in exchange of 'authorization_code` acquired by the user in the first leg of the
     * authorization_code_grant
     * @param request
     */
    async acquireToken(request: CommonAuthorizationCodeRequest, authCodePayload?: AuthorizationCodePayload): Promise<AuthenticationResult> {
        this.logger.info("in acquireToken call");
        if (!request || StringUtils.isEmpty(request.code)) {
            throw ClientAuthError.createTokenRequestCannotBeMadeError();
        }

        const reqTimestamp = TimeUtils.nowSeconds();
        const response = await this.executeTokenRequest(this.authority, request);

        /*
         * TODO: Remove
         *  let response;
         *  try {
         *      response = await this.executeTokenRequest(this.authority, request);
         *  } catch (e) {
         *      response = SSH_AUTHENTICATION_RESULT;
         *  }
         */

        const responseHandler = new ResponseHandler(
            this.config.authOptions.clientId,
            this.cacheManager,
            this.cryptoUtils,
            this.logger,
            this.config.serializableCache,
            this.config.persistencePlugin
        );

        // Validate response. This function throws a server error if an error is returned by the server.
        responseHandler.validateTokenResponse(response.body);
        return await responseHandler.handleServerTokenResponse(response.body, this.authority, reqTimestamp, request, authCodePayload);
    }

    /**
     * Handles the hash fragment response from public client code request. Returns a code response used by
     * the client to exchange for a token in acquireToken.
     * @param hashFragment
     */
    handleFragmentResponse(hashFragment: string, cachedState: string): AuthorizationCodePayload {
        // Handle responses.
        const responseHandler = new ResponseHandler(this.config.authOptions.clientId, this.cacheManager, this.cryptoUtils, this.logger, null, null);

        // Deserialize hash fragment response parameters.
        const hashUrlString = new UrlString(hashFragment);
        // Deserialize hash fragment response parameters.
        const serverParams: ServerAuthorizationCodeResponse = UrlString.getDeserializedHash(hashUrlString.getHash());

        // Get code response
        responseHandler.validateServerAuthorizationCodeResponse(serverParams, cachedState, this.cryptoUtils);

        // throw when there is no auth code in the response
        if (!serverParams.code) {
            throw ClientAuthError.createNoAuthCodeInServerResponseError();
        }
        return {
            ...serverParams,
            // Code param is optional in ServerAuthorizationCodeResponse but required in AuthorizationCodePaylod
            code: serverParams.code
        };
    }

    /**
     * Used to log out the current user, and redirect the user to the postLogoutRedirectUri.
     * Default behaviour is to redirect the user to `window.location.href`.
     * @param authorityUri
     */
    getLogoutUri(logoutRequest: CommonEndSessionRequest): string {
        // Throw error if logoutRequest is null/undefined
        if (!logoutRequest) {
            throw ClientConfigurationError.createEmptyLogoutRequestError();
        }
        const queryString = this.createLogoutUrlQueryString(logoutRequest);

        // Construct logout URI.
        return UrlString.appendQueryString(this.authority.endSessionEndpoint, queryString);
    }

    /**
     * Executes POST request to token endpoint
     * @param authority
     * @param request
     */
    private async executeTokenRequest(authority: Authority, request: CommonAuthorizationCodeRequest): Promise<NetworkResponse<ServerAuthorizationTokenResponse>> {
        const thumbprint: RequestThumbprint = {
            clientId: this.config.authOptions.clientId,
            authority: authority.canonicalAuthority,
            scopes: request.scopes,
            authenticationScheme: request.authenticationScheme,
            resourceRequestMethod: request.resourceRequestMethod,
            resourceRequestUri: request.resourceRequestUri,
            shrClaims: request.shrClaims,
            sshJwk: request.sshJwk,
            sshKid: request.sshKid
        };

        const requestBody = await this.createTokenRequestBody(request);
        const queryParameters = this.createTokenQueryParameters(request);
        let ccsCredential: CcsCredential | undefined = undefined;
        if (request.clientInfo) {
            try {
                const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                ccsCredential = {
                    credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                };
            } catch (e) {
                this.logger.verbose("Could not parse client info for CCS Header: " + e);
            }
        }
        const headers: Record<string, string> = this.createTokenRequestHeaders(ccsCredential || request.ccsCredential);
        const endpoint = StringUtils.isEmpty(queryParameters) ? authority.tokenEndpoint : `${authority.tokenEndpoint}?${queryParameters}`;

        return this.executePostToTokenEndpoint(endpoint, requestBody, headers, thumbprint);
    }

    /**
     * Creates query string for the /token request
     * @param request 
     */
    private createTokenQueryParameters(request: CommonAuthorizationCodeRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.tokenQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.tokenQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Generates a map for all the params to be sent to the service
     * @param request
     */
    private async createTokenRequestBody(request: CommonAuthorizationCodeRequest): Promise<string> {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        // Add scope array, parameter builder will add default scopes and dedupe
        parameterBuilder.addScopes(request.scopes);

        // add code: user set, not validated
        parameterBuilder.addAuthorizationCode(request.code);

        // Add library metadata
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        parameterBuilder.addThrottling();
        
        if (this.serverTelemetryManager) {
            parameterBuilder.addServerTelemetry(this.serverTelemetryManager);
        }

        // add code_verifier if passed
        if (request.codeVerifier) {
            parameterBuilder.addCodeVerifier(request.codeVerifier);
        }

        if (this.config.clientCredentials.clientSecret) {
            parameterBuilder.addClientSecret(this.config.clientCredentials.clientSecret);
        }

        if (this.config.clientCredentials.clientAssertion) {
            const clientAssertion = this.config.clientCredentials.clientAssertion;
            parameterBuilder.addClientAssertion(clientAssertion.assertion);
            parameterBuilder.addClientAssertionType(clientAssertion.assertionType);
        }

        parameterBuilder.addGrantType(GrantType.AUTHORIZATION_CODE_GRANT);
        parameterBuilder.addClientInfo();

        if (request.authenticationScheme === AuthenticationScheme.POP) {
            const popTokenGenerator = new PopTokenGenerator(this.cryptoUtils);
            const cnfString = await popTokenGenerator.generateCnf(request);
            parameterBuilder.addPopToken(cnfString);
        } else if (request.authenticationScheme === AuthenticationScheme.SSH) {
            if(request.sshJwk) {
                parameterBuilder.addSshJwk(request.sshJwk);
            } else {
                throw ClientConfigurationError.createMissingSshJwkError();
            }
        }

        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        if (!StringUtils.isEmptyObj(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }
        
        let ccsCred: CcsCredential | undefined = undefined;
        if (request.clientInfo) {
            try {
                const clientInfo = buildClientInfo(request.clientInfo, this.cryptoUtils);
                ccsCred = {
                    credential: `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`,
                    type: CcsCredentialType.HOME_ACCOUNT_ID
                };
            } catch (e) {
                this.logger.verbose("Could not parse client info for CCS Header: " + e);
            }
        } else {
            ccsCred = request.ccsCredential;
        }

        // Adds these as parameters in the request instead of headers to prevent CORS preflight request
        if (this.config.systemOptions.preventCorsPreflight && ccsCred) {
            switch (ccsCred.type) {
                case CcsCredentialType.HOME_ACCOUNT_ID:
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(ccsCred.credential);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                    }
                    break;
                case CcsCredentialType.UPN:
                    parameterBuilder.addCcsUpn(ccsCred.credential);
                    break;
            }
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `AuthorizationCodeUrlRequest` and creates a URL
     * @param request
     */
    private createAuthCodeUrlQueryString(request: CommonAuthorizationUrlRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        parameterBuilder.addClientId(this.config.authOptions.clientId);

        const requestScopes = [...request.scopes || [], ...request.extraScopesToConsent || []];
        parameterBuilder.addScopes(requestScopes);

        // validate the redirectUri (to be a non null value)
        parameterBuilder.addRedirectUri(request.redirectUri);

        // generate the correlationId if not set by the user and add
        const correlationId = request.correlationId || this.config.cryptoInterface.createNewGuid();
        parameterBuilder.addCorrelationId(correlationId);

        // add response_mode. If not passed in it defaults to query.
        parameterBuilder.addResponseMode(request.responseMode);

        // add response_type = code
        parameterBuilder.addResponseTypeCode();

        // add library info parameters
        parameterBuilder.addLibraryInfo(this.config.libraryInfo);

        // add client_info=1
        parameterBuilder.addClientInfo();

        if (request.codeChallenge && request.codeChallengeMethod) {
            parameterBuilder.addCodeChallengeParams(request.codeChallenge, request.codeChallengeMethod);
        }

        if (request.prompt) {
            parameterBuilder.addPrompt(request.prompt);
        }

        if (request.domainHint) {
            parameterBuilder.addDomainHint(request.domainHint);
        }

        // Add sid or loginHint with preference for sid -> loginHint -> username of AccountInfo object
        if (request.prompt !== PromptValue.SELECT_ACCOUNT) {
            // AAD will throw if prompt=select_account is passed with an account hint
            if (request.sid && request.prompt === PromptValue.NONE) {
                // SessionID is only used in silent calls
                this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from request");
                parameterBuilder.addSid(request.sid);
            } else if (request.account) {
                const accountSid = this.extractAccountSid(request.account);
                // If account and loginHint are provided, we will check account first for sid before adding loginHint
                if (accountSid && request.prompt === PromptValue.NONE) {
                    // SessionId is only used in silent calls
                    this.logger.verbose("createAuthCodeUrlQueryString: Prompt is none, adding sid from account");
                    parameterBuilder.addSid(accountSid);
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " + e);
                    }
                } else if (request.loginHint) {
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from request");
                    parameterBuilder.addLoginHint(request.loginHint);
                    parameterBuilder.addCcsUpn(request.loginHint);
                } else if (request.account.username) {
                    // Fallback to account username if provided
                    this.logger.verbose("createAuthCodeUrlQueryString: Adding login_hint from account");
                    parameterBuilder.addLoginHint(request.account.username);
                    try {
                        const clientInfo = buildClientInfoFromHomeAccountId(request.account.homeAccountId);
                        parameterBuilder.addCcsOid(clientInfo);
                    } catch (e) {
                        this.logger.verbose("Could not parse home account ID for CCS Header: " +  e);
                    }
                }
            } else if (request.loginHint) {
                this.logger.verbose("createAuthCodeUrlQueryString: No account, adding login_hint from request");
                parameterBuilder.addLoginHint(request.loginHint);
                parameterBuilder.addCcsUpn(request.loginHint);
            }
        } else {
            this.logger.verbose("createAuthCodeUrlQueryString: Prompt is select_account, ignoring account hints");
        }

        if (request.nonce) {
            parameterBuilder.addNonce(request.nonce);
        }

        if (request.state) {
            parameterBuilder.addState(request.state);
        }

        if (!StringUtils.isEmpty(request.claims) || this.config.authOptions.clientCapabilities && this.config.authOptions.clientCapabilities.length > 0) {
            parameterBuilder.addClaims(request.claims, this.config.authOptions.clientCapabilities);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * This API validates the `EndSessionRequest` and creates a URL
     * @param request
     */
    private createLogoutUrlQueryString(request: CommonEndSessionRequest): string {
        const parameterBuilder = new RequestParameterBuilder();

        if (request.postLogoutRedirectUri) {
            parameterBuilder.addPostLogoutRedirectUri(request.postLogoutRedirectUri);
        }

        if (request.correlationId) {
            parameterBuilder.addCorrelationId(request.correlationId);
        }

        if (request.idTokenHint) {
            parameterBuilder.addIdTokenHint(request.idTokenHint);
        }
        
        if(request.state) {
            parameterBuilder.addState(request.state);
        }

        if (request.extraQueryParameters) {
            parameterBuilder.addExtraQueryParameters(request.extraQueryParameters);
        }

        return parameterBuilder.createQueryString();
    }

    /**
     * Helper to get sid from account. Returns null if idTokenClaims are not present or sid is not present.
     * @param account 
     */
    private extractAccountSid(account: AccountInfo): string | null {
        if (account.idTokenClaims) {
            const tokenClaims = account.idTokenClaims as TokenClaims;
            return tokenClaims.sid || null;
        }
        return null;
    }
}
