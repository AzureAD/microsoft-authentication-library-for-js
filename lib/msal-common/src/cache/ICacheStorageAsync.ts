import { InMemoryCache } from "../unifiedCache/utils/CacheTypes";

export interface ICacheStorageAsync {

    getCache(): Promise<InMemoryCache>;
    setCache(cache: InMemoryCache): Promise<void>;
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string>;
    removeItem(key: string): Promise<void>;
    containsKey(key: string): Promise<boolean>;
    getKeys(): Promise<Array<string>>;
    clear(): Promise<void>;

}
