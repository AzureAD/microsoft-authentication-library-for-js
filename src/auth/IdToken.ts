/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientAuthError } from "../error/ClientAuthError";
import { StringDict } from "../utils/MsalTypes";
import { StringUtils } from "../utils/StringUtils";
import { ICrypto } from "../utils/crypto/ICrypto";
import { IdTokenClaimName } from "../utils/Constants";

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
    constructor(rawIdToken: string, crypto: ICrypto) {
        if (StringUtils.isEmpty(rawIdToken)) {
            throw ClientAuthError.createIdTokenNullOrEmptyError(rawIdToken);
        }

        this.rawIdToken = rawIdToken;
        this.claims = IdToken.extractIdToken(rawIdToken, crypto);
        if (this.claims.hasOwnProperty(IdTokenClaimName.ISSUER)) {
            this.issuer = this.claims[IdTokenClaimName.ISSUER];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.OBJID)) {
            this.objectId = this.claims[IdTokenClaimName.OBJID];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.SUBJECT)) {
            this.subject = this.claims[IdTokenClaimName.SUBJECT];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.TENANTID)) {
            this.tenantId = this.claims[IdTokenClaimName.TENANTID];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.VERSION)) {
            this.version = this.claims[IdTokenClaimName.VERSION];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.PREF_USERNAME)) {
            this.preferredName = this.claims[IdTokenClaimName.PREF_USERNAME];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.NAME)) {
            this.name = this.claims[IdTokenClaimName.NAME];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.NONCE)) {
            this.nonce = this.claims[IdTokenClaimName.NONCE];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.EXPIRATION)) {
            this.expiration = this.claims[IdTokenClaimName.EXPIRATION];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.HOME_OBJID)) {
            this.homeObjectId = this.claims[IdTokenClaimName.HOME_OBJID];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.SESSIONID)) {
            this.sid = this.claims[IdTokenClaimName.SESSIONID];
        }

        if (this.claims.hasOwnProperty(IdTokenClaimName.CLOUD_INSTANCE_HOSTNAME)) {
            this.cloudInstance = this.claims[IdTokenClaimName.CLOUD_INSTANCE_HOSTNAME];
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
            // base64Decode() should throw an error if there is an issue
            const base64Decoded = crypto.base64Decode(base64IdToken);
            return JSON.parse(base64Decoded);
        } catch (err) {
            throw ClientAuthError.createIdTokenExtractionError(err);
        }
    }
}
