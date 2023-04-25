/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ThrottlingConstants } from "../../utils/Constants";

export class ThrottlingEntity {
    // Unix-time value representing the expiration of the throttle
    throttleTime: number;
    // Information provided by the server
    error?: string;
    errorCodes?: Array<string>;
    errorMessage?: string;
    subError?: string;

    /**
     * validates if a given cache entry is "Throttling", parses <key,value>
     * @param key
     * @param entity
     */
    static isThrottlingEntity(key: string, entity?: object): boolean {
        let validateKey: boolean = false;
        if (key) {
            validateKey =
                key.indexOf(ThrottlingConstants.THROTTLING_PREFIX) === 0;
        }

        let validateEntity: boolean = true;
        if (entity) {
            validateEntity = entity.hasOwnProperty("throttleTime");
        }

        return validateKey && validateEntity;
    }
}
