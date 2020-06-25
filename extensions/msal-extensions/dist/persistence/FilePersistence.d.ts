import { IPersistence } from "./IPersistence";
export declare class FilePersistence implements IPersistence {
    private filePath;
    static create(fileLocation: string): Promise<FilePersistence>;
    save(contents: string): Promise<void>;
    saveBuffer(contents: Uint8Array): Promise<void>;
    load(): Promise<string>;
    loadBuffer(): Promise<Uint8Array>;
    delete(): Promise<boolean>;
    getFilePath(): string;
    reloadNecessary(lastSync: number): Promise<boolean>;
    private timeLastModified;
    private createCacheFile;
    private createFileDirectory;
}
