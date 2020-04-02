/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class CacheInterface {
    // TODO: should this be the type: string or a custom type that indicates a in-memory JSON Object
    static retrieveJSONBlob(json: string) {
        let JSONBlob;

        json ? (JSONBlob = json) : (JSONBlob = {});
        return JSONBlob;
    }

    // serialize
    static serializeJSONBlob(data: string) {
        return JSON.stringify(data);
    }

    // de-serialize
    static deserializeJSONBlob(data: string) {
        if (Object.keys(data).length < 1) return {};

        return JSON.parse(data);
    }
}
