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

    /**
     * Extracts the raw certs from a given certificate string and returns them in an array.
     * @param publicCertificate - electronic document provided to prove the ownership of the public key
     */
    /**
     * This is regex to identify the certs in a given certificate string.
     * We want to look for the contents between the BEGIN and END certificate strings, without the associated newlines.
     * The information in parens "(.+?)" is the capture group to represent the cert we want isolated.
     * "." means any string character, "+" means match 1 or more times, and "?" means the shortest match.
     * The "g" at the end of the regex means search the string globally, and the "s" enables the "." to match newlines.
     */
    /*
     *public static parseCertificate(publicCertificate: string): Array<string> {
     *  // paste above comment here
     *  const regexToFindCerts =
     *      /-----BEGIN CERTIFICATE-----\r*\n(.+?)\r*\n-----END CERTIFICATE-----/gs;
     *  const certs: string[] = [];
     *
     *  let matches;
     *  while ((matches = regexToFindCerts.exec(publicCertificate)) !== null) {
     *      // matches[1] represents the first parens capture group in the regex.
     *      certs.push(matches[1].replace(/\r*\n/g, Constants.EMPTY_STRING));
     *  }
     *
     *  return certs;
     *}
     */
}
