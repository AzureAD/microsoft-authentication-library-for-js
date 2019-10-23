/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// app
import { MsalConfiguration } from "./MsalConfiguration";
// request
import { AuthenticationParameters } from "../request/AuthenticationParameters";
// response
import { AuthResponse } from "../response/AuthResponse";
// cache
import { ICacheStorage } from "../cache/ICacheStorage";
import { INetworkModule } from "./INetworkModule";

/**
 * ImplicitAuthModule class
 * 
 * Object instance which will construct requests to send to and handle responses from the Microsoft STS.
 * 
 */
export class ImplicitAuthModule {

    private config: MsalConfiguration;

    // Interface implementations
    private cacheStorage: ICacheStorage;
    private networkModule: INetworkModule;

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
        // Set the configuration
        this.config = configuration;
        
        // Set the cache
        this.cacheStorage = this.config.storageInterface;
        
        // Set the network interface
        this.networkModule = this.config.networkInterface;
    }

    /**
     * This function creates a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    login(request: AuthenticationParameters): void {
        return;
    }

    /**
     * This function creates a navigation uri based on a given request object. See request/AuthenticationParameters.ts for more information on how to construct the request object.
     * @param request 
     */
    acquireToken(request: AuthenticationParameters): void {
        return;
    }

    /**
     * This function parses the response from the Microsoft STS and returns a response in the form of the AuthResponse object. See response/AuthResponse.ts for more information on that object.
     * @param hash 
     */
    handleResponse(hash: string): AuthResponse {
        
        return null;
    }

    /**
     * Returns current window URL as redirect uri
     */
    getDefaultRedirectUri(): string {
        return window.location.href.split("?")[0].split("#")[0];
    }

}
