/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Separators, CacheKeyPosition } from "../../utils/Constants";

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
        return homeAccountId === key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.HOME_ACCOUNT_ID];
    }

    /**
     *
     * @param key
     * @param environment
     */
    static matchEnvironment(key: string, environment: string): boolean {
        return environment === key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.ENVIRONMENT];
    }

    /**
     *
     * @param key
     * @param credentialType
     * // TODO: Confirm equality for enum vs string here
     */
    static matchCredentialType(key: string, credentialType: string): boolean {
        return credentialType == key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.CREDENTIAL_TYPE];
    }

    /**
     *
     * @param key
     * @param clientId
     */
    static matchClientId(key: string, clientId: string): boolean {
        return clientId === key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.CLIENT_ID];
    }

    /**
     *
     * @param key
     * @param realm
     */
    static matchRealm(key: string, realm: string): boolean {
        return realm === key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.REALM];
    }

    /**
     *
     * @param key
     * @param target
     */
    static matchTarget(key: string, target: string): boolean {
        return this.targetsIntersect(key.split(Separators.CACHE_KEY_SEPARATOR)[CacheKeyPosition.TARGET], target);
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
}
