/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CryptoKeyOptions } from "../crypto/BrowserCrypto";

// Cryptographic Algorithms used/supported
export enum Algorithms  {
    PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5",
    RSA_OAEP = "RSA-OAEP",
    AES_GCM = "AES-GCM",
    DIRECT = "dir",
    S256_HASH_ALG = "SHA-256",
}

// Numerical constants relating to bit/byte length
export enum Lengths {
    modulus = 2048
}

// Public Exponent used in Key Generation
export const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);

/**
 * JWK Key Format string (Type MUST be defined for window crypto APIs)
 */
export enum CryptoKeyFormats  {
    jwk = "jwk"
}

// Crypto Key Usage sets

type CryptoKeyUsageSet = {
    Keypair: KeyUsage[],
    PrivateKey: KeyUsage[]
};

interface TokenBindingKeyUsageSets {
    AccessTokenBinding: CryptoKeyUsageSet;
    RefreshTokenBinding: CryptoKeyUsageSet;
}

export const CryptoKeyUsageSets: TokenBindingKeyUsageSets = {
    AccessTokenBinding: {
        Keypair: ["sign", "verify"],
        PrivateKey: ["sign"]
    },
    RefreshTokenBinding: {
        Keypair: ["encrypt", "decrypt"],
        PrivateKey: ["decrypt"]
    }
};

interface TokenBindingKeyConfig {
    AccessTokenBinding: CryptoKeyOptions;
    RefreshTokenBinding: CryptoKeyOptions;
}

export const CryptoKeyConfig: TokenBindingKeyConfig = {
    AccessTokenBinding: {
        keyGenAlgorithmOptions: {
            name: Algorithms.PKCS1_V15_KEYGEN_ALG,
            hash: {
                name: Algorithms.S256_HASH_ALG
            },
            modulusLength: Lengths.modulus,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: CryptoKeyUsageSets.AccessTokenBinding.Keypair,
        privateKeyUsage: CryptoKeyUsageSets.AccessTokenBinding.PrivateKey
    },
    RefreshTokenBinding: {
        keyGenAlgorithmOptions: {     
            name: Algorithms.RSA_OAEP,
            hash: {
                name: Algorithms.S256_HASH_ALG
            },
            modulusLength: Lengths.modulus,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: CryptoKeyUsageSets.RefreshTokenBinding.Keypair,
        privateKeyUsage: CryptoKeyUsageSets.RefreshTokenBinding.PrivateKey
    }
};
