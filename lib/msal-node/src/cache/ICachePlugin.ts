export interface ICachePlugin {
    readFromStorage: () => Promise<string>;
    writeToStorage: (
        getMergedState: (oldState: string) => string
    ) => Promise<void>;
}
