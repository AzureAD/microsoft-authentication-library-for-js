/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo, AuthenticationResult, AuthenticationScheme, IdTokenClaims, INativeBrokerPlugin, Logger, NativeRequest } from "@azure/msal-common";
import { Account, addon, AuthParameters, AuthResult } from "@azure/msal-node-runtime";
import { version, name } from "../packageMetadata";

export class NativeBrokerPlugin implements INativeBrokerPlugin {
    private clientId: string;
    private logger: Logger;

    constructor(clientId: string, logger: Logger) { 
        this.clientId = clientId;
        this.logger = logger.clone(name, version);
    }

    async getAccountById(accountId: string): Promise<AccountInfo> {
        this.logger.trace("NativeBrokerPlugin - getAccountById called");
        throw new Error (`Could not get account for ${ accountId }`);
    }

    async acquireTokenSilent(request: NativeRequest): Promise<AuthenticationResult> {
        this.logger.trace("NativeBrokerPlugin - acquireTokenSilent called", request.correlationId);
        throw new Error(`${request.correlationId} - This method is not implemented in the native broker plugin.`);
    }

    async acquireTokenInteractive(request: NativeRequest): Promise<AuthenticationResult> {
        this.logger.trace("NativeBrokerPlugin - acquireTokenInteractive called", request.correlationId);
        const authParams = this.generateRequestParameters(request);
        return new Promise((resolve: (value: AuthenticationResult) => void, reject) => {
            const resultCallback = (authResult) => {
                try {
                    authResult.GetError();
                } catch (e) {
                    reject(e);
                }
                const authenticationResult = this.getAuthenticationResult(request, authResult);
                resolve(authenticationResult);
            };
            const callback = new addon.Callback(resultCallback);
            const asyncHandle = new addon.AsyncHandle();
            addon.SignInInteractively(authParams, request.correlationId, "", callback, asyncHandle);
        });
    }

    async acquireTokenByUsernamePassword(request: NativeRequest): Promise<AuthenticationResult> {
        this.logger.trace("NativeBrokerPlugin - acquireTokenByUsernamePassword called", request.correlationId);
        throw new Error(`${request.correlationId} - This method is not implemented in the native broker plugin.`);
    }

    private generateRequestParameters(request: NativeRequest): AuthParameters {
        this.logger.trace("NativeBrokerPlugin - generateRequestParameters called", request.correlationId);
        const authParams = new addon.AuthParameters(this.clientId, request.authority);
        authParams.SetRedirectUri(request.redirectUri);
        authParams.SetRequestedScopes(request.scopes.join(" "));

        if (request.claims) {
            authParams.SetDecodedClaims(request.claims);
        }
        
        if (request.extraParameters) {
            Object.keys(request.extraParameters).forEach((key) => {
                authParams.SetAdditionalParameter(key, request.extraParameters[key]);
            });
        }

        return authParams;
    }

    private getAuthenticationResult(request: NativeRequest, authResult: AuthResult): AuthenticationResult {
        this.logger.trace("NativeBrokerPlugin - getAuthenticationResult called", request.correlationId);
        const accessToken = authResult.GetAccessToken();
        const rawIdToken = authResult.GetRawIdToken();
        const idToken = authResult.GetIdToken();
        const scopes = authResult.GetGrantedScopes();
        const expiresOn = authResult.GetExpiresOn();
        const telemetryData = authResult.GetTelemetryData();
        
        let fromCache;
        try {
            const telemetryJSON = JSON.parse(telemetryData);
            fromCache = !!telemetryJSON["is_cache"];
        } catch (e) {
            this.logger.error("NativeBrokerPlugin: getAuthenticationResult - Error parsing telemetry data. Could not determine if response came from cache.", request.correlationId);
        } 
        
        const isPop = authResult.IsPopAuthorization();
        const account = authResult.GetAccount();

        let idTokenClaims: IdTokenClaims;
        try {
            idTokenClaims = JSON.parse(idToken);
        } catch (e) {
            throw new Error("Unable to parse idToken claims");
        }

        const accountInfo = this.generateAccountInfo(account, idTokenClaims);

        const result: AuthenticationResult = {
            authority: request.authority,
            uniqueId: idTokenClaims.oid || idTokenClaims.sub || "",
            tenantId: idTokenClaims.tid || "",
            scopes: scopes.split(" "),
            account: accountInfo,
            idToken: rawIdToken,
            idTokenClaims: idTokenClaims,
            accessToken: accessToken,
            fromCache: fromCache,
            expiresOn: new Date(expiresOn * 1000),
            tokenType: isPop ? AuthenticationScheme.POP : AuthenticationScheme.BEARER,
            correlationId: request.correlationId,
            fromNativeBroker: true
        };
        return result;
    }

    private generateAccountInfo(account: Account, idTokenClaims: IdTokenClaims): AccountInfo {
        this.logger.trace("NativeBrokerPlugin - generateAccountInfo called");

        const accountInfo: AccountInfo = {
            homeAccountId: account.GetHomeAccountId(),
            environment: account.GetEnvironment(),
            tenantId: account.GetRealm(),
            username: account.GetUsername(),
            localAccountId: account.GetLocalAccountId(),
            name: account.GetDisplayName(),
            idTokenClaims: idTokenClaims,
            nativeAccountId: account.GetAccountId()
        };
        return accountInfo;
    }
}
