/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ApiId, Constants } from "../utils/Constants";
import {
    DeviceCodeClient,
    AuthenticationResult,
    CommonDeviceCodeRequest,
    AuthError,
    ResponseMode,
    UrlString,
    OIDC_DEFAULT_SCOPES,
    CodeChallengeMethodValues,
    Constants as CommonConstants
} from "@azure/msal-common";
import { Configuration } from "../config/Configuration";
import { ClientApplication } from "./ClientApplication";
import { IPublicClientApplication } from "./IPublicClientApplication";
import { DeviceCodeRequest } from "../request/DeviceCodeRequest";
import { AuthorizationUrlRequest } from "../request/AuthorizationUrlRequest";
import { createServer, IncomingMessage, ServerResponse } from "http";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { InteractiveRequest } from "../request/InteractiveRequest";
import { NodeAuthError } from "../error/NodeAuthError";

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

        return new Promise(async (resolve, reject) => {
            const server = createServer((req: IncomingMessage, res: ServerResponse) => {
                const url = req.url;
                if (!url) {
                    res.end(errorTemplate || "Error occurred loading redirectUrl");
                    return;
                } else if (url === CommonConstants.FORWARD_SLASH) {
                    res.end(successTemplate || "Auth code was successfully acquired. You can close this window now.");
                    return;
                }

                const authCodeResponse = UrlString.getDeserializedQueryString(url);
                const code = authCodeResponse.code;
                if (code) {
                    const redirectUri = `${Constants.HTTP_PROTOCOL}${req.headers.host}`;
                    res.writeHead(302, { location: redirectUri }); // Prevent auth code from being saved in the browser history
                    res.end();

                    if (!req.headers.host) {
                        reject(NodeAuthError.createHostHeaderMissingError());
                    }
                    
                    const clientInfo = authCodeResponse.client_info;
                    const tokenRequest: AuthorizationCodeRequest = {
                        code: code,
                        scopes: OIDC_DEFAULT_SCOPES,
                        redirectUri: redirectUri,
                        codeVerifier: verifier,
                        clientInfo: clientInfo || CommonConstants.EMPTY_STRING
                    };
                    this.acquireTokenByCode(tokenRequest).then(response => {
                        resolve(response);
                    }).catch((e) => {
                        reject(e);
                    });
                } else if (authCodeResponse.error) {
                    res.end(errorTemplate || `Error occurred: ${authCodeResponse.error}`);
                } else {
                    res.end(errorTemplate || "Unknown error occurred");
                }
            });
            server.listen(0); // Listen on any available port
            const port: number = await new Promise((resolvePort) => {
                const id = setInterval(() => {
                    const address = server.address();
                    if (typeof address === "string") {
                        clearInterval(id);
                        reject(NodeAuthError.createAddressWrongTypeError());
                    } else if (address && address.port) {
                        clearInterval(id);
                        resolvePort(address.port);
                    }
                }, 100);
            });

            const validRequest: AuthorizationUrlRequest = {
                ...remainingProperties,
                scopes: request.scopes || [],
                redirectUri: `${Constants.HTTP_PROTOCOL}${Constants.LOCALHOST}:${port}`,
                responseMode: ResponseMode.QUERY,
                codeChallenge: challenge, 
                codeChallengeMethod: CodeChallengeMethodValues.S256
            };

            const authCodeUrl = await this.getAuthCodeUrl(validRequest);
            await openBrowser(authCodeUrl);
        });
    }
}
