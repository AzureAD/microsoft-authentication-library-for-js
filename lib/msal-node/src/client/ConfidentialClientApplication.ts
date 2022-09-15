/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientApplication } from "./ClientApplication";
import { Configuration } from "../config/Configuration";
import { ClientAssertion } from "./ClientAssertion";
import { Constants as NodeConstants, ApiId, REGION_ENVIRONMENT_VARIABLE } from "../utils/Constants";
import {
    ClientCredentialClient,
    OnBehalfOfClient,
    CommonClientCredentialRequest,
    CommonOnBehalfOfRequest,
    AuthenticationResult,
    StringUtils,
    ClientAuthError,
    AzureRegionConfiguration,
    AuthError,
    Constants,
    IAppTokenProvider,
    OIDC_DEFAULT_SCOPES
} from "@azure/msal-common";
import { IConfidentialClientApplication } from "./IConfidentialClientApplication";
import { OnBehalfOfRequest } from "../request/OnBehalfOfRequest";
import { ClientCredentialRequest } from "../request/ClientCredentialRequest";

/**
 *  This class is to be used to acquire tokens for confidential client applications (webApp, webAPI). Confidential client applications
 *  will configure application secrets, client certificates/assertions as applicable
 * @public
 */
export class ConfidentialClientApplication extends ClientApplication implements IConfidentialClientApplication {
    private appTokenProvider?: IAppTokenProvider;

    /**
     * Constructor for the ConfidentialClientApplication
     *
     * Required attributes in the Configuration object are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our application registration portal
     * - authority: the authority URL for your application.
     * - client credential: Must set either client secret, certificate, or assertion for confidential clients. You can obtain a client secret from the application registration portal.
     *
     * In Azure AD, authority is a URL indicating of the form https://login.microsoftonline.com/\{Enter_the_Tenant_Info_Here\}.
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://\{instance\}/tfp/\{tenant\}/\{policyName\}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param Configuration - configuration object for the MSAL ConfidentialClientApplication instance
     */
    constructor(configuration: Configuration) {
        super(configuration);
        this.setClientCredential(this.config);
        this.appTokenProvider = undefined;
    }

    /**               
     * This extensibility point only works for the client_credential flow, i.e. acquireTokenByClientCredential and
     * is meant for Azure SDK to enhance Managed Identity support.
     * 
     * @param IAppTokenProvider  - Extensibility interface, which allows the app developer to return a token from a custom source.     
     */
    SetAppTokenProvider(provider: IAppTokenProvider): void {
        this.appTokenProvider = provider;
    }

    /**
     * Acquires tokens from the authority for the application (not for an end user).
     */
    public async acquireTokenByClientCredential(request: ClientCredentialRequest): Promise<AuthenticationResult | null> {
        this.logger.info("acquireTokenByClientCredential called", request.correlationId);

        // If there is a client assertion present in the request, it overrides the one present in the client configuration
        let clientAssertion;
        if (request.clientAssertion) {
            clientAssertion = {
                assertion: request.clientAssertion,
                assertionType: NodeConstants.JWT_BEARER_ASSERTION_TYPE
            };
        }

        const baseRequest = await this.initializeBaseRequest(request);

        // valid base request should not contain oidc scopes in this grant type
        const validBaseRequest = {
            ...baseRequest,
            scopes: baseRequest.scopes.filter((scope: string) => !OIDC_DEFAULT_SCOPES.includes(scope))
        };

        const validRequest: CommonClientCredentialRequest = {
            ...request,
            ...validBaseRequest,
            clientAssertion
        };

        const azureRegionConfiguration: AzureRegionConfiguration = {
            azureRegion: validRequest.azureRegion,
            environmentRegion: process.env[REGION_ENVIRONMENT_VARIABLE]
        };

        const serverTelemetryManager = this.initializeServerTelemetryManager(ApiId.acquireTokenByClientCredential, validRequest.correlationId, validRequest.skipCache);
        try {
            const clientCredentialConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                validRequest.correlationId,
                serverTelemetryManager,
                azureRegionConfiguration,
                request.azureCloudOptions
            );
            const clientCredentialClient = new ClientCredentialClient(clientCredentialConfig, this.appTokenProvider);
            this.logger.verbose("Client credential client created", validRequest.correlationId);
            return clientCredentialClient.acquireToken(validRequest);
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(validRequest.correlationId);
            }
            serverTelemetryManager.cacheFailedRequest(e);
            throw e;
        }
    }

    /**
     * Acquires tokens from the authority for the application.
     *
     * Used in scenarios where the current app is a middle-tier service which was called with a token
     * representing an end user. The current app can use the token (oboAssertion) to request another
     * token to access downstream web API, on behalf of that user.
     *
     * The current middle-tier app has no user interaction to obtain consent.
     * See how to gain consent upfront for your middle-tier app from this article.
     * https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow#gaining-consent-for-the-middle-tier-application
     */
    public async acquireTokenOnBehalfOf(request: OnBehalfOfRequest): Promise<AuthenticationResult | null> {
        this.logger.info("acquireTokenOnBehalfOf called", request.correlationId);
        const validRequest: CommonOnBehalfOfRequest = {
            ...request,
            ... await this.initializeBaseRequest(request)
        };
        try {
            const onBehalfOfConfig = await this.buildOauthClientConfiguration(
                validRequest.authority,
                validRequest.correlationId,
                undefined,
                undefined,
                request.azureCloudOptions
            );
            const oboClient = new OnBehalfOfClient(onBehalfOfConfig);
            this.logger.verbose("On behalf of client created", validRequest.correlationId);
            return oboClient.acquireToken(validRequest);
        } catch (e) {
            if (e instanceof AuthError) {
                e.setCorrelationId(validRequest.correlationId);
            }
            throw e;
        }
    }

    private setClientCredential(configuration: Configuration): void {
        const clientSecretNotEmpty = !StringUtils.isEmpty(configuration.auth.clientSecret);
        const clientAssertionNotEmpty = !StringUtils.isEmpty(configuration.auth.clientAssertion);
        const certificate = configuration.auth.clientCertificate || {
            thumbprint: Constants.EMPTY_STRING,
            privateKey: Constants.EMPTY_STRING
        };
        const certificateNotEmpty = !StringUtils.isEmpty(certificate.thumbprint) || !StringUtils.isEmpty(certificate.privateKey);

        /*
         * If app developer configures this callback, they don't need a credential
         * i.e. AzureSDK can get token from Managed Identity without a cert / secret
         */
        if (this.appTokenProvider) {
            return;
        }

        // Check that at most one credential is set on the application
        if (
            clientSecretNotEmpty && clientAssertionNotEmpty ||
            clientAssertionNotEmpty && certificateNotEmpty ||
            clientSecretNotEmpty && certificateNotEmpty) {
            throw ClientAuthError.createInvalidCredentialError();
        }

        if (configuration.auth.clientSecret) {
            this.clientSecret = configuration.auth.clientSecret;
            return;
        }

        if (configuration.auth.clientAssertion) {
            this.clientAssertion = ClientAssertion.fromAssertion(configuration.auth.clientAssertion);
            return;
        }

        if (!certificateNotEmpty) {
            throw ClientAuthError.createInvalidCredentialError();
        } else {
            this.clientAssertion = ClientAssertion.fromCertificate(certificate.thumbprint, certificate.privateKey, configuration.auth.clientCertificate?.x5c);
        }
    }
}
