/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { NetworkResponse } from "./NetworkManager";
import { ServerAuthorizationTokenResponse } from "../server/ServerAuthorizationTokenResponse";
import { Constants, HeaderNames } from "../utils/Constants";
import { CacheManager } from "../cache/CacheManager";
import { StringUtils } from "../utils/StringUtils";
import { ServerError } from "../error/ServerError";
import { RequestThumbprint } from "./RequestThumbprint";
import { RequestThumbprintValue } from "./RequestThumbprintValue";

export class ThrottlingUtils {

    /**
     * Prepares a RequestThumbprint to be stored as a key.
     * @param thumbprint
     */
    static generateThrottlingStorageKey(thumbprint: RequestThumbprint): string {
        return `${Constants.THROTTLE_PREFIX}.${JSON.stringify(thumbprint)}`;
    }

    /**
     * Performs necessary throttling checks before a network request.
     * @param cacheManager
     * @param thumbprint 
     */
    static preProcess(cacheManager: CacheManager, thumbprint: RequestThumbprint): void {
        const key = ThrottlingUtils.generateThrottlingStorageKey(thumbprint);
        const storageValue = cacheManager.getItem(key) as string;

        if (storageValue) {
            const parsedValue = StringUtils.jsonParseHelper<RequestThumbprintValue>(storageValue);

            if (parsedValue) {
                if (parsedValue.throttleTime < Date.now()) {
                    cacheManager.removeItem(key);
                    return;
                }
                throw new ServerError(parsedValue.errorCodes.join(" "), parsedValue.errorMessage, parsedValue.subError);
            }
        }
    }

    /**
     * Performs necessary throttling checks after a network request.
     * @param cacheManager
     * @param thumbprint 
     * @param response
     */    
    static postProcess(cacheManager: CacheManager, thumbprint: RequestThumbprint, response: NetworkResponse<ServerAuthorizationTokenResponse>): void {
        if (ThrottlingUtils.checkResponseStatus(response) || ThrottlingUtils.checkResponseForRetryAfter(response)) {
            const thumbprintValue: RequestThumbprintValue = {
                throttleTime: ThrottlingUtils.calculateThrottleTime(parseInt(response.headers.get(HeaderNames.RETRY_AFTER))),
                error: response.body.error,
                errorCodes: response.body.error_codes,
                errorMessage: response.body.error_description,
                subError: response.body.suberror
            };
            cacheManager.setItem(
                ThrottlingUtils.generateThrottlingStorageKey(thumbprint),
                JSON.stringify(thumbprintValue)
            );
        }
    }

    /**
     * Checks a NetworkResponse object's status codes against 429 or 5xx
     * @param response
     */
    static checkResponseStatus(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.status == 429 || response.status >= 500 && response.status < 600;
    }

    /**
     * Checks a NetworkResponse object's RetryAfter header
     * @param response
     */
    static checkResponseForRetryAfter(response: NetworkResponse<ServerAuthorizationTokenResponse>): boolean {
        return response.headers.has(HeaderNames.RETRY_AFTER) && (response.status < 200 || response.status >= 300);
    }

    /**
     * Calculates the Unix-time value for a throttle to expire given throttleTime in seconds.
     * @param throttleTime
     */
    static calculateThrottleTime(throttleTime: number): number {
        if(throttleTime <= 0) {
            throttleTime = null;
        }
        const currentSeconds = Date.now() / 1000;
        return Math.floor(Math.min(
            currentSeconds + (throttleTime || Constants.DEFAULT_THROTTLE_TIME_SECONDS),
            currentSeconds + Constants.DEFAULT_MAX_THROTTLE_TIME_SECONDS
        ) * 1000);
    }
}
