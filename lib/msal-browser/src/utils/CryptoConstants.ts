/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
export const KEY_USAGES = {
    AT_BINDING: {
        KEYPAIR: ["sign", "verify"],
        PRIVATE_KEY: ["sign"]
    },
    RT_BINDING: {
        KEYPAIR: ["encrypt", "decrypt"],
        PRIVATE_KEY: ["decrypt"]
    }
};

export const CRYPTO_KEY_CONFIG = {
    AT_BINDING: {
        keyGenAlgorithmOptions: {
            name: Algorithms.PKCS1_V15_KEYGEN_ALG,
            hash: {
                name: Algorithms.S256_HASH_ALG
            },
            modulusLength: Lengths.modulus,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: KEY_USAGES.AT_BINDING.KEYPAIR as KeyUsage[],
        privateKeyUsage: KEY_USAGES.AT_BINDING.PRIVATE_KEY as KeyUsage[]
    },
    RT_BINDING: {
        keyGenAlgorithmOptions: {     
            name: Algorithms.RSA_OAEP,
            hash: {
                name: Algorithms.S256_HASH_ALG
            },
            modulusLength: Lengths.modulus,
            publicExponent: PUBLIC_EXPONENT
        },
        keypairUsages: KEY_USAGES.RT_BINDING.KEYPAIR as KeyUsage[],
        privateKeyUsage: KEY_USAGES.RT_BINDING.PRIVATE_KEY as KeyUsage[]
    }
};
