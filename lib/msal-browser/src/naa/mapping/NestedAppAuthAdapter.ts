/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenRequest } from "../TokenRequest";
import { AccountInfo as NaaAccountInfo } from "../AccountInfo";
import { RedirectRequest } from "../../request/RedirectRequest";
import { PopupRequest } from "../../request/PopupRequest";
import {
    AccountInfo as MsalAccountInfo,
    AuthError,
    ClientAuthError,
    ClientConfigurationError,
    InteractionRequiredAuthError,
    ServerError,
    ICrypto,
    Logger,
    AuthToken,
    TokenClaims,
    ClientAuthErrorCodes,
    AuthenticationScheme,
    RequestParameterBuilder,
    StringUtils,
    createClientAuthError,
} from "@azure/msal-common";
import { isBridgeError } from "../BridgeError";
import { BridgeStatusCode } from "../BridgeStatusCode";
import { AuthenticationResult } from "../../response/AuthenticationResult";
import {} from "../../error/BrowserAuthErrorCodes";
import { AuthResult } from "../AuthResult";

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

        const requestBuilder = new RequestParameterBuilder();
        const claims = requestBuilder.addClientCapabilitiesToClaims(
            request.claims,
            this.clientCapabilities
        );
        const tokenRequest: TokenRequest = {
            platformBrokerId: request.account?.homeAccountId,
            clientId: this.clientId,
            authority: request.authority,
            scope: request.scopes.join(" "),
            correlationId:
                request.correlationId !== undefined
                    ? request.correlationId
                    : this.crypto.createNewGuid(),
            claims: !StringUtils.isEmptyObj(claims) ? claims : undefined,
            state: request.state,
            authenticationScheme:
                request.authenticationScheme || AuthenticationScheme.BEARER,
            extraParameters: extraParams,
        };

        return tokenRequest;
    }

    public fromNaaTokenResponse(
        request: TokenRequest,
        response: AuthResult,
        reqTimestamp: number
    ): AuthenticationResult {
        if (!response.token.id_token || !response.token.access_token) {
            throw createClientAuthError(ClientAuthErrorCodes.nullOrEmptyToken);
        }

        const expiresOn = new Date(
            (reqTimestamp + (response.token.expires_in || 0)) * 1000
        );
        const idTokenClaims = AuthToken.extractTokenClaims(
            response.token.id_token,
            this.crypto.base64Decode
        );
        const account = this.fromNaaAccountInfo(
            response.account,
            idTokenClaims
        );
        const scopes = response.token.scope || request.scope;

        const authenticationResult: AuthenticationResult = {
            authority: response.token.authority || account.environment,
            uniqueId: account.localAccountId,
            tenantId: account.tenantId,
            scopes: scopes.split(" "),
            account,
            idToken: response.token.id_token,
            idTokenClaims,
            accessToken: response.token.access_token,
            fromCache: true,
            expiresOn: expiresOn,
            tokenType:
                request.authenticationScheme || AuthenticationScheme.BEARER,
            correlationId: request.correlationId,
            extExpiresOn: expiresOn,
            state: request.state,
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
    public fromNaaAccountInfo(
        fromAccount: NaaAccountInfo,
        idTokenClaims?: TokenClaims
    ): MsalAccountInfo {
        const effectiveIdTokenClaims =
            idTokenClaims || (fromAccount.idTokenClaims as TokenClaims);

        const localAccountId =
            fromAccount.localAccountId ||
            effectiveIdTokenClaims?.oid ||
            effectiveIdTokenClaims?.sub ||
            "";

        const tenantId =
            fromAccount.tenantId || effectiveIdTokenClaims?.tid || "";

        const homeAccountId =
            fromAccount.homeAccountId || `${localAccountId}.${tenantId}`;

        const username =
            fromAccount.username ||
            effectiveIdTokenClaims?.preferred_username ||
            "";

        const name = fromAccount.name || effectiveIdTokenClaims?.name;

        const account: MsalAccountInfo = {
            homeAccountId,
            environment: fromAccount.environment,
            tenantId,
            username,
            localAccountId,
            name,
            idToken: fromAccount.idToken,
            idTokenClaims: effectiveIdTokenClaims,
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
                case BridgeStatusCode.UserCancel:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.userCanceled
                    );
                case BridgeStatusCode.NoNetwork:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.noNetworkConnectivity
                    );
                case BridgeStatusCode.AccountUnavailable:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.noAccountFound
                    );
                case BridgeStatusCode.Disabled:
                    return new ClientAuthError(
                        ClientAuthErrorCodes.nestedAppAuthBridgeDisabled
                    );
                case BridgeStatusCode.NestedAppAuthUnavailable:
                    return new ClientAuthError(
                        error.code ||
                            ClientAuthErrorCodes.nestedAppAuthBridgeDisabled,
                        error.description
                    );
                case BridgeStatusCode.TransientError:
                case BridgeStatusCode.PersistentError:
                    return new ServerError(error.code, error.description);
                case BridgeStatusCode.UserInteractionRequired:
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
