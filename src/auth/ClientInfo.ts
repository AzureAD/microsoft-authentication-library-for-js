/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../utils/crypto/ICrypto";

/**
 * @hidden
 */
export class ClientInfo {

    private _uid: string;
    get uid(): string {
        return this._uid ? this._uid : "";
    }

    set uid(uid: string) {
        this._uid = uid;
    }

    private _utid: string;
    get utid(): string {
        return this._utid ? this._utid : "";
    }

    set utid(utid: string) {
        this._utid = utid;
    }

    constructor(rawClientInfo: string, crypto: ICrypto) {
        if (!rawClientInfo || StringUtils.isEmpty(rawClientInfo)) {
            this.uid = "";
            this.utid = "";
            return;
        }

        try {
            // const decodedClientInfo: string = crypto.base64Decode(rawClientInfo);
            const clientInfo: ClientInfo = JSON.parse("decodedClientInfo") as ClientInfo;
            if (clientInfo) {
                if (clientInfo.hasOwnProperty("uid")) {
                    this.uid = clientInfo.uid;
                }

                if (clientInfo.hasOwnProperty("utid")) {
                    this.utid = clientInfo.utid;
                }
            }
        } catch (e) {
            throw ClientAuthError.createClientInfoDecodingError(e);
        }
    }
}
