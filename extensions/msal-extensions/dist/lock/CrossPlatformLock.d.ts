import { CrossPlatformLockOptions } from "./CrossPlatformLockOptions";
/**
 * Cross-process lock that works on all platforms.
 */
export declare class CrossPlatformLock {
    private readonly lockFilePath;
    private lockFileDescriptor;
    private readonly retryNumber;
    private readonly retryDelay;
    constructor(lockFilePath: string, lockOptions?: CrossPlatformLockOptions);
    lock(): Promise<void>;
    unlock(): Promise<void>;
    private sleep;
}
