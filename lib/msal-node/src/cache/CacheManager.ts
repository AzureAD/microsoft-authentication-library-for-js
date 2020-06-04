import { Storage } from './Storage';
import {
    Serializer,
    Deserializer,
    JsonCache,
} from '@azure/msal-common';
import { ICachePlugin } from './ICachePlugin';

const defaultSerializedCache: JsonCache = {
    Account: {},
    IdToken: {},
    AccessToken: {},
    RefreshToken: {},
    AppMetadata: {},
};

export class CacheManager {
    hasChanged: boolean;
    storage: Storage;
    private persistence: ICachePlugin;

    constructor(storage: Storage, cachePlugin?: ICachePlugin) {
        this.hasChanged = false;
        this.storage = storage;
        this.storage.registerChangeEmitter(this.handleChangeEvent.bind(this));
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
            ...currentState,
        };
    }

    // TODO think about separating serialize / deserialize from writeToPersistance and readFromPersistance

    async serialize(): Promise<string> {
        const cache: string = JSON.stringify(
            Serializer.serializeAllCache(this.storage.getCache())
        );
        if (this.persistence) {
            const getMergedState = (stateFromDisk: any) => {
                let jsonFromDisk = {};
                try {
                    jsonFromDisk = JSON.parse(stateFromDisk);
                } catch (e) {
                    // TODO make first class error
                    throw Error('Invalid cachce from disk');
                }

                return JSON.stringify(
                    this.mergeState(
                        jsonFromDisk,
                        Serializer.serializeAllCache(this.storage.getCache())
                    ),
                    null,
                    4
                );
            };
            await this.persistence.writeToStorage(getMergedState);
        }
        this.hasChanged = false;
        return cache;
    }

    async deserialize(cache?: string): Promise<void> {
        if (this.persistence) {
            const stringCacheFromStorage = await this.persistence.readFromStorage();
            const deserializedCache = Deserializer.deserializeAllCache(
                this.overlayDefaults(JSON.parse(stringCacheFromStorage))
            );
            this.storage.setCache(deserializedCache);
        } else if (cache) {
            const deserializedCache = Deserializer.deserializeAllCache(
                this.overlayDefaults(JSON.parse(cache))
            );
            this.storage.setCache(deserializedCache);
        } else {
            // TODO make first class error
            throw Error('cache mus be configured');
        }
    }

    cacheHasChanged(): boolean {
        return this.hasChanged;
    }

    private overlayDefaults(passedInCache: JsonCache): JsonCache {
        return {
            Account: {
                ...defaultSerializedCache.Account,
                ...passedInCache.Account,
            },
            IdToken: {
                ...defaultSerializedCache.IdToken,
                ...passedInCache.IdToken,
            },
            AccessToken: {
                ...defaultSerializedCache.AccessToken,
                ...passedInCache.AccessToken,
            },
            RefreshToken: {
                ...defaultSerializedCache.RefreshToken,
                ...passedInCache.RefreshToken,
            },
            AppMetadata: {
                ...defaultSerializedCache.AppMetadata,
                ...passedInCache.AppMetadata,
            },
        };
    }
}
