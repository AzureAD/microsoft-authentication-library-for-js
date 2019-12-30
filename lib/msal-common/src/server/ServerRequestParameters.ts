/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ICrypto } from "../crypto/ICrypto";
import { Constants } from "../utils/Constants";
import pkg from "../../package.json";
import { ScopeSet } from "../auth/ScopeSet";

export abstract class ServerRequestParameters {
    // Crypto functions
    protected cryptoObj: ICrypto;

    // Params
    clientId: string;
    scopes: ScopeSet;
    redirectUri: string;

    // Validity checks
    state: string;

    // Telemetry Info
    xClientVer: string;
    xClientSku: string;
    correlationId: string;

    constructor(clientId: string, redirectUri: string, cryptoImpl: ICrypto) {
        this.clientId = clientId;
        this.cryptoObj = cryptoImpl;
        this.redirectUri = redirectUri;

        // Telemetry Info
        this.xClientSku = Constants.LIBRARY_NAME;
        this.xClientVer = pkg.version;
    }

    protected abstract createParamString(): Promise<Array<string>>;
    
    /**
     * Replace client id with the default scopes used for token acquisition.
     */
    protected replaceDefaultScopes() {
        if (this.scopes.containsScope(this.clientId)) {
            this.scopes.removeScope(this.clientId);
            this.scopes.appendScope(Constants.OPENID_SCOPE);
            this.scopes.appendScope(Constants.PROFILE_SCOPE);
        }
        this.scopes.appendScope(Constants.OFFLINE_ACCESS_SCOPE);
    }
}
