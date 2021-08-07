/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Error thrown when trying to write MSAL cache to persistence.
 */
export class PersistenceError extends Error {

    // Short string denoting error
    errorCode: string;
    // Detailed description of error
    errorMessage: string;

    constructor(errorCode: string, errorMessage: string) {
        const errorString = errorMessage ? `${errorCode}: ${errorMessage}` : errorCode;
        super(errorString);
        Object.setPrototypeOf(this, PersistenceError.prototype);

        this.errorCode = errorCode;
        this.errorMessage = errorMessage;
        this.name = "PersistenceError";
    }

    /**
     * Error thrown when trying to access the file system.
     */
    static createFileSystemError(errorCode: string, errorMessage: string): PersistenceError {
        return new PersistenceError(errorCode, errorMessage);
    }

    /**
     * Error thrown when trying to write, load, or delete data from secret service on linux.
     * Libsecret is used to access secret service.
     */
    static createLibSecretError(errorMessage: string): PersistenceError {
        return new PersistenceError("GnomeKeyringError", errorMessage);
    }

    /**
     * Error thrown when trying to write, load, or delete data from keychain on macOs.
     */
    static createKeychainPersistenceError(errorMessage: string): PersistenceError {
        return new PersistenceError("KeychainError", errorMessage);
    }

    /**
     * Error thrown when trying to encrypt or decrypt data using DPAPI on Windows.
     */
    static createFilePersistenceWithDPAPIError(errorMessage: string): PersistenceError {
        return new PersistenceError("DPAPIEncryptedFileError", errorMessage);
    }

    /**
     * Error thrown when using the cross platform lock.
     */
    static createCrossPlatformLockError(errorMessage: string): PersistenceError {
        return new PersistenceError("CrossPlatformLockError", errorMessage);
    }

    /**
     * Throw cache persistence error
     * 
     * @param errorMessage string
     * @returns PersistenceError
     */
    static createCachePersistenceError(errorMessage: string): PersistenceError {
        return new PersistenceError("CachePersistenceError", errorMessage);
    }

    /**
     * Throw unsupported error
     * 
     * @param errorMessage string
     * @returns PersistenceError
     */
    static createNotSupportedError(errorMessage: string): PersistenceError {
        return new PersistenceError("NotSupportedError", errorMessage);
    }

    /**
     * Throw persistence not verified error
     * 
     * @param errorMessage string
     * @returns PersistenceError
     */
    static createPersistenceNotVerifiedError(errorMessage: string): PersistenceError {
        return new PersistenceError("PersistenceNotVerifiedError", errorMessage);
    }

    /**
     * Throw persistence creation validation error
     * 
     * @param errorMessage string
     * @returns PersistenceError
     */
    static createPersistenceNotValidatedError(errorMessage: string): PersistenceError {
        return new PersistenceError("PersistenceNotValidatedError", errorMessage);
    }
}
