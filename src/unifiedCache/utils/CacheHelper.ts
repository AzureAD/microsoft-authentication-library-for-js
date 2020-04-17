/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { StringDict } from "../../utils/MsalTypes";

export class CacheHelper {
    /**
     * Helper to convert serialized data to object
     * @param obj
     * @param json
     */
    static toObject<T>(obj: T, json: StringDict): T {
        for (const propertyName in json) {
            obj[propertyName] = json[propertyName];
        }
        return obj;
    }

    /**
     * helper function to swap keys and objects
     * @param cacheMap
     */
    static swap(cacheMap: object) {
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
    static renameKeys(objAT: Object, keysMap: Object) {
        const keyValues = Object.keys(objAT).map((key) => {
            if (objAT[key]) {
                const newKey = keysMap[key] || key;
                return { [newKey]: objAT[key] };
            }
            return null;
        });
        return Object.assign({}, ...keyValues);
    }
}
