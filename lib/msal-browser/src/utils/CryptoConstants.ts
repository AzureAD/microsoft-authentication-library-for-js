/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

// Cryptographic Algorithms used/supported
export enum CryptoAlgorithms  {
    PKCS1_V15_KEYGEN_ALG = "RSASSA-PKCS1-v1_5",
    RSA_OAEP = "RSA-OAEP",
    AES_GCM = "AES-GCM",
    HMAC = "HMAC",
    DIRECT = "dir",
    S256_HASH_ALG = "SHA-256",
}

// Numerical constants relating to biy/bytelength
export enum CryptoLengths {
    MODULUS = 2048,
    DERIVED_KEY = 256, // L
    PRF_OUTPUT = 256, // h
    COUNTER = 256 // r
}

// Public Exponent used in Key Generation
export const PUBLIC_EXPONENT = new Uint8Array([0x01, 0x00, 0x01]);

// Supported Cryptographic Key Types
export enum CryptoKeyTypes {
    REQ_CNF = "req_cnf",
    STK_JWK = "stk_jwk"
}

/**
 * JWK Key Format string (Type MUST be defined for window crypto APIs)
 */
export enum CryptoKeyFormats  {
    JWK = "jwk",
    RAW = "raw"
}

// Crypto Key Usage sets
export const KEY_USAGES = {
    AT_BINDING: {
        KEYPAIR: ["sign", "verify"] as KeyUsage[],
        PRIVATE_KEY: ["sign"] as KeyUsage[]
    },
    RT_BINDING: {
        KEYPAIR: ["encrypt", "decrypt"] as KeyUsage[],
        PRIVATE_KEY: ["decrypt"] as KeyUsage[],
        DERIVATION_KEY: ["sign"] as KeyUsage[],
        SESSION_KEY: ["decrypt"] as KeyUsage[]
    }
};

export const CRYPTO_KEY_CONFIG = {
    AT_BINDING: {
        keyGenAlgorithmOptions: {
            name: CryptoAlgorithms.PKCS1_V15_KEYGEN_ALG,
            hash: {
                name: CryptoAlgorithms.S256_HASH_ALG
            },
            modulusLength: CryptoLengths.MODULUS,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: KEY_USAGES.AT_BINDING.KEYPAIR as KeyUsage[],
        privateKeyUsage: KEY_USAGES.AT_BINDING.PRIVATE_KEY as KeyUsage[]
    },
    RT_BINDING: {
        keyGenAlgorithmOptions: {     
            name: CryptoAlgorithms.RSA_OAEP,
            hash: {
                name: CryptoAlgorithms.S256_HASH_ALG
            },
            modulusLength: CryptoLengths.MODULUS,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: KEY_USAGES.RT_BINDING.KEYPAIR as KeyUsage[],
        privateKeyUsage: KEY_USAGES.RT_BINDING.PRIVATE_KEY as KeyUsage[]
    }
};

export enum KeyDerivationLabels {
    DECRYPTION = "AzureAD-SecureConversation-BoundRT-AES-GCM-SHA256",
    SIGNING = "AzureAD-SecureConversation-BoundRT-HS256"
}
