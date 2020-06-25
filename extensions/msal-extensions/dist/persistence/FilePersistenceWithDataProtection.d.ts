import { IPersistence } from "./IPersistence";
import { DataProtectionScope } from "./DataProtectionScope";
export declare class FilePersistenceWithDataProtection implements IPersistence {
    private filePersistence;
    private scope;
    private optionalEntropy;
    constructor(scope: DataProtectionScope, optionalEntropy?: string);
    static create(fileLocation: string, scope: DataProtectionScope, optionalEntropy?: string): Promise<FilePersistenceWithDataProtection>;
    save(contents: string): Promise<void>;
    load(): Promise<string | null>;
    delete(): Promise<boolean>;
    reloadNecessary(lastSync: number): Promise<boolean>;
    getFilePath(): string;
}
