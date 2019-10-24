/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Authority } from "../auth/authority/Authority";
import { AuthenticationParameters } from "./AuthenticationParameters";
import { CryptoUtils } from "../utils/CryptoUtils";
import { StringUtils } from "../utils/StringUtils";
import pkg from "../../package.json";

export class ServerRequestParameters {

    // Params
    authorityInstance: Authority;
    clientId: string;
    scopes: Array<string>;
    responseType: string;
    redirectUri: string;
    request: AuthenticationParameters;
    queryParameters: string;

    // Validity checks
    nonce: string;
    state: string;

    // telemetry info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;
    
    constructor(authority: Authority, clientId: string, request: AuthenticationParameters, responseType: string, redirectUri: string) {
        this.authorityInstance = authority;
        this.clientId = clientId;

        if (!request.scopes) {
            this.scopes = [this.clientId];
        } else {
            this.scopes = [...request.scopes];
        }

        this.request = request;
        
        this.nonce = CryptoUtils.createNewGuid();
        this.state = request.state && !StringUtils.isEmpty(this.state) ? `${CryptoUtils.createNewGuid()}|${this.state}` : CryptoUtils.createNewGuid();
    
        // TODO: Change this to user passed vs generated with separate PR
        this.correlationId = CryptoUtils.createNewGuid();

        // telemetry information
        this.xClientSku = "MSAL.JS";
        // this.xClientVer = libraryVersion();
    }

}
