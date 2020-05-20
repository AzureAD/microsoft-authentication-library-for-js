import { Storage } from './Storage';
import { Serializer, Deserializer, InMemoryCache, JsonCache } from '@azure/msal-common';
import { ICachePlugin } from './ICachePlugin';

const defaultSerializedCache: JsonCache = {
    Account: {},
    IdToken: {},
    AccessToken: {},
    RefreshToken: {},
    AppMetadata: {}
};


export class CacheManager {

    hasChanged: boolean;
    storage: Storage;
    persistence: ICachePlugin;

    constructor(storage: Storage, cachePlugin?: ICachePlugin) {
        this.hasChanged = false;
        this.storage = storage;
        this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this))
        if (cachePlugin) {
            this.setPersistence(cachePlugin);
        }

    }

    setPersistence(persistence: ICachePlugin): void {
        this.persistence = persistence;
    }

    handleChangeEvent() {
        this.hasChanged = true;
    }

    mergeState(oldState: JsonCache, currentState: JsonCache) {
        // TODO
        // mergeUpdates(old, new)
        // mergeRemovals(old, new)
        return {
            ...oldState,
            ...currentState
        };
    }

    //TODO think about separating serialize / deserialize from writeToPersistance and readFromPersistance

    async serialize(): Promise<string> {
        const cache: string = JSON.stringify(Serializer.serializeAllCache(this.storage.getCache()));
        if (this.persistence) {
            await this.persistence.writeToStorage((stateFromDisk) => {
                const jsonFromDisk = JSON.parse(stateFromDisk);
                return JSON.stringify(
                    this.mergeState(
                        jsonFromDisk,
                        Serializer.serializeAllCache(this.storage.getCache())
                    ), null, 4
                );
            });
        }
        this.hasChanged = false;
        return cache;
    }

    async deserialize(cache?: string): Promise<void> {
        let deserializedCache: InMemoryCache;
        if (this.persistence) {
            const stringCacheFromStorage = await this.persistence.readFromStorage();
            deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(stringCacheFromStorage)));
        } else if (cache) {
            deserializedCache = Deserializer.deserializeAllCache(this.overlayDefaults(JSON.parse(cache)));
        } else {
            throw Error("Cache Must be passed in or configured");
        }
        this.storage.setCache(deserializedCache)
    }

    cacheHasChanged(): boolean {
        return this.hasChanged;
    }

    private overlayDefaults (passedInCache: JsonCache): JsonCache {
        return {
            Account: { ...defaultSerializedCache.Account, ...passedInCache.Account },
            IdToken: { ...defaultSerializedCache.IdToken, ...passedInCache.IdToken },
            AccessToken: { ...defaultSerializedCache.AccessToken, ...passedInCache.AccessToken },
            RefreshToken: { ...defaultSerializedCache.RefreshToken, ...passedInCache.RefreshToken },
            AppMetadata: { ...defaultSerializedCache.AppMetadata, ...passedInCache.AppMetadata}
        };
    }

}
