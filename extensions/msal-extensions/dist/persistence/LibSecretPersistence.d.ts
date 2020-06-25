import { IPersistence } from "./IPersistence";
export declare class LibSecretPersistence implements IPersistence {
    protected readonly serviceName: any;
    protected readonly accountName: any;
    private filePersistence;
    private constructor();
    static create(fileLocation: string, serviceName: string, accountName: string): Promise<LibSecretPersistence>;
    save(contents: string): Promise<void>;
    load(): Promise<string | null>;
    delete(): Promise<boolean>;
    reloadNecessary(lastSync: number): Promise<boolean>;
    getFilePath(): string;
}
