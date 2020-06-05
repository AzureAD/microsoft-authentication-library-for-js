export interface ICachePlugin {
    readFromStorage: () => Promise<string>;
    writeToStorage: (cache: string) => Promise<void>;
}
