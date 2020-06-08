/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {Separators, CredentialKeyPosition, CacheType, CacheSchemaType, CredentialType, EnvironmentAliases} from "../../utils/Constants";

export class CacheHelper {
    /**
     * Helper to convert serialized data to object
     * @param obj
     * @param json
     */
    static toObject<T>(obj: T, json: object): T {
        for (const propertyName in json) {
            obj[propertyName] = json[propertyName];
        }
        return obj;
    }

    /**
     * helper function to swap keys and objects
     * @param cacheMap
     */
    static swap(cacheMap: object): object {
        const ret = {};
        for (const key in cacheMap) {
            ret[cacheMap[key]] = key;
        }
        return ret;
    }

    /**
     * helper function to map an obj to a new keyset
     * @param objAT
     * @param keysMap
     */
    static renameKeys(objAT: Object, keysMap: Object): object {
        const keyValues = Object.keys(objAT).map((key) => {
            if (objAT[key]) {
                const newKey = keysMap[key] || key;
                return { [newKey]: objAT[key] };
            }
            return null;
        });
        return Object.assign({}, ...keyValues);
    }

    /**
     *
     * @param key
     * @param homeAccountId
     */
    static matchHomeAccountId(key: string, homeAccountId: string): boolean {
        return (
            homeAccountId ===
            key.split(Separators.CACHE_KEY_SEPARATOR)[
                CredentialKeyPosition.HOME_ACCOUNT_ID
            ]
        );
    }

    /**
     *
     * @param key
     * @param environment
     * // TODO: Add Cloud specific aliases based on current cloud
     */
    static matchEnvironment(key: string, environment: string): boolean {
        const cachedEnvironment = key.split(Separators.CACHE_KEY_SEPARATOR)[CredentialKeyPosition.ENVIRONMENT];
        if (EnvironmentAliases.includes(environment) && EnvironmentAliases.includes(cachedEnvironment)) {
            return true;
        }

        return false;
    }

    /**
     *
     * @param key
     * @param credentialType
     * // TODO: Confirm equality for enum vs string here
     */
    static matchCredentialType(key: string, credentialType: string): boolean {
        return (
            credentialType.toLowerCase() ===
            key
                .split(Separators.CACHE_KEY_SEPARATOR)
                [CredentialKeyPosition.CREDENTIAL_TYPE].toString()
                .toLowerCase()
        );
    }

    /**
     *
     * @param key
     * @param clientId
     */
    static matchClientId(key: string, clientId: string): boolean {
        return (
            clientId ===
            key.split(Separators.CACHE_KEY_SEPARATOR)[
                CredentialKeyPosition.CLIENT_ID
            ]
        );
    }

    /**
     *
     * @param key
     * @param realm
     */
    static matchRealm(key: string, realm: string): boolean {
        return (
            realm ===
            key.split(Separators.CACHE_KEY_SEPARATOR)[
                CredentialKeyPosition.REALM
            ]
        );
    }

    /**
     *
     * @param key
     * @param target
     */
    static matchTarget(key: string, target: string): boolean {
        return CacheHelper.targetsIntersect(
            key.split(Separators.CACHE_KEY_SEPARATOR)[
                CredentialKeyPosition.TARGET
            ],
            target
        );
    }

    /**
     * returns a boolean if the sets of scopes intersect (scopes are stored as "target" in cache)
     * @param target
     * @param credentialTarget
     */
    static targetsIntersect(credentialTarget: string, target: string): boolean {
        const targetSet = new Set(target.split(" "));
        const credentialTargetSet = new Set(credentialTarget.split(" "));

        let isSubset = true;
        targetSet.forEach((key) => {
            isSubset = isSubset && credentialTargetSet.has(key);
        });

        return isSubset;
    }

    /**
     * helper function to return `CredentialType`
     * @param key
     */
    static getCredentialType(key: string): string {
        return key.split(Separators.CACHE_KEY_SEPARATOR)[
            CredentialKeyPosition.CREDENTIAL_TYPE
        ];
    }

    /**
     * generates Account Id for keys
     * @param homeAccountId
     * @param environment
     */
    static generateAccoundIdForCacheKey(homeAccountId: string, environment: string): string {
        const accountId: Array<string> = [homeAccountId, environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generates Credential Id for keys
     * @param credentialType
     * @param realm
     * @param clientId
     * @param familyId
     */
    static generateCredentialIdForCacheKey(credentialType: CredentialType, clientId: string, realm?: string, familyId?: string): string {
        const clientOrFamilyId = (credentialType === CredentialType.REFRESH_TOKEN)
            ? familyId || clientId
            : clientId;
        const credentialId: Array<string> = [
            credentialType,
            clientOrFamilyId,
            realm || "",
        ];

        return credentialId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate target key component as per schema: <target>
     */
    static generateTargetForCacheKey(scopes: string): string {
        return (scopes || "").toLowerCase();
    }

    /**
     * generates credential key
     */
    static generateCacheKey(
        homeAccountId: string,
        environment: string,
        credentialType: CredentialType,
        clientId: string,
        realm?: string,
        target?: string,
        familyId?: string
    ): string {
        const credentialKey = [
            this.generateAccoundIdForCacheKey(homeAccountId, environment),
            this.generateCredentialIdForCacheKey(credentialType, clientId, realm, familyId),
            this.generateTargetForCacheKey(target),
        ];

        return credentialKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * helper function to return `CacheSchemaType`
     * @param key
     */
    static getCacheType(type: number): string {
        switch (type) {
            case CacheType.ADFS:
            case CacheType.MSA:
            case CacheType.MSSTS:
            case CacheType.GENERIC:
                return CacheSchemaType.ACCOUNT;

            case CacheType.ACCESS_TOKEN:
            case CacheType.REFRESH_TOKEN:
            case CacheType.ID_TOKEN:
                return CacheSchemaType.CREDENTIAL;

            case CacheType.APP_META_DATA:
                return CacheSchemaType.APP_META_DATA;

            default: {
                console.log("Invalid cache type");
                return null;
            }
        }
    }
}
