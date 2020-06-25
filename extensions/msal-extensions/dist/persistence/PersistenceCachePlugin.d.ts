import { IPersistence } from "../persistence/IPersistence";
import { CrossPlatformLockOptions } from "../lock/CrossPlatformLockOptions";
export declare class PersistenceCachePlugin {
    persistence: IPersistence;
    lastSync: number;
    currentCache: string;
    lockFilePath: string;
    private crossPlatformLock;
    private readonly lockOptions;
    constructor(persistence: IPersistence, lockOptions?: CrossPlatformLockOptions);
    readFromStorage(): Promise<string>;
    writeToStorage(callback: (diskState: string) => string): Promise<void>;
}
