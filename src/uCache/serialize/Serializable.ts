/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class Serializable {
    toObject(json: string) {
        const parsedObj = JSON.parse(json);
        for (let propertyName in parsedObj) {
            this[propertyName] = parsedObj[propertyName];
        }
    }
}
