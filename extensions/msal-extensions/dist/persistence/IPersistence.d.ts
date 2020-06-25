export interface IPersistence {
    save(contents: string): Promise<void>;
    load(): Promise<string>;
    delete(): Promise<boolean>;
    reloadNecessary(lastSync: number): boolean;
    getFilePath(): string;
}
