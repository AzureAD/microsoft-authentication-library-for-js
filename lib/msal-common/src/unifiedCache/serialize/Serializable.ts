/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class Serializable {
    toObject(obj: any) {
        for (const propertyName in obj) {
            this[propertyName] = obj[propertyName];
        }
    }
}
