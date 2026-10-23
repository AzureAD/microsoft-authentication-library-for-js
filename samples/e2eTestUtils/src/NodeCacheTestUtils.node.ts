/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import fs from "fs";

type CacheEntry = Record<string, unknown>;
type CacheSection = Record<string, CacheEntry>;

type RawCache = {
    Account?: CacheSection;
    IdToken?: CacheSection;
    AccessToken?: CacheSection;
    RefreshToken?: CacheSection;
    AppMetadata?: CacheSection;
    accounts?: CacheSection;
    idTokens?: CacheSection;
    accessTokens?: CacheSection;
    refreshTokens?: CacheSection;
};

function deserializeAccount(entry: CacheEntry): CacheEntry {
    return {
        homeAccountId: entry.home_account_id,
        environment: entry.environment,
        realm: entry.realm,
        localAccountId: entry.local_account_id,
        username: entry.username,
        authorityType: entry.authority_type,
        name: entry.name,
        clientInfo: entry.client_info,
        lastModificationTime: entry.last_modification_time,
        lastModificationApp: entry.last_modification_app,
        tenantProfiles: Array.isArray(entry.tenantProfiles)
            ? entry.tenantProfiles.map((profile) =>
                  JSON.parse(profile as string)
              )
            : undefined,
        lastUpdatedAt: Date.now().toString(),
    };
}

function deserializeIdToken(entry: CacheEntry): CacheEntry {
    return {
        homeAccountId: entry.home_account_id,
        environment: entry.environment,
        credentialType: entry.credential_type,
        clientId: entry.client_id,
        secret: entry.secret,
        realm: entry.realm,
        lastUpdatedAt: Date.now().toString(),
    };
}

function deserializeAccessToken(entry: CacheEntry): CacheEntry {
    return {
        homeAccountId: entry.home_account_id,
        environment: entry.environment,
        credentialType: entry.credential_type,
        clientId: entry.client_id,
        secret: entry.secret,
        realm: entry.realm,
        target: entry.target,
        cachedAt: entry.cached_at,
        expiresOn: entry.expires_on,
        extendedExpiresOn: entry.extended_expires_on,
        refreshOn: entry.refresh_on,
        keyId: entry.key_id,
        tokenType: entry.token_type,
        userAssertionHash: entry.userAssertionHash,
        resource: entry.resource,
        additionalCacheKeyComponents: entry.additionalCacheKeyComponents,
        lastUpdatedAt: Date.now().toString(),
    };
}

function deserializeRefreshToken(entry: CacheEntry): CacheEntry {
    return {
        homeAccountId: entry.home_account_id,
        environment: entry.environment,
        credentialType: entry.credential_type,
        clientId: entry.client_id,
        secret: entry.secret,
        familyId: entry.family_id,
        target: entry.target,
        realm: entry.realm,
        lastUpdatedAt: Date.now().toString(),
    };
}

function deserializeSection(
    section: CacheSection | undefined,
    deserializeEntry: (entry: CacheEntry) => CacheEntry
): CacheEntry[] {
    return Object.values(section ?? {}).map(deserializeEntry);
}

export type TokenMap = {
    idTokens: CacheEntry[];
    accessTokens: CacheEntry[];
    refreshTokens: CacheEntry[];
};

export class NodeCacheTestUtils {
    static async getTokens(cacheLocation: string): Promise<TokenMap> {
        const cache = await this.readCacheFile(cacheLocation);
        return {
            idTokens: cache.idTokens
                ? Object.values(cache.idTokens)
                : deserializeSection(cache.IdToken, deserializeIdToken),
            accessTokens: cache.accessTokens
                ? Object.values(cache.accessTokens)
                : deserializeSection(cache.AccessToken, deserializeAccessToken),
            refreshTokens: cache.refreshTokens
                ? Object.values(cache.refreshTokens)
                : deserializeSection(
                      cache.RefreshToken,
                      deserializeRefreshToken
                  ),
        };
    }

    static async getAccounts(cacheLocation: string): Promise<CacheSection> {
        const cache = await this.readCacheFile(cacheLocation);
        if (cache.accounts) {
            return cache.accounts;
        }

        return Object.fromEntries(
            Object.entries(cache.Account ?? {}).map(([key, entry]) => [
                key,
                deserializeAccount(entry),
            ])
        );
    }

    static async readCacheFile(cacheLocation: string): Promise<RawCache> {
        const data = await fs.promises.readFile(cacheLocation, "utf-8");
        return data ? (JSON.parse(data) as RawCache) : this.getCacheSchema();
    }

    static async waitForTokens(
        cacheLocation: string,
        interval: number
    ): Promise<TokenMap> {
        let tokenCache = await this.getTokens(cacheLocation);
        if (tokenCache.idTokens.length) {
            return tokenCache;
        }

        return new Promise((resolve) => {
            const intervalId = setInterval(async () => {
                tokenCache = await this.getTokens(cacheLocation);
                if (tokenCache.idTokens.length) {
                    clearInterval(intervalId);
                    resolve(tokenCache);
                }
            }, interval);
        });
    }

    static async writeToCacheFile(
        cacheLocation: string,
        cache: RawCache
    ): Promise<void> {
        await fs.promises.writeFile(
            cacheLocation,
            JSON.stringify(cache, null, 1)
        );
    }

    static async expireAccessTokens(cacheLocation: string): Promise<void> {
        const cache = await this.readCacheFile(cacheLocation);
        Object.values(cache.accessTokens ?? {}).forEach((entry) => {
            entry.expiresOn = "0";
            entry.extendedExpiresOn = "0";
        });
        Object.values(cache.AccessToken ?? {}).forEach((entry) => {
            entry.expires_on = "0";
            entry.extended_expires_on = "0";
        });
        await this.writeToCacheFile(cacheLocation, cache);
    }

    static async resetCache(cacheLocation: string): Promise<void> {
        await this.writeToCacheFile(cacheLocation, this.getCacheSchema());
    }

    private static getCacheSchema(): RawCache {
        return {
            Account: {},
            IdToken: {},
            AccessToken: {},
            RefreshToken: {},
            AppMetadata: {},
        };
    }
}
