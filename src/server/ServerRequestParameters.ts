/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import pkg from "../../package.json";
import { ICrypto } from "../crypto/ICrypto";
import { Constants } from "../utils/Constants";
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
}
