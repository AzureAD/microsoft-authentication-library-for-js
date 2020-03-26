/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DeviceCodeClient,
    DeviceCodeRequest,
    AuthenticationResult,
} from '@azure/msal-common';
import { ClientConfiguration } from '../config/ClientConfiguration';
import { ClientApplication } from './ClientApplication';

/**
 * Class to be used to acquire tokens for public client applications (desktop, mobile). Public client applications
 * are not trusted to safely store application secrets, and therefore can only request tokens in the name of an user.
 */
export class PublicClientApplication extends ClientApplication {
    /**
     * @constructor
     * Constructor for the PublicClientApplication
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
     * @param {@link (Configuration:type)} configuration object for the MSAL PublicClientApplication instance
     */
    constructor(configuration: ClientConfiguration) {
        super(configuration);
    }

    /**
     * Acquires token from the authority using OAuth2.0 device code flow.
     * Flow is designed for devices that do not have access to a browser or have input constraints.
     * The authorization server issues DeviceCode object with a verification code, an end-user code
     * and the end-user verification URI. DeviceCode object is provided through callback, end-user should be
     * instructed to use another device to navigate to the verification URI to input credentials.
     * Since the client cannot receive incoming requests, it polls the authorization server repeatedly
     * until the end-user completes input of credentials.
     * @param request
     */
    public async acquireTokenByDeviceCode(
        request: DeviceCodeRequest
    ): Promise<AuthenticationResult> {
        let deviceCodeClient: DeviceCodeClient = new DeviceCodeClient(
            this.buildOauthClientConfiguration()
        );
        return deviceCodeClient.acquireToken(request);
    }
}
