/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiId } from "../utils/Constants";
import {
    DeviceCodeClient,
    AuthenticationResult,
    CommonDeviceCodeRequest,
    AuthError,
    ResponseMode,
    OIDC_DEFAULT_SCOPES,
    CodeChallengeMethodValues,
    Constants as CommonConstants,
    ServerError
} from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { ClientApplication } from "./ClientApplication";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { DeviceCodeRequest } from "../request/DeviceCodeRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { InteractiveRequest } from "../request/InteractiveRequest";
import { NodeAuthError } from "../error/NodeAuthError";
import { LoopbackClient } from "../network/LoopbackClient";

/**
 * This class is to be used to acquire tokens for public client applications (desktop, mobile). Public client applications
 * are not trusted to safely store application secrets, and therefore can only request tokens in the name of an user.
 * @public
 */
export class PublicClientApplication extends ClientApplication implements IPublicClientApplication {
    /**
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal.
     * - authority: the authority URL for your application.
     *
     * AAD authorities are of the form https://login.microsoftonline.com/\{Enter_the_Tenant_Info_Here\}.
     * - If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * - If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * - If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * - To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * Azure B2C authorities are of the form https://\{instance\}/\{tenant\}/\{policy\}. Each policy is considered
     * its own authority. You will have to set the all of the knownAuthorities at the time of the client application
     * construction.
     *
     * ADFS authorities are of the form https://\{instance\}/adfs.
     */
    constructor(configuration: Configuration) {
        super(configuration);
    }

    /**
     * Acquires a token from the authority using OAuth2.0 device code flow.
     * This flow is designed for devices that do not have access to a browser or have input constraints.
     * The authorization server issues a DeviceCode object with a verification code, an end-user code,
     * and the end-user verification URI. The DeviceCode object is provided through a callback, and the end-user should be
     * instructed to use another device to navigate to the verification URI to input credentials.
     * Since the client cannot receive incoming requests, it polls the authorization server repeatedly
     * until the end-user completes input of credentials.
     */
    public async acquireTokenByDeviceCode(request: DeviceCodeRequest): Promise<AuthenticationResult | null> {
        this.logger.info("acquireTokenByDeviceCode called", request.correlationId);
        const validRequest: CommonDeviceCodeRequest = Object.assign(request,  await this.initializeBaseRequest(request));
        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByDeviceCode, validRequest.correlationId);
        try {
            const deviceCodeConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                validRequest.correlationId,
                serverTelemetryManager,
                undefined,
                request.azureCloudOptions
            );
            const deviceCodeClient = new DeviceCodeClient(deviceCodeConfig);
            this.logger.verbose("Device code client created", validRequest.correlationId);
            return deviceCodeClient.acquireToken(validRequest);
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(validRequest.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }
    }

    /**
     * Acquires a token by requesting an Authorization code then exchanging it for a token.
     */
    async acquireTokenInteractive(request: InteractiveRequest): Promise<AuthenticationResult> {
        const { verifier, challenge } = await this.cryptoProvider.generatePkceCodes();
        const { openBrowser, successTemplate, errorTemplate, ...remainingProperties } = request;

        const loopbackClient = new LoopbackClient();
        const authCodeListener = loopbackClient.listenForAuthCode(successTemplate, errorTemplate);
        const redirectUri = loopbackClient.getRedirectUri();

        const validRequest: AuthorizationUrlRequest = {
            ...remainingProperties,
            scopes: request.scopes || [],
            redirectUri: redirectUri,
            responseMode: ResponseMode.QUERY,
            codeChallenge: challenge, 
            codeChallengeMethod: CodeChallengeMethodValues.S256
        };

        const authCodeUrl = await this.getAuthCodeUrl(validRequest);
        await openBrowser(authCodeUrl);
        const authCodeResponse = await authCodeListener.finally(() => {
            loopbackClient.closeServer();
        });

        if (authCodeResponse.error) {
            throw new ServerError(authCodeResponse.error, authCodeResponse.error_description, authCodeResponse.suberror);
        } else if (!authCodeResponse.code) {
            throw NodeAuthError.createNoAuthCodeInResponseError();
        }

        const clientInfo = authCodeResponse.client_info;
        const tokenRequest: AuthorizationCodeRequest = {
            code: authCodeResponse.code,
            scopes: OIDC_DEFAULT_SCOPES,
            redirectUri: validRequest.redirectUri,
            codeVerifier: verifier,
            clientInfo: clientInfo || CommonConstants.EMPTY_STRING
        };
        return this.acquireTokenByCode(tokenRequest);
    }
}
