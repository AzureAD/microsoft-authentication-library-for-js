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
    AuthToken,
    TokenClaims,
    ClientAuthErrorCodes,
} from "@azure/msal-common";
import { isBridgeError } from "../BridgeError";
import { BridgeStatusCode } from "../BridgeStatusCode";
import { SilentRequest } from "../../request/SilentRequest";
import { AuthenticationResult } from "../../response/AuthenticationResult";
import {} from "../../error/BrowserAuthErrorCodes";

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
                    : this.crypto.createNewGuid(),
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

        const account = this.fromNaaAccountInfo(response.account);

        const authenticationResult: AuthenticationResult = {
            authority: response.account.environment,
            uniqueId: response.account.homeAccountId,
            tenantId: response.account.tenantId,
            scopes: response.scope.split(" "),
            account: this.fromNaaAccountInfo(response.account),
            idToken: response.id_token !== undefined ? response.id_token : "",
            idTokenClaims:
                account.idTokenClaims !== undefined
                    ? account.idTokenClaims
                    : {},
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

    /*
     *  export type AccountInfo = {
     *     homeAccountId: string;
     *     environment: string;
     *     tenantId: string;
     *     username: string;
     *     localAccountId: string;
     *     name?: string;
     *     idToken?: string;
     *     idTokenClaims?: TokenClaims & {
     *         [key: string]:
     *             | string
     *             | number
     *             | string[]
     *             | object
     *             | undefined
     *             | unknown;
     *     };
     *     nativeAccountId?: string;
     *     authorityType?: string;
     * };
     */
    public fromNaaAccountInfo(fromAccount: NaaAccountInfo): MsalAccountInfo {
        let tokenClaims: TokenClaims | undefined;
        if (fromAccount.idToken !== undefined) {
            tokenClaims = AuthToken.extractTokenClaims(
                fromAccount.idToken,
                this.crypto.base64Decode
            );
        } else {
            tokenClaims = undefined;
        }

        const account: MsalAccountInfo = {
            homeAccountId: fromAccount.homeAccountId,
            environment: fromAccount.environment,
            tenantId: fromAccount.tenantId,
            username: fromAccount.username,
            localAccountId: fromAccount.localAccountId,
            name: fromAccount.name,
            idToken: fromAccount.idToken,
            idTokenClaims: tokenClaims,
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
                    return new ClientAuthError(
                        ClientAuthErrorCodes.userCanceled
                    );
                case BridgeStatusCode.NO_NETWORK:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.noNetworkConnectivity
                    );
                case BridgeStatusCode.ACCOUNT_UNAVAILABLE:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.noAccountFound
                    );
                case BridgeStatusCode.DISABLED:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.nestedAppAuthBridgeDisabled
                    );
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
