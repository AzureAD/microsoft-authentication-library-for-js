/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class CacheHelper {
    /**
     * helper function to swap keys and objects
     * @param cacheMap
     */
    static swap(cacheMap: object) {
        var ret = {};
        for (var key in cacheMap) {
            ret[cacheMap[key]] = key;
        }
        return ret;
    }

    /**
     * helper function to map an obj to a new keyset
     * @param objAT
     * @param keysMap
     */
    static renameKeys(objAT: Object, keysMap: Object) {
        const keyValues = Object.keys(objAT).map(key => {
            const newKey = keysMap[key] || key;
            return { [newKey]: objAT[key] };
        });
        return Object.assign({}, ...keyValues);
    }
}
