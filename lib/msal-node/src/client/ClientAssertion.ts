/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { sign } from "jsonwebtoken";
import { TimeUtils, ClientAuthError } from "@azure/msal-common";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { EncodingUtils } from "../utils/EncodingUtils";
import { JwtConstants } from "../../src/utils/Constants";

/**
 * Client assertion of type jwt-bearer used in confidential client flows
 */
export class ClientAssertion {

    private jwt: string;
    private privateKey: string;
    private thumbprint: string;
    private expirationTime: number;
    private issuer: string;
    private jwtAudience: string;

    public static fromAssertion(assertion: string): ClientAssertion {
        const clientAssertion = new ClientAssertion();
        clientAssertion.jwt = assertion;
        return clientAssertion;
    }

    public static fromCertificate(thumbprint: string, privateKey: string): ClientAssertion {
        const clientAssertion = new ClientAssertion();
        clientAssertion.privateKey = privateKey;
        clientAssertion.thumbprint = thumbprint;
        return clientAssertion;
    }

    public getJwt(cryptoProvider: CryptoProvider, issuer: string, jwtAudience: string) {
        // if assertion was created from certificate, check if jwt is expired and create new one.
        if (this.privateKey != null && this.thumbprint != null) {

            if (this.jwt != null && !this.isExpired() && issuer == this.issuer && jwtAudience == this.jwtAudience) {
                return this.jwt;
            }

            return this.createJwt(cryptoProvider, issuer, jwtAudience);
        }

        /*
         * if assertion was created by caller, then we just append it. It is up to the caller to
         * ensure that it contains necessary claims and that it is not expired.
         */
        if (this.jwt != null) {
            return this.jwt;
        }

        throw ClientAuthError.createInvalidAssertionError();
    }

    // JWT format and required claims specified: https://tools.ietf.org/html/rfc7523#section-3
    private createJwt(cryptoProvider: CryptoProvider, issuer: string, jwtAudience: string): string {

        this.issuer = issuer;
        this.jwtAudience = jwtAudience;
        const issuedAt = TimeUtils.nowSeconds();
        this.expirationTime = issuedAt + 600;

        const header = {
            [JwtConstants.ALGORITHM]: JwtConstants.RSA_256,
            [JwtConstants.X5T]: EncodingUtils.base64EncodeUrl(this.thumbprint, "hex")
        };

        const payload = {
            [JwtConstants.AUDIENCE]: this.jwtAudience,
            [JwtConstants.EXPIRATION_TIME]: this.expirationTime,
            [JwtConstants.ISSUER]: this.issuer,
            [JwtConstants.SUBJECT]: this.issuer,
            [JwtConstants.NOT_BEFORE]: issuedAt,
            [JwtConstants.JWT_ID]: cryptoProvider.createNewGuid()
        };

        this.jwt = sign(payload, this.privateKey, { header: header });
        return this.jwt;
    }

    private isExpired(): boolean {
        return this.expirationTime < TimeUtils.nowSeconds();
    }
}
