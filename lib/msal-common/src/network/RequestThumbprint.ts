/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ClientInfo } from "../auth/ClientInfo";
import { ICrypto } from "../crypto/ICrypto";
import { StringUtils } from "../utils/StringUtils";

export class RequestThumbprint {
    authority: string;
    clientId: string;
    scopes: Array<string>;
    resource: string;
    homeAccountIdentifier: string;

    constructor(authority: string, clientId: string, scopes: Array<string>, resource: string, clientInfo: ClientInfo, cryptoObj: ICrypto) {
        this.authority = authority;
        this.clientId = clientId;
        this.scopes = scopes;
        this.resource = resource;
        if (!StringUtils.isEmpty(clientInfo.uid) && !StringUtils.isEmpty(clientInfo.utid)) {
            this.homeAccountIdentifier = `${cryptoObj.base64Encode(clientInfo.uid)}.${cryptoObj.base64Encode(clientInfo.utid)}`;
        }
    }

    equals(request: RequestThumbprint): boolean {
        return (
            this.authority != request.authority ||
            this.clientId != request.clientId ||
            this.scopes != request.scopes ||
            this.resource != request.resource ||
            this.homeAccountIdentifier != request.homeAccountIdentifier
        );
    }
}
