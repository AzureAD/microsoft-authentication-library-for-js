/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientApplication } from './ClientApplication';
import { Configuration } from "../config/Configuration";
import { ClientAssertion } from "../client/ClientAssertion";
import { ClientCredentialRequest, ClientCredentialClient, AuthenticationResult, StringUtils, ClientAuthError } from '@azure/msal-common';

export class ConfidentialClientApplication extends ClientApplication {

    /**
     * @constructor
     * Constructor for the ConfidentialClientApplication
     *
     * Required attributes in the Configuration object are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our application registration portal
     * - authority: the authority URL for your application.
     * - client credential: Must set either client secret, certificate, or assertion for confidential clients. You can obtain a client secret from the application registration portal.
     *
     * In Azure AD, authority is a URL indicating of the form https://login.microsoftonline.com/{Enter_the_Tenant_Info_Here}.
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     * In Azure B2C, authority is of the form https://{instance}/tfp/{tenant}/{policyName}/
     * Full B2C functionality will be available in this library in future versions.
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL ConfidentialClientApplication instance
     */
    constructor(configuration: Configuration) {
        super(configuration);
        this.setClientCredential(this.config);
    }

    /**
     * Acquires tokens from the authority for the application.
     */
    public async acquireTokenByClientCredential(request: ClientCredentialRequest): Promise<AuthenticationResult> {
        this.logger.info("acquireTokenByClientCredential called");
        const clientCredentialConfig = await this.buildOauthClientConfiguration(
            request.authority
        );
        this.logger.verbose("Auth client config generated");
        const clientCredentialClient = new ClientCredentialClient(clientCredentialConfig);
        return clientCredentialClient.acquireToken(request);
    }

    private setClientCredential(configuration: Configuration): void {

        const clientSecretNotEmpty = !StringUtils.isEmpty(configuration.auth.clientSecret!);
        const clientAssertionNotEmpty = !StringUtils.isEmpty(configuration.auth.clientAssertion!);
        const certificate = configuration.auth.clientCertificate!;
        const certificateNotEmpty = !StringUtils.isEmpty(certificate.thumbprint) || !StringUtils.isEmpty(certificate.privateKey);

        // Check that at most one credential is set on the application 
        if (
            clientSecretNotEmpty && clientAssertionNotEmpty ||
            clientAssertionNotEmpty && certificateNotEmpty ||
            clientSecretNotEmpty && certificateNotEmpty) {
                throw ClientAuthError.createInvalidCredentialError();
        }

        if (clientSecretNotEmpty) {
            this.clientSecret = configuration.auth.clientSecret!;
            return;
        }

        if (clientAssertionNotEmpty) {
            this.clientAssertion = ClientAssertion.fromAssertion(configuration.auth.clientAssertion!);
            return;
        }

        if (!certificateNotEmpty) {
            throw ClientAuthError.createInvalidCredentialError();
        } else {
            this.clientAssertion = ClientAssertion.fromCertificate(certificate.thumbprint, certificate.privateKey);
        }
    }
}
