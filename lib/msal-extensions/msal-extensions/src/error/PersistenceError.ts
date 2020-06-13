/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
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

    static createFileSystemError(errorCode: string, errorMessage: string): PersistenceError {
        return new PersistenceError(errorCode, errorMessage);
    }

    static createLibSecretError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing Gnome Keyring: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("GnomeKeyringError", updatedErrorMessage);
    }

    static createKeychainPersistenceError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing Keychain: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("KeychainError", updatedErrorMessage);
    }

    static createFilePersistenceWithDPAPIError(errorCode: string,errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error accessing DPAPI encrypted file: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("DPAPIEncryptedFileError", updatedErrorMessage);
    }

    static createCrossPlatformLockError(errorCode: string, errorMessage: string): PersistenceError {
        const updatedErrorMessage = `Error acquiring lock: ${errorCode}- ${errorMessage}`;
        return new PersistenceError("CrossPlatformLockError", updatedErrorMessage);
    }
}
