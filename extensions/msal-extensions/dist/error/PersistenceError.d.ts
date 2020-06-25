export declare class PersistenceError extends Error {
    errorCode: string;
    errorMessage: string;
    constructor(errorCode: string, errorMessage: string);
    static createFileSystemError(errorCode: string, errorMessage: string): PersistenceError;
    static createLibSecretError(errorCode: string, errorMessage: string): PersistenceError;
    static createKeychainPersistenceError(errorCode: string, errorMessage: string): PersistenceError;
    static createFilePersistenceWithDPAPIError(errorCode: string, errorMessage: string): PersistenceError;
    static createCrossPlatformLockError(errorCode: string, errorMessage: string): PersistenceError;
}
