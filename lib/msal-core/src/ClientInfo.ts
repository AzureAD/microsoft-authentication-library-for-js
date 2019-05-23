// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { Utils } from "./Utils";
import { ClientAuthError } from "./error/ClientAuthError";

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

  constructor(rawClientInfo: string) {
    if (!rawClientInfo || Utils.isEmpty(rawClientInfo)) {
      this.uid = "";
      this.utid = "";
      return;
    }

    try {
      const decodedClientInfo: string = Utils.base64DecodeStringUrlSafe(rawClientInfo);
      const clientInfo: ClientInfo = <ClientInfo>JSON.parse(decodedClientInfo);
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
