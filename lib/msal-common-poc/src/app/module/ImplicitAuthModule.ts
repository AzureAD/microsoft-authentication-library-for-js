/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "../MsalConfiguration";
// authority
import { AuthorityFactory } from "../../auth/authority/AuthorityFactory";
// request
import { AuthenticationParameters } from "../../request/AuthenticationParameters";
import { ImplicitTokenRequestParameters } from "../../request/server_request/ImplicitTokenRequestParameters";
// utils
import { CacheUtils } from "../../utils/CacheUtils";
import { AuthModule } from "./AuthModule";

/**
 * @hidden
 * @ignore
 * Data type to hold information about state returned from the server
 */
export type ResponseStateInfo = {
    state: string;
    stateMatch: boolean;
};

/**
 * ImplicitAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS using the implicit flow.
 * 
 */
export class ImplicitAuthModule extends AuthModule {

    /**
     * @constructor
     * Constructor for the UserAgentApplication used to instantiate the UserAgentApplication object
     *
     * Important attributes in the Configuration object for auth are:
     * - clientID: the application ID of your application.
     * You can obtain one by registering your application with our Application registration portal : https://portal.azure.com/#blade/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/RegisteredAppsPreview
     * - authority: the authority URL for your application.
     *
     * In Azure AD, authority is a URL indicating the Azure active directory that MSAL uses to obtain tokens.
     * It is of the form https://login.microsoftonline.com/&lt;Enter_the_Tenant_Info_Here&gt;.
     * If your application supports Accounts in one organizational directory, replace "Enter_the_Tenant_Info_Here" value with the Tenant Id or Tenant name (for example, contoso.microsoft.com).
     * If your application supports Accounts in any organizational directory, replace "Enter_the_Tenant_Info_Here" value with organizations.
     * If your application supports Accounts in any organizational directory and personal Microsoft accounts, replace "Enter_the_Tenant_Info_Here" value with common.
     * To restrict support to Personal Microsoft accounts only, replace "Enter_the_Tenant_Info_Here" value with consumers.
     *
     *
     * In Azure B2C, authority is of the form https://&lt;instance&gt;/tfp/&lt;tenant&gt;/&lt;policyName&gt;/
     *
     * @param {@link (Configuration:type)} configuration object for the MSAL UserAgentApplication instance
     */
    constructor(configuration: MsalConfiguration) {
        super(configuration);
    }

    /**
     * This function validates and returns a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    async createLoginUrl(request: AuthenticationParameters): Promise<string> {
        // Initialize authority or use default, and perform discovery endpoint check
        let acquireTokenAuthority = (request && request.authority) ? AuthorityFactory.createInstance(request.authority, this.networkClient) : this.defaultAuthorityInstance;
        acquireTokenAuthority = await acquireTokenAuthority.resolveEndpointsAsync();

        // Set the account object to the current session
        request.account = this.getAccount();

        // Create and validate request parameters
        const serverRequestParameters = new ImplicitTokenRequestParameters(
            acquireTokenAuthority,
            this.config.auth.clientId,
            request,
            true,
            false,
            this.getAccount(),
            this.getRedirectUri(),
            this.crypto
        );

        // if extraScopesToConsent is passed in loginCall, append them to the login request
        serverRequestParameters.appendExtraScopes();

        if (!serverRequestParameters.isSSOParam(request.account)) {
            // TODO: Add ADAL Token SSO
        }

        // if the user sets the login start page - angular only??
        const loginStartPage = window.location.href;

        // Update entries for start of request event
        CacheUtils.updateCacheEntries(this.cacheStorage, serverRequestParameters, request.account, loginStartPage);

        // populate query parameters (sid/login_hint/domain_hint) and any other extraQueryParameters set by the developer
        serverRequestParameters.populateQueryParams();

        // Construct and return navigation url
        return serverRequestParameters.createNavigateUrl();
    }

    /**
     * This function validates and returns a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    async createAcquireTokenUrl(request: AuthenticationParameters): Promise<string> {
        return "";
    }
}
