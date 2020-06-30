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
    static createLibSecretError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing Gnome Keyring: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("GnomeKeyringError", updatedErrorMessage);
    }

    /**
     * Error thrown when trying to write, load, or delete data from keychain on macOs.
     */
    static createKeychainPersistenceError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing Keychain: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("KeychainError", updatedErrorMessage);
    }

    /**
     * Error thrown when trying to encrypt or decrypt data using DPAPI on Windows.
     */
    static createFilePersistenceWithDPAPIError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing DPAPI encrypted file: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("DPAPIEncryptedFileError", updatedErrorMessage);
    }

    /**
     * Error thrown when using the cross platform lock.
     */
    static createCrossPlatformLockError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error acquiring lock: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("CrossPlatformLockError", updatedErrorMessage);
    }
}
