/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import jwt from "jsonwebtoken";
import {
    TimeUtils,
    createClientAuthError,
    ClientAuthErrorCodes,
} from "@azure/msal-common";
import { CryptoProvider } from "../crypto/CryptoProvider.js";
import { EncodingUtils } from "../utils/EncodingUtils.js";
import { JwtConstants } from "../utils/Constants.js";
import { x509Certificate } from "../config/Configuration.js";
import { X509Certificate } from "crypto";

/**
 * Client assertion of type jwt-bearer used in confidential client flows
 * @public
 */
export class ClientAssertion {
    private jwt: string;
    private privateKey: string;
    private x5c: string;
    private thumbprint: string;
    private expirationTime: number;
    private issuer: string;
    private jwtAudience: string;

    /**
     * Initialize the ClientAssertion class from the clientAssertion passed by the user
     * @param assertion - refer https://tools.ietf.org/html/rfc7521
     */
    public static fromAssertion(assertion: string): ClientAssertion {
        const clientAssertion = new ClientAssertion();
        clientAssertion.jwt = assertion;
        return clientAssertion;
    }

    /**
     * Initialize the ClientAssertion class from the certificate passed by the user
     * @param x509Certificate - contains the X509Certificate, string private key and the boolean x5C
     * @returns the client assertion object that will be used in getJwt
     */
    public static fromCertificate(
        clientCertificate: x509Certificate
    ): ClientAssertion {
        const clientAssertion = new ClientAssertion();
        clientAssertion.thumbprint = (
            clientCertificate.x509Certificate as X509Certificate
        ).fingerprint256;
        clientAssertion.privateKey = clientCertificate.privateKey;

        if (clientCertificate.sendX5C) {
            clientAssertion.x5c = EncodingUtils.base64Decode(
                clientCertificate.x509Certificate.toString()
            );
        }
        return clientAssertion;
    }

    /**
     * Update JWT for certificate based clientAssertion, if passed by the user, uses it as is
     * @param cryptoProvider - library's crypto helper
     * @param issuer - iss claim
     * @param jwtAudience - aud claim
     */
    public getJwt(
        cryptoProvider: CryptoProvider,
        issuer: string,
        jwtAudience: string
    ): string {
        // if assertion was created from certificate, check if jwt is expired and create new one.
        if (this.privateKey && this.thumbprint) {
            if (
                this.jwt &&
                !this.isExpired() &&
                issuer === this.issuer &&
                jwtAudience === this.jwtAudience
            ) {
                return this.jwt;
            }

            return this.createJwt(cryptoProvider, issuer, jwtAudience);
        }

        /*
         * if assertion was created by caller, then we just append it. It is up to the caller to
         * ensure that it contains necessary claims and that it is not expired.
         */
        if (this.jwt) {
            return this.jwt;
        }

        throw createClientAuthError(ClientAuthErrorCodes.invalidAssertion);
    }

    /**
     * JWT format and required claims specified: https://tools.ietf.org/html/rfc7523#section-3
     */
    private createJwt(
        cryptoProvider: CryptoProvider,
        issuer: string,
        jwtAudience: string
    ): string {
        this.issuer = issuer;
        this.jwtAudience = jwtAudience;
        const issuedAt = TimeUtils.nowSeconds();
        this.expirationTime = issuedAt + 600;

        const header: jwt.JwtHeader = {
            alg: JwtConstants.RSA_256,
            x5t: EncodingUtils.base64EncodeUrl(this.thumbprint, "hex"),
        };

        if (this.x5c) {
            Object.assign(header, {
                x5c: this.x5c,
            } as Partial<jwt.JwtHeader>);
        }

        const payload = {
            [JwtConstants.AUDIENCE]: this.jwtAudience,
            [JwtConstants.EXPIRATION_TIME]: this.expirationTime,
            [JwtConstants.ISSUER]: this.issuer,
            [JwtConstants.SUBJECT]: this.issuer,
            [JwtConstants.NOT_BEFORE]: issuedAt,
            [JwtConstants.JWT_ID]: cryptoProvider.createNewGuid(),
        };

        this.jwt = jwt.sign(payload, this.privateKey, { header });
        return this.jwt;
    }

    /**
     * Utility API to check expiration
     */
    private isExpired(): boolean {
        return this.expirationTime < TimeUtils.nowSeconds();
    }
}
