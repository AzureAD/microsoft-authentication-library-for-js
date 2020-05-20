import { JsonCache } from '@azure/msal-common';

export interface ICachePlugin {
    readFromStorage: () => Promise<JsonCache>;
    writeToStorage: (cache: JsonCache) => Promise<void>;
}
