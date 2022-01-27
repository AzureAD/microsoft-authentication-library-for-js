/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { TokenValidationParameters } from "../config/TokenValidationParameters";

export interface AlgorithmValidator {
    validateAlgorithm(algorithm: string[], key: any, token: string, validationParameters: TokenValidationParameters): Boolean;
}

export interface AudienceValidator {
    validateAudience(audiences: string[], token: string, validationParameters: TokenValidationParameters): Boolean;
}

export interface IssuerValidator {
    validateIssuer(issuer: string[], token: string, validationParameters: TokenValidationParameters): string; // string here?
}

export interface LifetimeValidator {
    validateLifetime(notBefore: Date, expires: Date, token: string, validationParameters: TokenValidationParameters): Boolean;
}

export interface SignatureValidator {
    validateSignature(token: string, validationParameters: TokenValidationParameters): string; // Return a security token?
}

export interface TypeValidator {
    validateType(type: string[], header: any, validationParameters: TokenValidationParameters): string; // Return token type
}

export interface  IssuerSigningKeyValidator {
    validateIssuerSigningKey(key: string, token: string, validationParameters: TokenValidationParameters): Boolean;
}

export interface IssuerSigningKeyResolver {
    resolveIssuerSigningKey(token: string, kid: string, validationParameters: TokenValidationParameters): string[]; // IEnumerable<SecurityKey> ??
}

export interface TokenDecryptionKeyResolver {
    resolveTokenDecryptionKey(token: string, kid: string, validationParameters: TokenValidationParameters): string[]; // IEnumerable<SecurityKey> ??
}
