/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientApplication } from './ClientApplication';
import { Configuration } from "../config/Configuration";
import { ClientAssertion } from "../client/ClientAssertion";
import { StringUtils } from '@azure/msal-common';

export class ConfidentialClientApplication extends ClientApplication {

    /**
     * @constructor
     * Constructor for the ConfidentialClientApplication
     *
     * Required attributes in the Configuration object are:
     * - clientID: the application ID of your application. You can obtain one by registering your application with our Application registration portal
     * - authority: the authority URL for your application.
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
        this.setClientCredential(configuration);
    }

    private setClientCredential(configuration: Configuration): void {

        if (!StringUtils.isEmpty(configuration.auth!.clientSecret!)) {
            this.clientSecret = configuration.auth.clientSecret!;
            return;
        }

        if (!StringUtils.isEmpty(configuration.auth.clientAssertion!)) {
            this.clientAssertion = ClientAssertion.fromAssertion(configuration.auth.clientAssertion!);
            return;
        }

        if (configuration.auth.clientCertificate != null) {
            const certificate = configuration.auth.clientCertificate;
            if (StringUtils.isEmpty(certificate.thumbprint) || StringUtils.isEmpty(certificate.privateKey)) {
                // TODO Throw proper error
                throw Error();
            }

            this.clientAssertion = ClientAssertion.fromCertificate(certificate.thumbprint, certificate.privateKey);
            return; 
        }

        // TODO Throw proper error
        throw Error();
    }
}

