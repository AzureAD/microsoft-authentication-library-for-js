/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenRequest } from "../TokenRequest";
import { AccountInfo as NaaAccountInfo } from "../AccountInfo";
import { RedirectRequest } from "../../request/RedirectRequest";
import { PopupRequest } from "../../request/PopupRequest";
import { TokenResponse } from "../TokenResponse";
import {
    AccountInfo as MsalAccountInfo,
    AuthError,
    ClientAuthError,
    ClientConfigurationError,
    InteractionRequiredAuthError,
    ServerError,
    TimeUtils,
    ICrypto,
    Logger,
} from "@azure/msal-common";
import { isBridgeError } from "../BridgeError";
import { BridgeStatusCode } from "../BridgeStatusCode";
import { SilentRequest } from "../../request/SilentRequest";
import { AuthenticationResult } from "../../response/AuthenticationResult";

export class NestedAppAuthAdapter {
    protected crypto: ICrypto;
    protected logger: Logger;
    protected clientId: string;
    protected clientCapabilities: string[];

    constructor(
        clientId: string,
        clientCapabilities: string[],
        crypto: ICrypto,
        logger: Logger
    ) {
        this.clientId = clientId;
        this.clientCapabilities = clientCapabilities;
        this.crypto = crypto;
        this.logger = logger;
    }

    public toNaaSilentTokenRequest(request: SilentRequest): TokenRequest {
        let extraParams: Map<string, string>;
        if (request.extraQueryParameters === undefined) {
            extraParams = new Map<string, string>();
        } else {
            extraParams = new Map<string, string>(
                Object.entries(request.extraQueryParameters)
            );
        }
        /**
         * Need to get information about the client to populate request correctly
         * For example: client id, client capabilities
         */
        const tokenRequest: TokenRequest = {
            userObjectId: request.account?.homeAccountId,
            clientId: this.clientId,
            authority: request.authority,
            scope: request.scopes.join(" "),
            correlationId:
                request.correlationId !== undefined
                    ? request.correlationId
                    : "",
            prompt: request.prompt !== undefined ? request.prompt : "",
            claims: request.claims !== undefined ? request.claims : "",
            authenticationScheme:
                request.authenticationScheme !== undefined
                    ? request.authenticationScheme
                    : "",
            clientCapabilities: this.clientCapabilities,
            extraParameters: extraParams,
        };

        return tokenRequest;
    }

    public toNaaTokenRequest(
        request: PopupRequest | RedirectRequest
    ): TokenRequest {
        let extraParams: Map<string, string>;
        if (request.extraQueryParameters === undefined) {
            extraParams = new Map<string, string>();
        } else {
            extraParams = new Map<string, string>(
                Object.entries(request.extraQueryParameters)
            );
        }
        /**
         * Need to get information about the client to populate request correctly
         * For example: client id, client capabilities
         */
        const tokenRequest: TokenRequest = {
            userObjectId: request.account?.homeAccountId,
            clientId: this.clientId,
            authority: request.authority,
            scope: request.scopes.join(" "),
            correlationId:
                request.correlationId !== undefined
                    ? request.correlationId
                    : "",
            prompt: request.prompt !== undefined ? request.prompt : "",
            nonce: request.nonce !== undefined ? request.nonce : "",
            claims: request.claims !== undefined ? request.claims : "",
            state: request.state !== undefined ? request.state : "",
            authenticationScheme:
                request.authenticationScheme !== undefined
                    ? request.authenticationScheme
                    : "",
            clientCapabilities: undefined,
            extraParameters: extraParams,
        };

        return tokenRequest;
    }

    public fromNaaTokenResponse(
        request: TokenRequest,
        response: TokenResponse
    ): AuthenticationResult {
        const expiresOn = new Date(
            TimeUtils.nowSeconds() + (response.expires_in || 0) * 1000
        );

        /*
         * Currently we're not getting id_token back....
         *let authToken: AuthToken;
         *if (response.id_token !== undefined) {
         *    authToken = new AuthToken(response.id_token, this.crypto);
         *}
         */
        const authenticationResult: AuthenticationResult = {
            authority: response.account.environment,
            uniqueId: response.account.homeAccountId,
            tenantId: response.account.tenantId,
            scopes: response.scope.split(" "),
            account: this.fromNaaAccountInfo(response.account),
            /*
             * idToken: response.id_token,
             * idTokenClaims: authToken.claims,
             */
            idToken: "",
            idTokenClaims: {},
            accessToken: response.access_token,
            fromCache: true,
            expiresOn: expiresOn,
            tokenType:
                request.authenticationScheme !== undefined
                    ? request.authenticationScheme
                    : "Bearer",
            correlationId: request.correlationId,
            requestId: "",
            extExpiresOn: expiresOn,
            state: response.state,
        };

        return authenticationResult;
    }

    public fromNaaAccountInfo(fromAccount: NaaAccountInfo): MsalAccountInfo {
        const account: MsalAccountInfo = {
            homeAccountId: fromAccount.homeAccountId,
            environment: fromAccount.environment,
            tenantId: fromAccount.tenantId,
            username: fromAccount.username,
            localAccountId: fromAccount.localAccountId,
            name: fromAccount.name,
            idTokenClaims: {},
        };

        return account;
    }

    /**
     *
     * @param error BridgeError
     * @returns AuthError, ClientAuthError, ClientConfigurationError, ServerError, InteractionRequiredError
     */
    public fromBridgeError(
        error: unknown
    ):
        | AuthError
        | ClientAuthError
        | ClientConfigurationError
        | ServerError
        | InteractionRequiredAuthError {
        if (isBridgeError(error)) {
            switch (error.status) {
                case BridgeStatusCode.USER_CANCEL:
                case BridgeStatusCode.NO_NETWORK:
                case BridgeStatusCode.ACCOUNT_UNAVAILABLE:
                case BridgeStatusCode.DISABLED:
                case BridgeStatusCode.NESTED_APP_AUTH_UNAVAILABLE:
                    return new ClientAuthError(error.code, error.description);
                case BridgeStatusCode.TRANSIENT_ERROR:
                case BridgeStatusCode.PERSISTENT_ERROR:
                    return new ServerError(error.code, error.description);
                case BridgeStatusCode.USER_INTERACTION_REQUIRED:
                    return new InteractionRequiredAuthError(
                        error.code,
                        error.description
                    );
                default:
                    return new AuthError(error.code, error.description);
            }
        } else {
            return new AuthError("unknown_error", "An unknown error occurred");
        }
    }
}
