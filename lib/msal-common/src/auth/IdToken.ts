/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { StringDict } from "../utils/MsalTypes";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../utils/crypto/ICrypto";

/**
 * @hidden
 */
export class IdToken {

    issuer: string;
    objectId: string;
    subject: string;
    tenantId: string;
    version: string;
    preferredName: string;
    name: string;
    homeObjectId: string;
    nonce: string;
    expiration: string;
    rawIdToken: string;
    claims: StringDict;
    sid: string;
    cloudInstance: string;
    /* tslint:disable:no-string-literal */
    constructor(rawIdToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawIdToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
        }
        try {
            this.rawIdToken = rawIdToken;
            this.claims = IdToken.extractIdToken(rawIdToken, crypto);
            if (this.claims) {
                if (this.claims.hasOwnProperty("iss")) {
                    this.issuer = this.claims["iss"];
                }

                if (this.claims.hasOwnProperty("oid")) {
                    this.objectId = this.claims["oid"];
                }

                if (this.claims.hasOwnProperty("sub")) {
                    this.subject = this.claims["sub"];
                }

                if (this.claims.hasOwnProperty("tid")) {
                    this.tenantId = this.claims["tid"];
                }

                if (this.claims.hasOwnProperty("ver")) {
                    this.version = this.claims["ver"];
                }

                if (this.claims.hasOwnProperty("preferred_username")) {
                    this.preferredName = this.claims["preferred_username"];
                }

                if (this.claims.hasOwnProperty("name")) {
                    this.name = this.claims["name"];
                }

                if (this.claims.hasOwnProperty("nonce")) {
                    this.nonce = this.claims["nonce"];
                }

                if (this.claims.hasOwnProperty("exp")) {
                    this.expiration = this.claims["exp"];
                }

                if (this.claims.hasOwnProperty("home_oid")) {
                    this.homeObjectId = this.claims["home_oid"];
                }

                if (this.claims.hasOwnProperty("sid")) {
                    this.sid = this.claims["sid"];
                }

                if (this.claims.hasOwnProperty("cloud_instance_host_name")) {
                    this.cloudInstance = this.claims["cloud_instance_host_name"];
                }
                /* tslint:enable:no-string-literal */
            }
        } catch (e) {
            /*
             * TODO: This error here won't really every be thrown, since extractIdToken() returns null if the decodeJwt() fails.
             * Need to add better error handling here to account for being unable to decode jwts.
             */
            throw ClientAuthError.createIdTokenParsingError(e);
        }
    }

    /**
     * Extract IdToken by decoding the RAWIdToken
     *
     * @param encodedIdToken
     */
    static extractIdToken(encodedIdToken: string, crypto: ICrypto): any {
        // id token will be decoded to get the username
        const decodedToken = StringUtils.decodeJwt(encodedIdToken);
        if (!decodedToken) {
            return null;
        }
        try {
            const base64IdToken = decodedToken.JWSPayload;
            const base64Decoded = crypto.base64Decode(base64IdToken);
            if (!base64Decoded) {
                // this._requestContext.logger.info("The returned id_token could not be base64 url safe decoded.");
                return null;
            }
            // ECMA script has JSON built-in support
            return JSON.parse(base64Decoded);
        } catch (err) {
            // this._requestContext.logger.error("The returned id_token could not be decoded" + err);
        }

        return null;
    }
}
