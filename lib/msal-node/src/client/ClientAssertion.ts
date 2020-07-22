/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { sign } from "jsonwebtoken";
import { TimeUtils } from "@azure/msal-common";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { EncodingUtils } from '../utils/EncodingUtils';

export class ClientAssertion {

    public static readonly ASSERTION_TYPE = "urn:ietf:params:oauth:client-assertion-type:jwt-bearer";
    private jwt: string;

    private privateKey: string;
    private thumbprint: string;

    private expirationTime: number;
    private issuer: string;
    private jwtAudience: string;

    public static fromAssertion(assertion: string): ClientAssertion {
        let clientAssertion = new ClientAssertion();
        clientAssertion.jwt = assertion;
        return clientAssertion;
    }

    public static fromCertificate(thumbprint: string, privateKey: string): ClientAssertion {
        let clientAssertion = new ClientAssertion();
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

        // if assertion was created by caller, then we just append it. It is up to the caller to
        // ensure that it contains necessary claims and that it is not expired.
        if (this.jwt != null) {
            return this.jwt;
        }

        //TODO throw proper error
        throw Error();
    }

    // JWT format and required claims specified: https://tools.ietf.org/html/rfc7523#section-3
    private createJwt(cryptoProvider: CryptoProvider, issuer: string, jwtAudience: string): string {

        this.issuer = issuer;
        this.jwtAudience = jwtAudience;
        const issuedAt = TimeUtils.nowSeconds();
        this.expirationTime = issuedAt + 600;

        const header = {
            "alg": "RS256",
            "x5t": EncodingUtils.base64EncodeUrl(this.thumbprint, "hex")
        }

        const payload = {
            "aud": this.jwtAudience,
            "exp": this.expirationTime,
            "iss": this.issuer,
            "sub": this.issuer,
            "nbf": issuedAt,
            "jti": cryptoProvider.createNewGuid()
        }

        return sign(payload, this.privateKey, { header: header });
    }

    private isExpired(): boolean {
        return this.expirationTime < TimeUtils.nowSeconds();
    }
}
