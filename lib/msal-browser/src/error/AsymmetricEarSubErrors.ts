/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/** Diagnostics for asymmetric EAR crypto, persistence, and response validation. */
export const enum AsymmetricEarSubErrors {
    InvalidPrivateKey = "invalid_private_key",
    PrivateKeyImportFailed = "private_key_import_failed",
    InvalidPublicKeyCoordinates = "invalid_public_key_coordinates",
    InvalidJweFormatOrHeader = "invalid_jwe_format_or_header",
    ContentEncryptionKeyDerivationFailed = "content_encryption_key_derivation_failed",
    JweDecryptionFailed = "jwe_decryption_failed",
    InvalidPrivateKeyContext = "invalid_private_key_context",
    PrivateKeyReadFailed = "private_key_read_failed",
    PrivateKeyIdAlreadyInUse = "private_key_id_already_in_use",
    PrivateKeyPersistenceFailed = "private_key_persistence_failed",
    PrivateKeyContextMissingOrInvalid = "private_key_context_missing_or_invalid",
    PrivateKeyRemovalFailed = "private_key_removal_failed",
    SessionStorageUnavailable = "session_storage_unavailable",
    PrivateKeyIdMissing = "private_key_id_missing",
    RequestPersistenceFailed = "request_persistence_failed",
    RequestApvMismatch = "request_apv_mismatch",
    InvalidDecryptedResponsePayload = "invalid_decrypted_response_payload",
}
