/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** Diagnostics for asymmetric EAR crypto, request encoding, and response validation. */
export const enum AsymmetricEarSubErrors {
    RequestInitializationFailed = "request_initialization_failed",
    RequestEncodingFailed = "request_encoding_failed",
    InvalidPrivateKey = "invalid_private_key",
    PrivateKeyImportFailed = "private_key_import_failed",
    InvalidPublicKeyCoordinates = "invalid_public_key_coordinates",
    InvalidJweFormatOrHeader = "invalid_jwe_format_or_header",
    ContentEncryptionKeyDerivationFailed = "content_encryption_key_derivation_failed",
    JweDecryptionFailed = "jwe_decryption_failed",
    RequestApvMismatch = "request_apv_mismatch",
    InvalidDecryptedResponsePayload = "invalid_decrypted_response_payload",
}
